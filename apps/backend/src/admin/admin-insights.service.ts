import { Injectable } from '@nestjs/common';
import { prisma } from '@chat/db';
import { TeamService } from '../team/team.service';

@Injectable()
export class AdminInsightsService {
  constructor(private readonly teamService: TeamService) {}

  async getDashboard(days = 30) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const [
      paidPayments,
      monthlyRevenue,
      totalConversations,
      openConversations,
      closedConversations,
      aiMessages,
      humanMessages,
      totalClients,
      inquiries,
      recentActivity,
      teamPerformance,
    ] = await Promise.all([
      prisma.paymentIntent.aggregate({
        _sum: { amount: true },
        where: { status: 'paid' },
      }),
      prisma.$queryRaw<{ month: string; total: bigint }[]>`
        SELECT TO_CHAR(DATE_TRUNC('month', "createdAt"), 'YYYY-MM') as month,
               COALESCE(SUM(amount), 0)::bigint as total
        FROM "PaymentIntent"
        WHERE status = 'paid'
          AND "createdAt" >= NOW() - INTERVAL '6 months'
        GROUP BY DATE_TRUNC('month', "createdAt")
        ORDER BY DATE_TRUNC('month', "createdAt") ASC
      `,
      prisma.conversation.count(),
      prisma.conversation.count({ where: { status: { in: ['open', 'pending', 'human_takeover'] } } }),
      prisma.conversation.count({ where: { status: 'closed' } }),
      prisma.message.count({ where: { sender: 'ai', createdAt: { gte: since } } }),
      prisma.message.count({ where: { sender: 'agent', createdAt: { gte: since } } }),
      prisma.client.count(),
      prisma.serviceInquiry.groupBy({ by: ['status'], _count: { id: true } }),
      prisma.auditLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 12,
        select: {
          id: true,
          action: true,
          actor: true,
          resourceType: true,
          resourceId: true,
          createdAt: true,
        },
      }),
      this.teamService.getTeamPerformance(days),
    ]);

    const paidRevenueMinor = paidPayments._sum.amount ?? 0;
    const revenueUsd = Math.round((paidRevenueMinor / 100) * 100) / 100;

    const inquiryByStatus = Object.fromEntries(
      inquiries.map((item) => [item.status, item._count.id]),
    ) as Record<string, number>;

    const totalInquiries = inquiries.reduce((sum, item) => sum + item._count.id, 0);
    const wonInquiries = inquiryByStatus.won ?? 0;
    const winRate = totalInquiries > 0 ? Math.round((wonInquiries / totalInquiries) * 100) : 0;

    const aiTotal = aiMessages + humanMessages;
    const aiRate = aiTotal > 0 ? Math.round((aiMessages / aiTotal) * 100) : 0;

    return {
      periodDays: days,
      kpis: {
        revenueUsd,
        totalClients,
        totalConversations,
        openConversations,
        closedConversations,
        aiRate,
        winRate,
      },
      revenueTrend: monthlyRevenue.map((item) => ({
        month: item.month,
        totalMinor: Number(item.total),
        totalUsd: Number(item.total) / 100,
      })),
      inquiryFunnel: {
        total: totalInquiries,
        byStatus: {
          new: inquiryByStatus.new ?? 0,
          contacted: inquiryByStatus.contacted ?? 0,
          qualified: inquiryByStatus.qualified ?? 0,
          won: inquiryByStatus.won ?? 0,
          lost: inquiryByStatus.lost ?? 0,
        },
      },
      messaging: {
        aiMessages,
        humanMessages,
        total: aiTotal,
      },
      team: {
        summary: teamPerformance.teamSummary,
        topAgents: teamPerformance.leaderboard.slice(0, 5),
      },
      recentActivity,
    };
  }
}
