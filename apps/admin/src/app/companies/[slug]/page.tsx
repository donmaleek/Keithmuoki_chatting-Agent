'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Layout from '../../../components/Layout';

const API = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

interface CompanyDetail {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  plan: string;
  status: string;
  anchorToken: string;
  maxAgents: number;
  maxConvos: number;
  owner: { id: string; name: string; email: string };
  agents: { id: string; user: { id: string; name: string; email: string; role: string } }[];
  _count: { conversations: number; clients: number };
}

interface Conversation {
  id: string;
  status: string;
  channel: string;
  aiMode: string;
  createdAt: string;
  updatedAt: string;
  client: { id: string; name: string; email: string | null; phone: string | null };
  assignedTo: { id: string; name: string } | null;
  messages: { id: string; content: string; sender: string; createdAt: string }[];
  _count: { messages: number };
}

interface MessageItem {
  id: string;
  content: string;
  sender: string;
  createdAt: string;
}

export default function CompanyDetailPage() {
  const params = useParams();
  const slug = params?.slug as string;

  const [company, setCompany] = useState<CompanyDetail | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConvo, setSelectedConvo] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);

  const getHeaders = useCallback(() => {
    const t = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    return { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' };
  }, []);

  const fetchCompany = useCallback(async () => {
    try {
      const res = await fetch(`${API}/companies/${slug}`, { headers: getHeaders() });
      if (res.ok) setCompany(await res.json());
    } catch { /* ignore */ }
  }, [slug, getHeaders]);

  const fetchConversations = useCallback(async () => {
    if (!company) return;
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      const res = await fetch(`${API}/companies/${company.id}/conversations?${params}`, { headers: getHeaders() });
      if (res.ok) setConversations(await res.json());
    } catch { /* ignore */ }
  }, [company, statusFilter, getHeaders]);

  const fetchMessages = useCallback(async (convoId: string) => {
    try {
      const res = await fetch(`${API}/messages/conversations/${convoId}/messages`, { headers: getHeaders() });
      if (res.ok) setMessages(await res.json());
    } catch { /* ignore */ }
  }, [getHeaders]);

  useEffect(() => {
    fetchCompany().finally(() => setLoading(false));
  }, [fetchCompany]);

  useEffect(() => {
    if (company) fetchConversations();
  }, [company, fetchConversations]);

  useEffect(() => {
    if (selectedConvo) fetchMessages(selectedConvo);
  }, [selectedConvo, fetchMessages]);

  const handleReply = async () => {
    if (!replyText.trim() || !selectedConvo) return;
    setSending(true);
    try {
      await fetch(`${API}/messages/reply`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ conversationId: selectedConvo, content: replyText }),
      });
      setReplyText('');
      await fetchMessages(selectedConvo);
    } catch { /* ignore */ } finally {
      setSending(false);
    }
  };

  const selectedConversation = conversations.find((c) => c.id === selectedConvo);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-slate-400">Loading company...</div>
        </div>
      </Layout>
    );
  }

  if (!company) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="text-5xl mb-3">🏢</div>
            <p className="text-slate-500">Company not found</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="h-[calc(100vh-2rem)] flex flex-col m-4 bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm">
        {/* Company Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-indigo-50/50 to-violet-50/50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white font-bold text-lg shadow-md">
              {company.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">{company.name}</h1>
              <div className="flex items-center gap-3 text-xs text-slate-500">
                <span>/{company.slug}</span>
                <span>•</span>
                <span>{company._count.conversations} conversations</span>
                <span>•</span>
                <span>{company._count.clients} clients</span>
                <span>•</span>
                <span>{company.agents.length} agents</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              company.plan === 'growth' ? 'bg-indigo-100 text-indigo-700' :
              company.plan === 'scale' ? 'bg-amber-100 text-amber-700' :
              'bg-emerald-100 text-emerald-700'
            }`}>
              {company.plan} plan
            </span>
          </div>
        </div>

        {/* Main content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Conversation sidebar */}
          <div className="w-80 border-r border-slate-100 flex flex-col">
            {/* Filters */}
            <div className="p-3 border-b border-slate-100">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="">All conversations</option>
                <option value="open">Open</option>
                <option value="pending">Pending</option>
                <option value="human_takeover">Human takeover</option>
                <option value="closed">Closed</option>
              </select>
            </div>

            {/* Conversation list */}
            <div className="flex-1 overflow-y-auto">
              {conversations.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-sm">No conversations yet</div>
              ) : (
                conversations.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedConvo(c.id)}
                    className={`w-full text-left px-4 py-3 border-b border-slate-50 hover:bg-slate-50 transition-colors ${
                      selectedConvo === c.id ? 'bg-indigo-50 border-l-2 border-l-indigo-500' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm text-slate-900 truncate">{c.client.name}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                        c.status === 'open' ? 'bg-emerald-100 text-emerald-600' :
                        c.status === 'pending' ? 'bg-amber-100 text-amber-600' :
                        c.status === 'human_takeover' ? 'bg-red-100 text-red-600' :
                        'bg-slate-100 text-slate-500'
                      }`}>
                        {c.status.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 truncate">
                      {c.messages[0]?.content || 'No messages'}
                    </p>
                    <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400">
                      <span>{c.channel}</span>
                      <span>•</span>
                      <span>{c._count.messages} msgs</span>
                      {c.assignedTo && (
                        <>
                          <span>•</span>
                          <span>→ {c.assignedTo.name}</span>
                        </>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Message thread */}
          <div className="flex-1 flex flex-col">
            {!selectedConvo ? (
              <div className="flex-1 flex items-center justify-center text-slate-400">
                <div className="text-center">
                  <div className="text-5xl mb-3">💬</div>
                  <p>Select a conversation to view messages</p>
                </div>
              </div>
            ) : (
              <>
                {/* Conversation header */}
                {selectedConversation && (
                  <div className="px-6 py-3 border-b border-slate-100 flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-slate-900">{selectedConversation.client.name}</h3>
                      <p className="text-xs text-slate-500">
                        {selectedConversation.client.email || selectedConversation.client.phone || 'No contact info'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <span className="px-2 py-1 bg-slate-100 rounded-lg">{selectedConversation.channel}</span>
                      <span className="px-2 py-1 bg-slate-100 rounded-lg">AI: {selectedConversation.aiMode}</span>
                    </div>
                  </div>
                )}

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-6 space-y-3">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.sender === 'client' ? 'justify-start' : 'justify-end'}`}
                    >
                      <div
                        className={`max-w-[70%] px-4 py-2.5 rounded-2xl text-sm ${
                          msg.sender === 'client'
                            ? 'bg-slate-100 text-slate-900 rounded-bl-md'
                            : msg.sender === 'ai'
                            ? 'bg-violet-100 text-violet-900 rounded-br-md'
                            : 'bg-indigo-600 text-white rounded-br-md'
                        }`}
                      >
                        <p>{msg.content}</p>
                        <div className={`text-[10px] mt-1 ${
                          msg.sender === 'client' ? 'text-slate-400' :
                          msg.sender === 'ai' ? 'text-violet-400' :
                          'text-white/60'
                        }`}>
                          {msg.sender} • {new Date(msg.createdAt).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Reply box */}
                <div className="px-6 py-4 border-t border-slate-100">
                  <div className="flex items-center gap-3">
                    <input
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleReply()}
                      placeholder="Type your reply..."
                      className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 text-slate-900"
                    />
                    <button
                      onClick={handleReply}
                      disabled={sending || !replyText.trim()}
                      className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl text-sm font-medium hover:opacity-90 transition-all disabled:opacity-50"
                    >
                      {sending ? '...' : 'Send'}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
