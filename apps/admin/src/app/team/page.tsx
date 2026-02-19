'use client';

import { useState, useEffect, useCallback } from 'react';
import Layout from '@/components/Layout';
import { apiClient } from '@/lib/api';

interface Agent {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'agent';
  isActive: boolean;
  activeConversations: number;
  createdAt: string;
}

interface AgentPerformance {
  agent: { id: string; name: string; email: string; role: string };
  metrics: {
    conversationsHandled: number;
    activeConversations: number;
    closedConversations: number;
    messagesSent: number;
    avgResponseTimeFormatted: string;
    resolutionRate: number;
  };
  bonus: { fromClosedConversations: number; fromMessagesSent: number; total: number; currency: string };
}

interface TeamData {
  teamSummary: {
    totalAgents: number;
    totalConversationsHandled: number;
    totalClosed: number;
    totalMessages: number;
    totalBonuses: number;
  };
  leaderboard: AgentPerformance[];
}

export default function TeamPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [teamData, setTeamData] = useState<TeamData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [periodDays, setPeriodDays] = useState(30);

  // Create form
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<'agent' | 'admin'>('agent');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [agentsData, perfData] = await Promise.all([
        apiClient.get<Agent[]>('/team/agents'),
        apiClient.get<TeamData>(`/team/performance?days=${periodDays}`),
      ]);
      setAgents(agentsData);
      setTeamData(perfData);
    } catch {
      setError('Failed to load team data');
    } finally {
      setLoading(false);
    }
  }, [periodDays]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError(null);
    try {
      await apiClient.post('/team/agents', {
        name: newName,
        email: newEmail,
        password: newPassword,
        role: newRole,
      });
      setShowCreate(false);
      setNewName('');
      setNewEmail('');
      setNewPassword('');
      setNewRole('agent');
      await loadData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create agent');
    } finally {
      setCreating(false);
    }
  };

  const handleToggleActive = async (agent: Agent) => {
    try {
      await apiClient.patch(`/team/agents/${agent.id}`, { isActive: !agent.isActive });
      await loadData();
    } catch {
      setError('Failed to update agent');
    }
  };

  const handleUpdateRole = async (agent: Agent, role: 'admin' | 'agent') => {
    try {
      await apiClient.patch(`/team/agents/${agent.id}`, { role });
      await loadData();
    } catch {
      setError('Failed to update role');
    }
  };

  const getPerformance = (agentId: string) =>
    teamData?.leaderboard.find((p) => p.agent.id === agentId);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6 lg:p-8 space-y-6 overflow-y-auto h-full">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Team Management</h1>
            <p className="text-slate-500 text-sm mt-1">
              Manage your sales agents, track performance, and calculate bonuses
            </p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-xl text-sm font-medium shadow-md shadow-indigo-500/20 hover:from-indigo-700 hover:to-indigo-800 transition-all"
          >
            + Add Agent
          </button>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200/60 rounded-xl text-red-600 text-sm">
            {error}
            <button onClick={() => setError(null)} className="ml-2 text-red-400 hover:text-red-600">✕</button>
          </div>
        )}

        {/* Team Summary Stats */}
        {teamData && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { label: 'Active Agents', value: teamData.teamSummary.totalAgents, icon: '👥', gradient: 'from-indigo-500 to-blue-600', shadow: 'shadow-indigo-500/20' },
              { label: 'Conversations', value: teamData.teamSummary.totalConversationsHandled, icon: '💬', gradient: 'from-emerald-500 to-teal-600', shadow: 'shadow-emerald-500/20' },
              { label: 'Closed', value: teamData.teamSummary.totalClosed, icon: '✅', gradient: 'from-green-500 to-emerald-600', shadow: 'shadow-green-500/20' },
              { label: 'Messages Sent', value: teamData.teamSummary.totalMessages, icon: '📨', gradient: 'from-purple-500 to-violet-600', shadow: 'shadow-purple-500/20' },
              { label: 'Total Bonuses', value: `$${teamData.teamSummary.totalBonuses}`, icon: '💰', gradient: 'from-amber-500 to-orange-600', shadow: 'shadow-amber-500/20' },
            ].map((s) => (
              <div key={s.label} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/60">
                <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${s.gradient} flex items-center justify-center text-white text-sm shadow-md ${s.shadow} mb-3`}>
                  {s.icon}
                </div>
                <p className="text-xl font-bold text-slate-900">{s.value}</p>
                <p className="text-xs text-slate-400 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Period Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">Period:</span>
          {[7, 14, 30, 90].map((d) => (
            <button
              key={d}
              onClick={() => setPeriodDays(d)}
              className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-all ${
                periodDays === d
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {d}d
            </button>
          ))}
        </div>

        {/* Agent Cards with Performance */}
        <div className="space-y-3">
          {agents.map((agent, rank) => {
            const perf = getPerformance(agent.id);
            return (
              <div
                key={agent.id}
                className={`bg-white rounded-2xl p-5 shadow-sm border border-slate-200/60 transition-all hover:shadow-md ${
                  !agent.isActive ? 'opacity-60' : ''
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Rank + Avatar */}
                  <div className="relative">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-md ${
                      rank === 0 ? 'bg-gradient-to-br from-amber-400 to-orange-500 shadow-amber-500/30' :
                      rank === 1 ? 'bg-gradient-to-br from-slate-300 to-slate-400 shadow-slate-400/30' :
                      rank === 2 ? 'bg-gradient-to-br from-amber-600 to-amber-700 shadow-amber-600/30' :
                      'bg-gradient-to-br from-indigo-500 to-purple-600 shadow-indigo-500/30'
                    }`}>
                      {agent.name.charAt(0).toUpperCase()}
                    </div>
                    {rank < 3 && (
                      <span className="absolute -top-1 -right-1 text-xs">
                        {rank === 0 ? '🥇' : rank === 1 ? '🥈' : '🥉'}
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-slate-900 text-sm">{agent.name}</h3>
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                        agent.role === 'admin'
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {agent.role}
                      </span>
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                        agent.isActive
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {agent.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">{agent.email}</p>

                    {/* Performance Metrics */}
                    {perf && (
                      <div className="flex flex-wrap gap-4 mt-3">
                        {[
                          { label: 'Handled', value: perf.metrics.conversationsHandled },
                          { label: 'Closed', value: perf.metrics.closedConversations },
                          { label: 'Active', value: perf.metrics.activeConversations },
                          { label: 'Messages', value: perf.metrics.messagesSent },
                          { label: 'Avg Response', value: perf.metrics.avgResponseTimeFormatted },
                          { label: 'Resolution', value: `${perf.metrics.resolutionRate}%` },
                        ].map((m) => (
                          <div key={m.label} className="text-center">
                            <p className="text-sm font-semibold text-slate-800">{m.value}</p>
                            <p className="text-[10px] text-slate-400">{m.label}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Bonus + Actions */}
                  <div className="text-right flex flex-col items-end gap-2">
                    {perf && (
                      <div className="px-3 py-2 bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl border border-emerald-200/60">
                        <p className="text-lg font-bold text-emerald-700">${perf.bonus.total}</p>
                        <p className="text-[10px] text-emerald-600">bonus earned</p>
                      </div>
                    )}
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleToggleActive(agent)}
                        className={`px-2.5 py-1 text-[11px] rounded-lg font-medium transition-all ${
                          agent.isActive
                            ? 'bg-red-50 text-red-600 hover:bg-red-100'
                            : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                        }`}
                      >
                        {agent.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        onClick={() => handleUpdateRole(agent, agent.role === 'admin' ? 'agent' : 'admin')}
                        className="px-2.5 py-1 text-[11px] bg-slate-100 text-slate-600 rounded-lg font-medium hover:bg-slate-200 transition-all"
                      >
                        → {agent.role === 'admin' ? 'Agent' : 'Admin'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Create Agent Modal */}
        {showCreate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md animate-slide-up">
              <h2 className="text-lg font-bold text-slate-900 mb-4">Add New Agent</h2>
              <form onSubmit={handleCreate} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300"
                    placeholder="Jane Doe"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Email</label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300"
                    placeholder="jane@company.com"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300"
                    placeholder="Min 6 characters"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Role</label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as 'agent' | 'admin')}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300"
                  >
                    <option value="agent">Sales Agent</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={creating}
                    className="flex-1 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-xl text-sm font-medium shadow-md shadow-indigo-500/20 disabled:opacity-50"
                  >
                    {creating ? 'Creating…' : 'Create Agent'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreate(false)}
                    className="px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-200"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
