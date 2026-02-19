'use client';

import { useEffect, useMemo, useState } from 'react';
import Layout from '@/components/Layout';
import { apiClient } from '@/lib/api';

interface DashboardResponse {
  periodDays: number;
  kpis: {
    revenueUsd: number;
    totalClients: number;
    totalConversations: number;
    openConversations: number;
    closedConversations: number;
    aiRate: number;
    winRate: number;
  };
  revenueTrend: Array<{ month: string; totalMinor: number; totalUsd: number }>;
  inquiryFunnel: {
    total: number;
    byStatus: {
      new: number;
      contacted: number;
      qualified: number;
      won: number;
      lost: number;
    };
  };
  messaging: {
    aiMessages: number;
    humanMessages: number;
    total: number;
  };
  team: {
    summary: {
      totalAgents: number;
      totalConversationsHandled: number;
      totalClosed: number;
      totalMessages: number;
      totalBonuses: number;
    };
    topAgents: Array<{
      agent: { id: string; name: string; role: string };
      metrics: {
        conversationsHandled: number;
        closedConversations: number;
        messagesSent: number;
        avgResponseTimeFormatted: string;
        resolutionRate: number;
      };
      bonus: { total: number };
    }>;
  };
  recentActivity: Array<{
    id: string;
    action: string;
    actor: string;
    resourceType: string | null;
    resourceId: string | null;
    createdAt: string;
  }>;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    apiClient
      .get<DashboardResponse>(`/admin/dashboard?days=${days}`)
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, [days]);

  const maxRevenue = useMemo(() => {
    if (!data || data.revenueTrend.length === 0) return 1;
    return Math.max(...data.revenueTrend.map((m) => m.totalUsd), 1);
  }, [data]);

  if (loading) {
    return (
      <Layout>
        <div className="h-full flex items-center justify-center">
          <div className="w-9 h-9 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }

  if (error || !data) {
    return (
      <Layout>
        <div className="p-8">
          <div className="p-4 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 text-sm">
            {error || 'No dashboard data available'}
          </div>
        </div>
      </Layout>
    );
  }

  const kpiCards = [
    {
      label: 'Revenue (Paid)',
      value: `$${data.kpis.revenueUsd.toLocaleString()}`,
      note: 'Total captured revenue',
      icon: '💰',
      gradient: 'from-emerald-500 to-green-600',
    },
    {
      label: 'Lead Win Rate',
      value: `${data.kpis.winRate}%`,
      note: `${data.inquiryFunnel.byStatus.won} won of ${data.inquiryFunnel.total} leads`,
      icon: '🎯',
      gradient: 'from-indigo-500 to-violet-600',
    },
    {
      label: 'AI Assist Rate',
      value: `${data.kpis.aiRate}%`,
      note: `${data.messaging.aiMessages} AI vs ${data.messaging.humanMessages} human replies`,
      icon: '🤖',
      gradient: 'from-purple-500 to-fuchsia-600',
    },
    {
      label: 'Conversation Health',
      value: `${data.kpis.openConversations}/${data.kpis.totalConversations}`,
      note: `${data.kpis.closedConversations} closed`,
      icon: '💬',
      gradient: 'from-sky-500 to-cyan-600',
    },
  ];

  return (
    <Layout>
      <div className="h-full overflow-y-auto p-6 lg:p-8 space-y-6 bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-indigo-500 font-semibold">Executive Command Center</p>
            <h1 className="text-3xl font-bold text-slate-900 mt-1">Keith Muoki’s Admin Panel</h1>
            <p className="text-sm text-slate-500 mt-1">Everything important: revenue, leads, operations, and team performance in one premium view.</p>
          </div>
          <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
            {[7, 30, 90].map((d) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-all ${
                  days === d ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-100'
                }`}
              >
                {d}d
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {kpiCards.map((item) => (
            <div key={item.label} className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${item.gradient} flex items-center justify-center text-white text-lg shadow-md`}>
                  {item.icon}
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-900">{item.value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{item.label}</p>
              <p className="text-[11px] text-slate-400 mt-2">{item.note}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 bg-white rounded-2xl border border-slate-200/60 p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-900 mb-5">Revenue Trend (last 6 months)</h3>
            <div className="h-56 flex items-end gap-3">
              {data.revenueTrend.map((point) => {
                const height = Math.max(14, Math.round((point.totalUsd / maxRevenue) * 180));
                return (
                  <div key={point.month} className="flex-1 flex flex-col items-center gap-2">
                    <div className="text-[11px] text-slate-500 font-medium">${point.totalUsd.toLocaleString()}</div>
                    <div
                      className="w-full max-w-[56px] rounded-t-xl bg-gradient-to-t from-indigo-600 to-violet-500 shadow-md shadow-indigo-500/30"
                      style={{ height }}
                    />
                    <div className="text-[10px] text-slate-400">{point.month.slice(5)}</div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/60 p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-900 mb-4">Lead Funnel</h3>
            <div className="space-y-3">
              {[
                { label: 'New', value: data.inquiryFunnel.byStatus.new, color: 'bg-sky-500' },
                { label: 'Contacted', value: data.inquiryFunnel.byStatus.contacted, color: 'bg-indigo-500' },
                { label: 'Qualified', value: data.inquiryFunnel.byStatus.qualified, color: 'bg-violet-500' },
                { label: 'Won', value: data.inquiryFunnel.byStatus.won, color: 'bg-emerald-500' },
                { label: 'Lost', value: data.inquiryFunnel.byStatus.lost, color: 'bg-rose-500' },
              ].map((row) => {
                const pct = data.inquiryFunnel.total > 0 ? Math.round((row.value / data.inquiryFunnel.total) * 100) : 0;
                return (
                  <div key={row.label}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-slate-600 font-medium">{row.label}</span>
                      <span className="text-slate-400">{row.value} ({pct}%)</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div className={`h-full ${row.color}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-slate-200/60 p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-900 mb-4">Top Agents</h3>
            <div className="space-y-3">
              {data.team.topAgents.map((agent, idx) => (
                <div key={agent.agent.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">
                      {idx + 1}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{agent.agent.name}</p>
                      <p className="text-[11px] text-slate-400">{agent.metrics.conversationsHandled} handled · {agent.metrics.resolutionRate}% resolved</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-emerald-600">${agent.bonus.total}</p>
                    <p className="text-[11px] text-slate-400">bonus</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/60 p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-900 mb-4">Recent Activity</h3>
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {data.recentActivity.map((item) => (
                <div key={item.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <p className="text-sm text-slate-800 font-medium">{item.action}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {item.actor} · {item.resourceType || 'System'} · {new Date(item.createdAt).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
