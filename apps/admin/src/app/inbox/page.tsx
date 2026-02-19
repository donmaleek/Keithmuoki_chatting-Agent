'use client';

import { useState, useEffect, useCallback } from 'react';
import Layout from '@/components/Layout';
import { ConversationList } from '@/components/ConversationList';
import { MessageThread } from '@/components/MessageThread';
import { ReplyEditor } from '@/components/ReplyEditor';
import { PaymentDetector } from '@/components/PaymentDetector';
import { ClientProfile } from '@/components/ClientProfile';
import { apiClient } from '@/lib/api';

type AiMode = 'auto' | 'draft' | 'manual';

interface ConversationDetail {
  id: string;
  channel: string;
  status: string;
  aiMode: AiMode;
  clientId: string;
  assignedToId?: string | null;
  assignedTo?: { id: string; name: string } | null;
  client?: { name?: string; phone?: string; email?: string };
}

const AI_MODE_CONFIG: Record<AiMode, { label: string; icon: string; dot: string; activeText: string; activeBorder: string }> = {
  auto: {
    label: 'Auto-pilot',
    icon: '\u26A1',
    dot: 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.5)] animate-pulse-dot',
    activeText: 'text-emerald-600',
    activeBorder: 'border-emerald-400/40'
  },
  draft: {
    label: 'Co-pilot',
    icon: '\u2728',
    dot: 'bg-indigo-400 shadow-[0_0_6px_rgba(129,140,248,0.5)]',
    activeText: 'text-indigo-600',
    activeBorder: 'border-indigo-400/40'
  },
  manual: {
    label: 'Manual',
    icon: '\uD83D\uDC64',
    dot: 'bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.5)]',
    activeText: 'text-amber-600',
    activeBorder: 'border-amber-400/40'
  }
};

const CHANNEL_LABELS: Record<string, { label: string; color: string }> = {
  whatsapp: { label: 'WhatsApp', color: 'text-green-700 bg-green-50 border-green-200/60' },
  sms: { label: 'SMS', color: 'text-purple-700 bg-purple-50 border-purple-200/60' },
  email: { label: 'Email', color: 'text-blue-700 bg-blue-50 border-blue-200/60' },
  instagram: { label: 'Instagram', color: 'text-pink-700 bg-pink-50 border-pink-200/60' },
  facebook: { label: 'Facebook', color: 'text-blue-700 bg-blue-50 border-blue-200/60' },
  telegram: { label: 'Telegram', color: 'text-sky-700 bg-sky-50 border-sky-200/60' },
  web: { label: 'Web', color: 'text-slate-600 bg-slate-100 border-slate-200/60' },
};

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

export default function InboxPage() {
  const [selectedConversation, setSelectedConversation] = useState<ConversationDetail | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [modeChanging, setModeChanging] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showProfile, setShowProfile] = useState(true);
  const [userRole, setUserRole] = useState<string>('agent');
  const [userId, setUserId] = useState<string>('');
  const [filter, setFilter] = useState<'all' | 'mine' | 'unassigned'>('all');

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (!storedToken) localStorage.setItem('token', 'demo-token');
    apiClient
      .get<{ id: string; role: string }>('/auth/me')
      .then((u) => {
        setUserRole(u.role);
        setUserId(u.id);
        if (u.role === 'agent') setFilter('mine');
      })
      .catch(() => {});
  }, []);

  const fetchConversationDetail = useCallback(async (convId: string) => {
    try {
      const token = localStorage.getItem('token') || 'demo';
      const res = await fetch(`${BACKEND_URL}/messages/conversations/${convId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = (await res.json()) as ConversationDetail;
        setSelectedConversation(data);
      } else {
        setSelectedConversation({ id: convId, channel: 'unknown', status: 'open', aiMode: 'draft', clientId: convId });
      }
    } catch {
      setSelectedConversation({ id: convId, channel: 'unknown', status: 'open', aiMode: 'draft', clientId: convId });
    }
  }, []);

  const handleSelectConversation = (convId: string) => {
    setReplyContent('');
    fetchConversationDetail(convId);
  };

  const handleChangeMode = async (mode: AiMode) => {
    if (!selectedConversation || modeChanging) return;
    setModeChanging(true);
    try {
      const updated = await apiClient.patch<ConversationDetail>(
        `/ai/conversations/${selectedConversation.id}/mode`,
        { mode }
      );
      setSelectedConversation(prev => prev ? { ...prev, aiMode: updated.aiMode } : prev);
    } catch (err) {
      console.error('Failed to update AI mode:', err);
    } finally {
      setModeChanging(false);
    }
  };

  const conv = selectedConversation;

  const handleAssignToMe = async () => {
    if (!conv || !userId) return;
    try {
      await apiClient.post(`/team/conversations/${conv.id}/assign`, { agentId: userId });
      fetchConversationDetail(conv.id);
    } catch (err) {
      console.error('Failed to assign:', err);
    }
  };

  const handleUnassign = async () => {
    if (!conv) return;
    try {
      await apiClient.post(`/team/conversations/${conv.id}/unassign`, {});
      fetchConversationDetail(conv.id);
    } catch (err) {
      console.error('Failed to unassign:', err);
    }
  };

  const modeInfo = conv ? AI_MODE_CONFIG[conv.aiMode] : null;
  const channelInfo = conv ? CHANNEL_LABELS[conv.channel] ?? CHANNEL_LABELS.web : null;

  return (
    <Layout>
      <div className="flex h-full bg-gradient-to-br from-slate-50 via-white to-indigo-50/20">

        {/* ====== LEFT: Conversation Sidebar ====== */}
        <div className="w-[340px] flex flex-col flex-shrink-0 glass border-r border-slate-200/60">

          {/* Header */}
          <div className="px-4 pt-4 pb-2">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <h2 className="text-lg font-bold text-slate-900 tracking-tight">Inbox</h2>
                <span className="relative flex items-center gap-1 px-2 py-0.5 bg-emerald-50 border border-emerald-200/60 text-emerald-600 text-[10px] font-bold rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse-dot" />
                  Live
                </span>
              </div>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1 p-1 bg-slate-100/80 rounded-xl">
              {(userRole === 'admin'
                ? (['all', 'unassigned'] as const)
                : (['mine', 'unassigned'] as const)
              ).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`flex-1 py-1.5 text-[11px] font-semibold rounded-lg transition-all duration-200 ${
                    filter === f
                      ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200/60'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {f === 'all' ? 'All Chats' : f === 'mine' ? 'My Chats' : 'Unassigned'}
                </button>
              ))}
            </div>
          </div>

          {/* Search */}
          <div className="px-4 pb-3">
            <div className="relative group">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search conversations\u2026"
                className="w-full pl-9 pr-3 py-2.5 bg-white/60 border border-slate-200/60 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 focus:bg-white placeholder:text-slate-400 transition-all"
              />
            </div>
          </div>

          {/* Conversation List */}
          <div className="flex-1 overflow-hidden">
            <ConversationList
              onSelect={handleSelectConversation}
              selected={conv?.id}
              searchQuery={searchQuery}
              userRole={userRole}
              userId={userId}
              filter={filter}
            />
          </div>
        </div>

        {/* ====== CENTER: Chat Thread ====== */}
        {conv ? (
          <div className="flex-1 flex flex-col min-w-0">

            {/* Chat Header */}
            <div className="glass border-b border-slate-200/60 px-5 py-3">
              <div className="flex items-center justify-between">

                {/* Left: Client Info */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-slate-900 text-sm truncate">
                        {conv.client?.name || `Client ${conv.clientId.slice(0, 6)}`}
                      </h3>
                      {channelInfo && (
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold border ${channelInfo.color}`}>
                          {channelInfo.label}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${modeInfo?.dot}`} />
                        <span className={`text-[11px] font-medium ${modeInfo?.activeText}`}>
                          {modeInfo?.icon} {modeInfo?.label}
                        </span>
                      </div>
                      <span className="w-px h-3 bg-slate-200" />
                      <span className={`text-[11px] font-medium px-1.5 py-0.5 rounded-md ${
                        conv.status === 'open' ? 'text-emerald-600 bg-emerald-50'
                        : conv.status === 'pending' ? 'text-amber-600 bg-amber-50'
                        : 'text-slate-500 bg-slate-100'
                      }`}>
                        {conv.status.charAt(0).toUpperCase() + conv.status.slice(1)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Controls */}
                <div className="flex items-center gap-2">

                  {/* AI Mode Selector */}
                  <div className="hidden sm:flex items-center bg-slate-100/80 rounded-xl p-0.5 gap-0.5">
                    {(['auto', 'draft', 'manual'] as AiMode[]).map(m => {
                      const cfg = AI_MODE_CONFIG[m];
                      const active = conv.aiMode === m;
                      return (
                        <button
                          key={m}
                          onClick={() => handleChangeMode(m)}
                          disabled={modeChanging || active}
                          title={cfg.label}
                          className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all duration-200 ${
                            active
                              ? `bg-white ${cfg.activeText} shadow-sm ring-1 ${cfg.activeBorder}`
                              : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
                          } disabled:cursor-default`}
                        >
                          {cfg.icon} {cfg.label}
                        </button>
                      );
                    })}
                  </div>

                  <div className="hidden sm:block w-px h-6 bg-slate-200" />

                  {/* Assignment */}
                  {conv.assignedTo ? (
                    <div className="flex items-center gap-1.5">
                      <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-50/80 border border-blue-200/50 rounded-lg">
                        <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-[9px] font-bold text-white shadow-sm">
                          {conv.assignedTo.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-[11px] text-blue-700 font-medium">{conv.assignedTo.name.split(' ')[0]}</span>
                      </div>
                      {userRole === 'admin' && (
                        <button
                          onClick={handleUnassign}
                          className="w-7 h-7 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-500 flex items-center justify-center transition-all"
                          title="Unassign"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      )}
                    </div>
                  ) : (
                    <button
                      onClick={handleAssignToMe}
                      className="inline-flex items-center gap-1.5 text-[11px] px-3 py-1.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-lg font-semibold shadow-md shadow-indigo-500/20 hover:shadow-lg hover:shadow-indigo-500/30 hover:-translate-y-px active:translate-y-0 transition-all duration-200"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                      Claim
                    </button>
                  )}

                  {/* Profile toggle */}
                  <button
                    onClick={() => setShowProfile(p => !p)}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 ${
                      showProfile
                        ? 'bg-indigo-100 text-indigo-600 ring-1 ring-indigo-200/60'
                        : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'
                    }`}
                    title="Toggle client info"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Message Thread */}
            <div className="flex-1 overflow-hidden min-h-0 relative dot-pattern">
              <MessageThread conversationId={conv.id} />
            </div>

            {/* Reply Area */}
            <div className="glass border-t border-slate-200/60">
              <PaymentDetector
                messageContent={replyContent}
                conversationId={conv.id}
                clientId={conv.clientId}
              />
              <ReplyEditor
                conversationId={conv.id}
                aiMode={conv.aiMode}
                onContentChange={setReplyContent}
                onSend={() => setReplyContent('')}
              />
            </div>
          </div>
        ) : (
          /* ====== Empty State ====== */
          <div className="flex-1 flex flex-col items-center justify-center gap-6 dot-pattern">
            <div className="relative">
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-2xl shadow-indigo-500/25 animate-float">
                <svg className="w-10 h-10 text-white/90" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" /></svg>
              </div>
              <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/30 animate-bounce-slow">
                <span className="text-white text-sm">\u26A1</span>
              </div>
            </div>
            <div className="text-center max-w-xs">
              <h3 className="text-xl font-bold text-slate-900 tracking-tight">Welcome to your inbox</h3>
              <p className="text-slate-500 text-sm mt-2 leading-relaxed">
                Select a conversation to start chatting with AI-powered assistance
              </p>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-slate-400">
              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse-dot" /> AI Active</span>
              <span className="w-px h-3 bg-slate-200" />
              <span>\u2318K search</span>
              <span className="w-px h-3 bg-slate-200" />
              <span>\u2318\u21B5 send</span>
            </div>
          </div>
        )}

        {/* ====== RIGHT: Client Profile ====== */}
        {conv && showProfile && (
          <div className="w-80 border-l border-slate-200/60 glass overflow-hidden flex-shrink-0 animate-slide-in-right">
            <ClientProfile clientId={conv.clientId} />
          </div>
        )}
      </div>
    </Layout>
  );
}
