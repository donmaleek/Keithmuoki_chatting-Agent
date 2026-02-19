import {
  ForbiddenException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import axios from 'axios';
import { MessagesService } from '../../messages/messages.service';
import { AiService } from '../../ai/ai.service';

@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);

  constructor(
    private readonly messagesService: MessagesService,
    private readonly aiService: AiService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Verify the X-Hub-Signature-256 header from Meta.
   * Throws ForbiddenException on mismatch.
   */
  verifySignature(rawBody: Buffer, signature: string): void {
    const META_APP_SECRET = this.configService.get<string>('META_APP_SECRET') ?? '';
    const expected =
      'sha256=' +
      crypto.createHmac('sha256', META_APP_SECRET).update(rawBody).digest('hex');

    if (!crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature ?? ''))) {
      throw new ForbiddenException('Invalid WhatsApp webhook signature');
    }
  }

  /**
   * Main handler: verify signature, extract message, ingest, and optionally send AI reply.
   */
  async handleInbound(rawBody: Buffer, signature: string): Promise<void> {
    this.verifySignature(rawBody, signature);

    let payload: Record<string, any>;
    try {
      payload = JSON.parse(rawBody.toString('utf8'));
    } catch {
      this.logger.warn('WhatsApp: failed to parse JSON body');
      return;
    }

    const value = payload?.entry?.[0]?.changes?.[0]?.value;
    if (!value?.messages?.[0]) {
      // Notification with no user message (e.g. status update) — ignore silently
      return;
    }

    const msg = value.messages[0];
    const from: string = msg.from;
    const messageId: string = msg.id;
    const textBody: string = msg.text?.body;

    if (!textBody) {
      this.logger.warn(`WhatsApp: non-text message from ${from}, skipping`);
      return;
    }

    const result = await this.messagesService.ingest({
      client: { phone: from },
      message: {
        content: textBody,
        sender: 'client',
        channel: 'whatsapp',
        externalId: messageId,
      },
    });

    if (result.status === 'duplicate') {
      this.logger.debug(`WhatsApp: duplicate message ${messageId}, skipping AI`);
      return;
    }

    if (result.aiMode === 'auto') {
      const { conversationId } = result;
      try {
        const aiResult = await this.aiService.generateReply(conversationId, textBody);
        if (aiResult?.reply) {
          await Promise.all([
            this.send(from, aiResult.reply),
            this.messagesService.saveAiReply(conversationId, aiResult.reply, aiResult.aiRunId),
          ]);
        }
      } catch (err) {
        this.logger.warn(
          `WhatsApp: AI reply failed for conversation ${conversationId}: ${(err as Error).message}`,
        );
      }
    }
  }

  /**
   * Send a WhatsApp text message via the Graph API.
   */
  async send(to: string, content: string): Promise<void> {
    const WHATSAPP_PHONE_NUMBER_ID = this.configService.get<string>('WHATSAPP_PHONE_NUMBER_ID');
    const WHATSAPP_ACCESS_TOKEN = this.configService.get<string>('WHATSAPP_ACCESS_TOKEN');

    try {
      await axios.post(
        `https://graph.facebook.com/v18.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
        {
          messaging_product: 'whatsapp',
          to,
          type: 'text',
          text: { body: content },
        },
        {
          headers: {
            Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
            'Content-Type': 'application/json',
          },
        },
      );
    } catch (err) {
      this.logger.warn(`WhatsApp: failed to send message to ${to}: ${(err as Error).message}`);
    }
  }
}
