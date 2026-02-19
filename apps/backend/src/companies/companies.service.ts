import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { prisma } from '@chat/db';

@Injectable()
export class CompaniesService {
  // ─── Create a new company (admin or agent who purchased a plan) ─────────────
  async createCompany(ownerId: string, data: { name: string; slug: string; plan?: string }) {
    if (!data.name?.trim()) throw new BadRequestException('Company name is required');
    if (!data.slug?.trim()) throw new BadRequestException('Slug is required');

    const slug = data.slug.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-');
    if (slug.length < 3) throw new BadRequestException('Slug must be at least 3 characters');

    const existing = await prisma.company.findUnique({ where: { slug } });
    if (existing) throw new ConflictException('This slug is already taken');

    const planMap: Record<string, { maxAgents: number; maxConvos: number }> = {
      starter: { maxAgents: 2, maxConvos: 1000 },
      growth: { maxAgents: 10, maxConvos: 10000 },
      scale: { maxAgents: 100, maxConvos: 100000 },
    };
    const limits = planMap[data.plan || 'starter'] || planMap.starter;

    const company = await prisma.company.create({
      data: {
        name: data.name.trim(),
        slug,
        plan: (data.plan as any) || 'starter',
        ownerId,
        maxAgents: limits.maxAgents,
        maxConvos: limits.maxConvos,
      },
    });

    // Auto-add owner as an agent too
    await prisma.companyAgent.create({
      data: { companyId: company.id, userId: ownerId },
    });

    return company;
  }

  // ─── List all companies (for agent marketplace / browsing) ──────────────────
  async listCompanies(filters?: { status?: string; search?: string }) {
    const where: any = {};
    if (filters?.status) where.status = filters.status;
    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { slug: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    return prisma.company.findMany({
      where,
      include: {
        owner: { select: { id: true, name: true, email: true } },
        _count: { select: { agents: true, conversations: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ─── Get single company by slug or ID ───────────────────────────────────────
  async getCompany(idOrSlug: string) {
    const company = await prisma.company.findFirst({
      where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }] },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        agents: {
          include: { user: { select: { id: true, name: true, email: true, role: true } } },
          where: { isActive: true },
        },
        _count: { select: { conversations: true, clients: true } },
      },
    });
    if (!company) throw new NotFoundException('Company not found');
    return company;
  }

  // ─── Agent joins a company ──────────────────────────────────────────────────
  async joinCompany(companyId: string, userId: string) {
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      include: { _count: { select: { agents: true } } },
    });
    if (!company) throw new NotFoundException('Company not found');
    if (company.status !== 'active') throw new ForbiddenException('This company is not accepting agents');

    if (company._count.agents >= company.maxAgents) {
      throw new ForbiddenException(`Company has reached its ${company.maxAgents} agent limit`);
    }

    const existing = await prisma.companyAgent.findUnique({
      where: { companyId_userId: { companyId, userId } },
    });
    if (existing && existing.isActive) throw new ConflictException('Already a member of this company');

    if (existing) {
      return prisma.companyAgent.update({
        where: { id: existing.id },
        data: { isActive: true },
      });
    }

    return prisma.companyAgent.create({
      data: { companyId, userId },
    });
  }

  // ─── Agent leaves a company ─────────────────────────────────────────────────
  async leaveCompany(companyId: string, userId: string) {
    const membership = await prisma.companyAgent.findUnique({
      where: { companyId_userId: { companyId, userId } },
    });
    if (!membership) throw new NotFoundException('Not a member of this company');

    return prisma.companyAgent.update({
      where: { id: membership.id },
      data: { isActive: false },
    });
  }

  // ─── Get companies for a specific agent ─────────────────────────────────────
  async getMyCompanies(userId: string) {
    return prisma.companyAgent.findMany({
      where: { userId, isActive: true },
      include: {
        company: {
          include: {
            _count: { select: { conversations: true, clients: true, agents: true } },
          },
        },
      },
      orderBy: { joinedAt: 'desc' },
    });
  }

  // ─── Inbound anchor: receive a message via the company's unique anchor URL ──
  async ingestViaAnchor(
    anchorToken: string,
    data: { clientName: string; clientEmail?: string; clientPhone?: string; message: string; channel?: string },
  ) {
    const company = await prisma.company.findUnique({ where: { anchorToken } });
    if (!company) throw new NotFoundException('Invalid anchor token');
    if (company.status !== 'active') throw new ForbiddenException('Company is not active');

    // Find or create client scoped to this company
    let client = null;
    if (data.clientEmail) {
      client = await prisma.client.findFirst({
        where: { email: data.clientEmail, companyId: company.id },
      });
    }
    if (!client && data.clientPhone) {
      client = await prisma.client.findFirst({
        where: { phone: data.clientPhone, companyId: company.id },
      });
    }
    if (!client) {
      client = await prisma.client.create({
        data: {
          name: data.clientName || 'Unknown',
          email: data.clientEmail || null,
          phone: data.clientPhone || null,
          companyId: company.id,
        },
      });
    }

    // Find or create conversation
    let conversation = await prisma.conversation.findFirst({
      where: {
        clientId: client.id,
        companyId: company.id,
        status: { in: ['open', 'pending', 'human_takeover'] },
      },
      orderBy: { updatedAt: 'desc' },
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          clientId: client.id,
          companyId: company.id,
          channel: (data.channel as any) || 'web',
          status: 'open',
          aiMode: 'auto',
        },
      });
    }

    // Create message
    const message = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        sender: 'client',
        content: data.message,
      },
    });

    return { conversationId: conversation.id, messageId: message.id, clientId: client.id };
  }

  // ─── Get conversations for a company (filtered for agent) ───────────────────
  async getCompanyConversations(companyId: string, filters?: { status?: string; assignedToId?: string }) {
    const where: any = { companyId };
    if (filters?.status) where.status = filters.status;
    if (filters?.assignedToId) where.assignedToId = filters.assignedToId;

    return prisma.conversation.findMany({
      where,
      include: {
        client: true,
        assignedTo: { select: { id: true, name: true } },
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
        _count: { select: { messages: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  // ─── Update company (owner only) ───────────────────────────────────────────
  async updateCompany(companyId: string, userId: string, data: { name?: string; logo?: string; domain?: string }) {
    const company = await prisma.company.findUnique({ where: { id: companyId } });
    if (!company) throw new NotFoundException('Company not found');
    if (company.ownerId !== userId) throw new ForbiddenException('Only the owner can update company details');

    return prisma.company.update({
      where: { id: companyId },
      data: {
        ...(data.name && { name: data.name.trim() }),
        ...(data.logo && { logo: data.logo }),
        ...(data.domain !== undefined && { domain: data.domain || null }),
      },
    });
  }

  // ─── Get anchor info (public — for embedding) ──────────────────────────────
  async getAnchorInfo(slug: string) {
    const company = await prisma.company.findUnique({
      where: { slug },
      select: { id: true, name: true, slug: true, logo: true, status: true, anchorToken: true },
    });
    if (!company) throw new NotFoundException('Company not found');
    return company;
  }
}
