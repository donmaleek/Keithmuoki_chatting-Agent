import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { prisma } from '@chat/db';

@Injectable()
export class TeamService {
  private readonly logger = new Logger(TeamService.name);

  // ─── Agent CRUD ──────────────────────────────────────────────────────────────

  async listAgents() {
    const agents = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            assignedConversations: { where: { status: { in: ['open', 'pending', 'human_takeover'] } } },
          },
        },
      },
    });
    return agents.map((a) => ({
      ...a,
      activeConversations: a._count.assignedConversations,
      _count: undefined,
    }));
  }

  async getAgent(id: string) {
    const agent = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    if (!agent) throw new NotFoundException('Agent not found');
    return agent;
  }

  async createAgent(data: { email: string; name: string; password: string; role?: 'admin' | 'agent' }) {
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) throw new ConflictException('Email already in use');

    const passwordHash = await bcrypt.hash(data.password, 12);
    const agent = await prisma.user.create({
      data: {
        email: data.email,
        name: data.name,
        passwordHash,
        role: data.role ?? 'agent',
      },
      select: { id: true, email: true, name: true, role: true, isActive: true, createdAt: true },
    });

    this.logger.log(`Agent created: ${agent.email} (${agent.role})`);
    return agent;
  }

  async updateAgent(id: string, data: { name?: string; email?: string; role?: 'admin' | 'agent'; isActive?: boolean }) {
    const agent = await prisma.user.findUnique({ where: { id } });
    if (!agent) throw new NotFoundException('Agent not found');

    if (data.email && data.email !== agent.email) {
      const emailTaken = await prisma.user.findUnique({ where: { email: data.email } });
      if (emailTaken) throw new ConflictException('Email already in use');
    }

    const updated = await prisma.user.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.email !== undefined && { email: data.email }),
        ...(data.role !== undefined && { role: data.role }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
      select: { id: true, email: true, name: true, role: true, isActive: true, updatedAt: true },
    });

    this.logger.log(`Agent updated: ${updated.email}`);
    return updated;
  }

  async resetAgentPassword(id: string, newPassword: string) {
    if (!newPassword || newPassword.length < 6) {
      throw new BadRequestException('Password must be at least 6 characters');
    }
    const agent = await prisma.user.findUnique({ where: { id } });
    if (!agent) throw new NotFoundException('Agent not found');

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id }, data: { passwordHash } });
    this.logger.log(`Password reset for agent ${agent.email}`);
    return { success: true };
  }

  // ─── Conversation Assignment ─────────────────────────────────────────────────

  async assignConversation(conversationId: string, agentId: string, assignedBy: string) {
    const conversation = await prisma.conversation.findUnique({ where: { id: conversationId } });
    if (!conversation) throw new NotFoundException('Conversation not found');

    const agent = await prisma.user.findUnique({ where: { id: agentId } });
    if (!agent || !agent.isActive) throw new BadRequestException('Agent not found or inactive');

    // Close previous assignment if any
    await prisma.conversationAssignment.updateMany({
      where: { conversationId, unassignedAt: null },
      data: { unassignedAt: new Date() },
    });

    // Create new assignment
    await prisma.conversationAssignment.create({
      data: { conversationId, userId: agentId },
    });

    // Update conversation's assignedToId
    const updated = await prisma.conversation.update({
      where: { id: conversationId },
      data: { assignedToId: agentId, status: 'human_takeover' },
      include: { client: true, assignedTo: { select: { id: true, name: true, email: true } } },
    });

    await prisma.auditLog.create({
      data: {
        actor: assignedBy,
        action: 'conversation.assigned',
        resourceType: 'Conversation',
        resourceId: conversationId,
        details: JSON.parse(JSON.stringify({ agentId, agentName: agent.name })),
      },
    });

    this.logger.log(`Conversation ${conversationId} assigned to ${agent.name}`);
    return updated;
  }

  async unassignConversation(conversationId: string, unassignedBy: string) {
    await prisma.conversationAssignment.updateMany({
      where: { conversationId, unassignedAt: null },
      data: { unassignedAt: new Date() },
    });

    const updated = await prisma.conversation.update({
      where: { id: conversationId },
      data: { assignedToId: null, aiMode: 'auto' },
      include: { client: true },
    });

    this.logger.log(`Conversation ${conversationId} unassigned by ${unassignedBy}`);
    return updated;
  }

  // ─── Performance & Bonuses ───────────────────────────────────────────────────

  async getAgentPerformance(agentId: string, periodDays = 30) {
    const since = new Date();
    since.setDate(since.getDate() - periodDays);

    const agent = await prisma.user.findUnique({
      where: { id: agentId },
      select: { id: true, name: true, email: true, role: true },
    });
    if (!agent) throw new NotFoundException('Agent not found');

    // Conversations handled (assigned to this agent in period)
    const assignmentsInPeriod = await prisma.conversationAssignment.count({
      where: { userId: agentId, assignedAt: { gte: since } },
    });

    // Currently active conversations
    const activeConversations = await prisma.conversation.count({
      where: { assignedToId: agentId, status: { in: ['open', 'pending', 'human_takeover'] } },
    });

    // Messages sent by this agent in period
    const messagesSent = await prisma.message.count({
      where: {
        sender: 'agent',
        createdAt: { gte: since },
        conversation: { assignedToId: agentId },
      },
    });

    // Closed conversations in period
    const closedConversations = await prisma.conversation.count({
      where: {
        assignedToId: agentId,
        status: 'closed',
        updatedAt: { gte: since },
      },
    });

    // Average response time (time between client message and next agent message)
    const avgResponseMs = await this.calculateAvgResponseTime(agentId, since);

    // Customer satisfaction proxy — closed conversations / total assignments
    const resolutionRate = assignmentsInPeriod > 0
      ? Math.round((closedConversations / assignmentsInPeriod) * 100)
      : 0;

    // Bonus calculation: $2 per closed conversation + $0.50 per message sent
    const bonusFromClosed = closedConversations * 2.0;
    const bonusFromMessages = messagesSent * 0.5;
    const totalBonus = Math.round((bonusFromClosed + bonusFromMessages) * 100) / 100;

    return {
      agent,
      period: { days: periodDays, since: since.toISOString() },
      metrics: {
        conversationsHandled: assignmentsInPeriod,
        activeConversations,
        closedConversations,
        messagesSent,
        avgResponseTimeMs: avgResponseMs,
        avgResponseTimeFormatted: avgResponseMs ? this.formatDuration(avgResponseMs) : 'N/A',
        resolutionRate,
      },
      bonus: {
        fromClosedConversations: bonusFromClosed,
        fromMessagesSent: bonusFromMessages,
        total: totalBonus,
        currency: 'USD',
      },
    };
  }

  async getTeamPerformance(periodDays = 30) {
    const agents = await prisma.user.findMany({
      where: { isActive: true },
      select: { id: true, name: true, email: true, role: true },
      orderBy: { name: 'asc' },
    });

    const performances = await Promise.all(
      agents.map((agent) => this.getAgentPerformance(agent.id, periodDays)),
    );

    // Sort by total bonus descending for leaderboard
    performances.sort((a, b) => b.bonus.total - a.bonus.total);

    // Team aggregates
    const totalConversationsHandled = performances.reduce((s, p) => s + p.metrics.conversationsHandled, 0);
    const totalClosed = performances.reduce((s, p) => s + p.metrics.closedConversations, 0);
    const totalMessages = performances.reduce((s, p) => s + p.metrics.messagesSent, 0);
    const totalBonuses = performances.reduce((s, p) => s + p.bonus.total, 0);

    return {
      period: { days: periodDays },
      teamSummary: {
        totalAgents: agents.length,
        totalConversationsHandled,
        totalClosed,
        totalMessages,
        totalBonuses: Math.round(totalBonuses * 100) / 100,
      },
      leaderboard: performances,
    };
  }

  async getConversationHistory(conversationId: string) {
    return prisma.conversationAssignment.findMany({
      where: { conversationId },
      orderBy: { assignedAt: 'desc' },
      include: { user: { select: { id: true, name: true, email: true } } },
    });
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  private async calculateAvgResponseTime(agentId: string, since: Date): Promise<number | null> {
    // Raw SQL for performance: find avg time between a client message and the next agent message
    const result = await prisma.$queryRaw<{ avg_ms: number | null }[]>`
      WITH agent_responses AS (
        SELECT
          m1."createdAt" as client_msg_at,
          MIN(m2."createdAt") as agent_reply_at
        FROM "Message" m1
        JOIN "Conversation" c ON c.id = m1."conversationId"
        JOIN "Message" m2 ON m2."conversationId" = m1."conversationId"
          AND m2.sender = 'agent'
          AND m2."createdAt" > m1."createdAt"
        WHERE m1.sender = 'client'
          AND c."assignedToId" = ${agentId}
          AND m1."createdAt" >= ${since}
        GROUP BY m1.id, m1."createdAt"
      )
      SELECT AVG(EXTRACT(EPOCH FROM (agent_reply_at - client_msg_at)) * 1000)::float as avg_ms
      FROM agent_responses
    `;

    return result[0]?.avg_ms ?? null;
  }

  private formatDuration(ms: number): string {
    if (ms < 60_000) return `${Math.round(ms / 1000)}s`;
    if (ms < 3_600_000) return `${Math.round(ms / 60_000)}m`;
    return `${(ms / 3_600_000).toFixed(1)}h`;
  }
}
