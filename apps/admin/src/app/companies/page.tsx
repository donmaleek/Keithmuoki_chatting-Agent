'use client';

import { useEffect, useState, useCallback } from 'react';
import Layout from '../../components/Layout';

const API = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

interface Company {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  plan: string;
  status: string;
  anchorToken: string;
  maxAgents: number;
  maxConvos: number;
  createdAt: string;
  owner: { id: string; name: string; email: string };
  _count: { agents: number; conversations: number };
}

interface MyMembership {
  id: string;
  companyId: string;
  company: Company & { _count: { conversations: number; clients: number; agents: number } };
}

export default function CompaniesPage() {
  const [tab, setTab] = useState<'browse' | 'my' | 'create'>('browse');
  const [companies, setCompanies] = useState<Company[]>([]);
  const [myCompanies, setMyCompanies] = useState<MyMembership[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Create form
  const [newName, setNewName] = useState('');
  const [newSlug, setNewSlug] = useState('');
  const [newPlan, setNewPlan] = useState('starter');

  // Anchor modal
  const [anchorCompany, setAnchorCompany] = useState<Company | null>(null);

  const getHeaders = useCallback(() => {
    const t = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    return { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' };
  }, []);

  const fetchCompanies = useCallback(async () => {
    try {
      const params = new URLSearchParams({ status: 'active' });
      if (search) params.set('search', search);
      const res = await fetch(`${API}/companies?${params}`, { headers: getHeaders() });
      if (res.ok) setCompanies(await res.json());
    } catch { /* ignore */ }
  }, [search, getHeaders]);

  const fetchMyCompanies = useCallback(async () => {
    try {
      const res = await fetch(`${API}/companies/my`, { headers: getHeaders() });
      if (res.ok) setMyCompanies(await res.json());
    } catch { /* ignore */ }
  }, [getHeaders]);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchCompanies(), fetchMyCompanies()]).finally(() => setLoading(false));
  }, [fetchCompanies, fetchMyCompanies]);

  const myCompanyIds = new Set(myCompanies.map((m) => m.companyId));

  const handleJoin = async (companyId: string) => {
    setActionLoading(companyId);
    setError(null);
    try {
      const res = await fetch(`${API}/companies/${companyId}/join`, { method: 'POST', headers: getHeaders() });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.message || 'Failed to join');
      }
      setSuccess('Successfully joined company!');
      await fetchMyCompanies();
      setTimeout(() => setSuccess(null), 3000);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to join');
    } finally {
      setActionLoading(null);
    }
  };

  const handleLeave = async (companyId: string) => {
    setActionLoading(companyId);
    try {
      await fetch(`${API}/companies/${companyId}/leave`, { method: 'POST', headers: getHeaders() });
      await fetchMyCompanies();
    } catch { /* ignore */ } finally {
      setActionLoading(null);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setActionLoading('create');
    try {
      const res = await fetch(`${API}/companies`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ name: newName, slug: newSlug, plan: newPlan }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.message || 'Failed to create company');
      }
      setSuccess('Company created! Your unique anchor link is ready.');
      setNewName('');
      setNewSlug('');
      setNewPlan('starter');
      setTab('my');
      await Promise.all([fetchCompanies(), fetchMyCompanies()]);
      setTimeout(() => setSuccess(null), 4000);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to create company');
    } finally {
      setActionLoading(null);
    }
  };

  const planBadge = (plan: string) => {
    const colors: Record<string, string> = {
      starter: 'bg-emerald-100 text-emerald-700',
      growth: 'bg-indigo-100 text-indigo-700',
      scale: 'bg-amber-100 text-amber-700',
    };
    return colors[plan] || 'bg-slate-100 text-slate-600';
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 p-6 lg:p-8">
        {/* Header */}
        <div className="max-w-7xl mx-auto mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Companies</h1>
          <p className="text-slate-500 mt-1">Browse companies that need your services, join them, or create your own</p>
        </div>

        {/* Tabs */}
        <div className="max-w-7xl mx-auto mb-6">
          <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit">
            {([
              ['browse', '🏢 Browse', companies.length],
              ['my', '⭐ My Companies', myCompanies.length],
              ['create', '➕ Create', null],
            ] as const).map(([key, label, count]) => (
              <button
                key={key}
                onClick={() => setTab(key as 'browse' | 'my' | 'create')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  tab === key
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {label}
                {count !== null && (
                  <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${
                    tab === key ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-200 text-slate-500'
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Notifications */}
        {error && (
          <div className="max-w-7xl mx-auto mb-4">
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700 flex items-center gap-2">
              <span>⚠️</span> {error}
              <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600">✕</button>
            </div>
          </div>
        )}
        {success && (
          <div className="max-w-7xl mx-auto mb-4">
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-sm text-emerald-700 flex items-center gap-2">
              <span>✅</span> {success}
            </div>
          </div>
        )}

        <div className="max-w-7xl mx-auto">
          {/* ─── Browse Tab ─────────────────────────────────────────────────── */}
          {tab === 'browse' && (
            <>
              <div className="mb-6">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search companies by name..."
                  className="w-full max-w-md px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 text-slate-900"
                />
              </div>

              {loading ? (
                <div className="text-center py-20 text-slate-400">Loading companies...</div>
              ) : companies.length === 0 ? (
                <div className="text-center py-20">
                  <div className="text-5xl mb-3">🏢</div>
                  <p className="text-slate-500">No companies found. Be the first to create one!</p>
                  <button onClick={() => setTab('create')} className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors">
                    Create Company
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {companies.map((c) => (
                    <div key={c.id} className="group bg-white rounded-2xl border border-slate-200/80 p-6 hover:shadow-lg hover:border-indigo-200 transition-all duration-300">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white font-bold text-lg shadow-md">
                            {c.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h3 className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">{c.name}</h3>
                            <p className="text-xs text-slate-400">/{c.slug}</p>
                          </div>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${planBadge(c.plan)}`}>
                          {c.plan}
                        </span>
                      </div>

                      <div className="flex items-center gap-4 text-xs text-slate-500 mb-4">
                        <span className="flex items-center gap-1">👤 {c._count.agents}/{c.maxAgents} agents</span>
                        <span className="flex items-center gap-1">💬 {c._count.conversations} convos</span>
                      </div>

                      <div className="text-xs text-slate-400 mb-4">
                        Owner: <span className="text-slate-600">{c.owner.name}</span>
                      </div>

                      {myCompanyIds.has(c.id) ? (
                        <div className="flex items-center gap-2">
                          <span className="flex-1 text-center py-2 bg-emerald-50 text-emerald-600 rounded-xl text-sm font-medium">✓ Joined</span>
                          <button
                            onClick={() => handleLeave(c.id)}
                            disabled={actionLoading === c.id}
                            className="px-3 py-2 text-xs text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                          >
                            Leave
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleJoin(c.id)}
                          disabled={actionLoading === c.id}
                          className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl text-sm font-medium hover:opacity-90 transition-all shadow-sm disabled:opacity-50"
                        >
                          {actionLoading === c.id ? 'Joining...' : 'Join Company'}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* ─── My Companies Tab ───────────────────────────────────────────── */}
          {tab === 'my' && (
            <>
              {myCompanies.length === 0 ? (
                <div className="text-center py-20">
                  <div className="text-5xl mb-3">⭐</div>
                  <p className="text-slate-500">You haven&apos;t joined any companies yet</p>
                  <button onClick={() => setTab('browse')} className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors">
                    Browse Companies
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {myCompanies.map((m) => (
                    <div key={m.id} className="bg-white rounded-2xl border border-slate-200/80 p-6 hover:shadow-md transition-all">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white font-bold text-xl shadow-md">
                            {m.company.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h3 className="font-semibold text-slate-900 text-lg">{m.company.name}</h3>
                            <p className="text-sm text-slate-400">/{(m.company as Company).slug}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-6 text-sm text-slate-500">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-slate-900">{m.company._count.conversations}</div>
                            <div className="text-xs text-slate-400">Conversations</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-slate-900">{m.company._count.clients}</div>
                            <div className="text-xs text-slate-400">Clients</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-slate-900">{m.company._count.agents}</div>
                            <div className="text-xs text-slate-400">Agents</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setAnchorCompany(m.company as Company)}
                            className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-sm font-medium hover:bg-indigo-100 transition-colors"
                          >
                            🔗 Anchor Link
                          </button>
                          <a
                            href={`/companies/${(m.company as Company).slug || m.companyId}`}
                            className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-200 transition-colors"
                          >
                            View Inbox →
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* ─── Create Tab ────────────────────────────────────────────────── */}
          {tab === 'create' && (
            <div className="max-w-lg mx-auto">
              <div className="bg-white rounded-2xl border border-slate-200/80 p-8 shadow-sm">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-white text-2xl shadow-lg shadow-indigo-500/25 mb-3">🏢</div>
                  <h2 className="text-xl font-bold text-slate-900">Create Your Company</h2>
                  <p className="text-sm text-slate-500 mt-1">Set up your company and get a unique anchor link for customers to message you</p>
                </div>

                <form onSubmit={handleCreate} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">Company Name</label>
                    <input
                      value={newName}
                      onChange={(e) => {
                        setNewName(e.target.value);
                        setNewSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
                      }}
                      required
                      placeholder="Acme Corp"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">URL Slug (your anchor link)</label>
                    <div className="flex items-center gap-0">
                      <span className="px-3 py-2.5 bg-slate-100 border border-r-0 border-slate-200 rounded-l-xl text-sm text-slate-400">yoursite.com/c/</span>
                      <input
                        value={newSlug}
                        onChange={(e) => setNewSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                        required
                        minLength={3}
                        placeholder="acme-corp"
                        className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-r-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 text-slate-900"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">Plan</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'starter', name: 'Starter', price: '$49/mo', agents: '2 agents' },
                        { id: 'growth', name: 'Growth', price: '$149/mo', agents: '10 agents' },
                        { id: 'scale', name: 'Scale', price: 'Custom', agents: 'Unlimited' },
                      ].map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setNewPlan(p.id)}
                          className={`p-3 rounded-xl border text-center transition-all ${
                            newPlan === p.id
                              ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-500/20'
                              : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div className="text-sm font-semibold text-slate-900">{p.name}</div>
                          <div className="text-xs text-indigo-600 font-medium">{p.price}</div>
                          <div className="text-xs text-slate-400">{p.agents}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={actionLoading === 'create'}
                    className="w-full py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl text-sm font-medium hover:opacity-90 transition-all shadow-lg shadow-indigo-500/25 disabled:opacity-50"
                  >
                    {actionLoading === 'create' ? 'Creating...' : 'Create Company & Get Anchor Link'}
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>

        {/* Anchor Link Modal */}
        {anchorCompany && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setAnchorCompany(null)}>
            <div className="bg-white rounded-2xl p-8 max-w-lg w-full mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-lg font-bold text-slate-900 mb-2">🔗 Anchor Link for {anchorCompany.name}</h3>
              <p className="text-sm text-slate-500 mb-4">Customers can send messages to your company using this endpoint. Share it or integrate it into your website.</p>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Inbound Webhook URL</label>
                  <div className="flex gap-2">
                    <code className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 break-all">
                      POST {API}/companies/anchor/{anchorCompany.anchorToken}/ingest
                    </code>
                    <button
                      onClick={() => navigator.clipboard.writeText(`${API}/companies/anchor/${anchorCompany.anchorToken}/ingest`)}
                      className="px-3 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-medium hover:bg-indigo-100 transition-colors whitespace-nowrap"
                    >
                      Copy
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Example Request</label>
                  <pre className="px-3 py-2 bg-slate-900 text-green-400 rounded-xl text-xs overflow-x-auto">
{`curl -X POST ${API}/companies/anchor/${anchorCompany.anchorToken}/ingest \\
  -H "Content-Type: application/json" \\
  -d '{
    "clientName": "John Doe",
    "clientEmail": "john@example.com",
    "message": "Hello, I need help!"
  }'`}
                  </pre>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Anchor Token (keep secret)</label>
                  <code className="block px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700">
                    {anchorCompany.anchorToken}
                  </code>
                </div>
              </div>

              <button
                onClick={() => setAnchorCompany(null)}
                className="w-full mt-6 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-200 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
