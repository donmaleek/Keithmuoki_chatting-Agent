import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  forwardRef
} from '@nestjs/common';
import { prisma } from '@chat/db';
import { z } from 'zod';
import type { Channel, ConversationStatus, AiMode } from '@chat/shared';
import { MessagesGateway } from './messages.gateway';
import { AiService } from '../ai/ai.service';

const CHANNELS = ['whatsapp', 'instagram', 'facebook', 'sms', 'telegram', 'email', 'web'] as const;
const STATUSES = ['open', 'pending', 'human_takeover', 'closed'] as const;
const AI_MODES = ['auto', 'draft', 'manual'] as const;

const ingestSchema = z.object({
  client: z
    .object({
      id: z.string().optional(),
      name: z.string().min(1).optional(),
      email: z.string().email().optional(),
      phone: z.string().min(3).optional()
    })
    .optional(),
  conversation: z
    .object({
      id: z.string().optional()
    })
    .optional(),
  message: z.object({
    content: z.string().min(1),
    sender: z.enum(['client', 'agent', 'ai']),
    channel: z.enum(CHANNELS),
    externalId: z.string().optional()
  })
});

@Injectable()
export class MessagesService {
  private readonly logger = new Logger(MessagesService.name);

  constructor(
    private readonly gateway: MessagesGateway,
    @Inject(forwardRef(() => AiService))
    private readonly aiService: AiService
  ) {}

  async ingest(payload: Record<string, unknown>) {
    const parsed = ingestSchema.safeParse(payload);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.flatten());
    }

    const { client, conversation, message } = parsed.data;

    // ─── Deduplication: skip if we've already processed this external message ──
    if (message.externalId) {
      const existing = await prisma.message.findUnique({
        where: { externalId: message.externalId }
      });
      if (existing) {
        return { status: 'duplicate', messageId: existing.id };
      }
    }

    // ─── Resolve or create client ─────────────────────────────────────────────
    const clientRecord = client?.id
      ? await prisma.client.findUnique({ where: { id: client.id } })
      : client?.phone
        ? await prisma.client.findFirst({ where: { phone: client.phone } })
        : client?.email
          ? await prisma.client.findFirst({ where: { email: client.email } })
          : null;

    const resolvedClient =
      clientRecord ??
      (await prisma.client.create({
        data: {
          name: client?.name ?? 'Unknown',
          email: client?.email,
          phone: client?.phone,
          tags: []
        }
      }));

    // ─── Resolve or create conversation ──────────────────────────────────────
    const conversationRecord = conversation?.id
      ? await prisma.conversation.findUnique({ where: { id: conversation.id } })
      : await prisma.conversation.findFirst({
          where: {
            clientId: resolvedClient.id,
            channel: message.channel,
            status: { in: ['open', 'pending', 'human_takeover'] }
          },
          orderBy: { updatedAt: 'desc' }
        });

    const resolvedConversation =
      conversationRecord ??
      (await prisma.conversation.create({
        data: {
          clientId: resolvedClient.id,
          channel: message.channel,
          status: 'open',
          aiMode: 'auto'
        }
      }));

    // ─── Create message ───────────────────────────────────────────────────────
    const createdMessage = await prisma.message.create({
      data: {
        conversationId: resolvedConversation.id,
        sender: message.sender,
        content: message.content,
        externalId: message.externalId
      }
    });

    // ─── Touch conversation updatedAt so it sorts to top ─────────────────────
    await prisma.conversation.update({
      where: { id: resolvedConversation.id },
      data: { updatedAt: new Date() }
    });

    // ─── Emit real-time update to open inbox sessions ────────────────────────
    this.gateway.emitNewMessage(resolvedConversation.id, createdMessage);

    // ─── Auto-reply: if aiMode is 'auto' and message is from client, generate AI reply ──
    if (message.sender === 'client' && resolvedConversation.aiMode === 'auto') {
      // Fire-and-forget so we don't block the ingest response
      this.triggerAutoReply(resolvedConversation.id, message.content).catch((err) =>
        this.logger.error(`Auto-reply failed for conversation ${resolvedConversation.id}`, err)
      );
    }

    return {
      status: 'received',
      clientId: resolvedClient.id,
      conversationId: resolvedConversation.id,
      messageId: createdMessage.id,
      aiMode: resolvedConversation.aiMode
    };
  }

  /**
   * Automatically generate and save an AI reply for a conversation.
   * Called after ingest when aiMode === 'auto' and sender === 'client'.
   */
  private async triggerAutoReply(conversationId: string, incomingContent: string) {
    try {
      const aiResult = await this.aiService.generateReply(conversationId, incomingContent);
      if (aiResult?.reply) {
        await this.saveAiReply(conversationId, aiResult.reply, aiResult.aiRunId);
        this.logger.log(`Auto-reply sent for conversation ${conversationId}`);
      }
    } catch (err) {
      this.logger.error(`Auto-reply generation failed for ${conversationId}`, err);
    }
  }

  async sendReply(conversationId: string, content: string, senderUserId: string) {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId }
    });
    if (!conversation) throw new NotFoundException('Conversation not found');

    const message = await prisma.message.create({
      data: { conversationId, sender: 'agent', content }
    });

    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() }
    });

    await prisma.auditLog.create({
      data: {
        actor: senderUserId,
        action: 'message.sent',
        resourceType: 'Message',
        resourceId: message.id,
        details: { channel: conversation.channel, length: content.length }
      }
    });

    this.gateway.emitNewMessage(conversationId, message);
    return message;
  }

  async saveAiReply(conversationId: string, content: string, aiRunId: string) {
    const message = await prisma.message.create({
      data: { conversationId, sender: 'ai', content }
    });

    // Link message to its AIRun record
    await prisma.aIRun.update({
      where: { id: aiRunId },
      data: { messageId: message.id }
    });

    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() }
    });

    this.gateway.emitNewMessage(conversationId, message);
    return message;
  }

  async patchConversation(id: string, patch: { status?: ConversationStatus; aiMode?: AiMode }) {
    const statusSchema = z.enum(STATUSES).optional();
    const modeSchema = z.enum(AI_MODES).optional();

    if (patch.status !== undefined && !statusSchema.safeParse(patch.status).success) {
      throw new BadRequestException('Invalid status value');
    }
    if (patch.aiMode !== undefined && !modeSchema.safeParse(patch.aiMode).success) {
      throw new BadRequestException('Invalid aiMode value');
    }

    const updated = await prisma.conversation.update({
      where: { id },
      data: {
        ...(patch.status !== undefined && { status: patch.status }),
        ...(patch.aiMode !== undefined && { aiMode: patch.aiMode }),
        updatedAt: new Date()
      },
      include: { client: true }
    });

    this.gateway.emitConversationUpdate(id, updated);
    return updated;
  }

  async listConversations(params: {
    status?: string;
    clientId?: string;
    assignedToId?: string;
    unassigned?: string;
    skip?: string;
    take?: string;
  }) {
    const skip = this.toOptionalInt(params.skip);
    const take = this.toOptionalInt(params.take) ?? 50;

    return prisma.conversation.findMany({
      where: {
        ...(params.status ? { status: params.status as ConversationStatus } : {}),
        ...(params.clientId ? { clientId: params.clientId } : {}),
        ...(params.assignedToId ? { assignedToId: params.assignedToId } : {}),
        ...(params.unassigned === 'true' ? { assignedToId: null } : {})
      },
      orderBy: { updatedAt: 'desc' },
      skip,
      take,
      include: {
        client: true,
        assignedTo: { select: { id: true, name: true, email: true } }
      }
    });
  }

  async getConversation(id: string) {
    const conversation = await prisma.conversation.findUnique({
      where: { id },
      include: {
        client: true,
        assignedTo: { select: { id: true, name: true, email: true } }
      }
    });
    if (!conversation) throw new NotFoundException('Conversation not found');
    return conversation;
  }

  async listMessages(conversationId: string, params: { skip?: string; take?: string }) {
    const skip = this.toOptionalInt(params.skip);
    const take = this.toOptionalInt(params.take) ?? 50;

    return prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      skip,
      take
    });
  }

  async getAnalytics() {
    const [conversationGroups, aiMessages, agentMessages] = await Promise.all([
      prisma.conversation.groupBy({ by: ['status'], _count: { id: true } }),
      prisma.message.count({ where: { sender: 'ai' } }),
      prisma.message.count({ where: { sender: 'agent' } })
    ]);

    const messagesByChannelRaw = await prisma.$queryRaw<{ channel: string; count: bigint }[]>`
      SELECT c.channel, COUNT(m.id) as count
      FROM "Conversation" c
      LEFT JOIN "Message" m ON m."conversationId" = c.id
      WHERE m."createdAt" > NOW() - INTERVAL '30 days'
      GROUP BY c.channel
    `;

    const conversationsByStatus = Object.fromEntries(
      conversationGroups.map((r: { status: string; _count: { id: number } }) => [
        r.status,
        r._count.id
      ])
    ) as Record<ConversationStatus, number>;

    const messagesByChannel = Object.fromEntries(
      messagesByChannelRaw.map((r: { channel: string; count: bigint }) => [
        r.channel,
        Number(r.count)
      ])
    ) as Record<Channel, number>;

    const total = aiMessages + agentMessages;

    return {
      conversationsByStatus,
      messagesByChannel,
      aiVsHumanRatio: { ai: aiMessages, human: agentMessages, total },
      avgFirstResponseMs: null
    };
  }

  private toOptionalInt(value?: string) {
    if (!value) return undefined;
    const parsed = Number.parseInt(value, 10);
    return Number.isNaN(parsed) ? undefined : parsed;
  }
}
