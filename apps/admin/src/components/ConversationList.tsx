import { useState, useEffect, useCallback } from 'react';

interface Conversation {
  id: string;
  clientId: string;
  channel: string;
  status: string;
  aiMode?: string;
  assignedToId?: string | null;
  assignedTo?: { id: string; name: string } | null;
  createdAt: string;
  updatedAt: string;
  client?: { name?: string; phone?: string; email?: string };
  lastMessage?: { content: string; sender: string; createdAt: string };
  _count?: { messages: number };
}

interface ConversationListProps {
  onSelect: (id: string) => void;
  selected?: string;
  searchQuery?: string;
  userRole?: string;
  userId?: string;
  filter?: 'all' | 'mine' | 'unassigned';
}

const CHANNEL_ICONS: Record<string, { emoji: string; bg: string; ring: string }> = {
  whatsapp:  { emoji: '\uD83D\uDCF1', bg: 'bg-green-500',  ring: 'ring-green-400/30' },
  sms:       { emoji: '\uD83D\uDCAC', bg: 'bg-purple-500', ring: 'ring-purple-400/30' },
  email:     { emoji: '\u2709\uFE0F', bg: 'bg-blue-500',   ring: 'ring-blue-400/30' },
  instagram: { emoji: '\uD83D\uDCF8', bg: 'bg-pink-500',   ring: 'ring-pink-400/30' },
  facebook:  { emoji: '\uD83D\uDC64', bg: 'bg-blue-600',   ring: 'ring-blue-400/30' },
  telegram:  { emoji: '\u2708\uFE0F', bg: 'bg-sky-500',    ring: 'ring-sky-400/30' },
  web:       { emoji: '\uD83C\uDF10', bg: 'bg-slate-500',  ring: 'ring-slate-400/30' },
};

const AI_MODE_DOT: Record<string, string> = {
  auto:   'bg-emerald-400 shadow-[0_0_5px_rgba(52,211,153,0.4)]',
  draft:  'bg-indigo-400 shadow-[0_0_5px_rgba(129,140,248,0.4)]',
  manual: 'bg-amber-400 shadow-[0_0_5px_rgba(251,191,36,0.4)]',
};

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.floor((now - then) / 1000);
  if (diff < 60) return 'now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d`;
  return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function getClientName(conv: Conversation): string {
  if (conv.client?.name && conv.client.name !== 'Unknown') return conv.client.name;
  if (conv.client?.phone) return conv.client.phone;
  if (conv.client?.email) return conv.client.email;
  return `Client ${conv.clientId.slice(0, 6)}`;
}

function getInitials(name: string): string {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

const AVATAR_GRADIENTS = [
  'from-indigo-500 to-violet-500',
  'from-rose-500 to-pink-500',
  'from-emerald-500 to-teal-500',
  'from-amber-500 to-orange-500',
  'from-cyan-500 to-blue-500',
  'from-fuchsia-500 to-purple-500',
  'from-lime-500 to-green-500',
  'from-sky-500 to-indigo-500',
];

function getAvatarGradient(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_GRADIENTS[Math.abs(hash) % AVATAR_GRADIENTS.length];
}

export function ConversationList({ onSelect, selected, searchQuery, userRole, userId, filter }: ConversationListProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConversations = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      let url = `${BACKEND_URL}/messages/conversations?take=50`;
      if (userRole === 'agent' && userId) {
        url += filter === 'unassigned' ? `&unassigned=true` : `&assignedToId=${userId}`;
      } else if (userRole === 'admin' && filter === 'unassigned') {
        url += `&unassigned=true`;
      }
      const response = await fetch(url, { headers: { Authorization: `Bearer ${token || 'demo'}` } });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = (await response.json()) as Conversation[];
      setConversations(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [userRole, userId, filter]);

  useEffect(() => {
    fetchConversations();
    const interval = setInterval(fetchConversations, 6000);
    return () => clearInterval(interval);
  }, [fetchConversations]);

  const filtered = searchQuery
    ? conversations.filter(c => {
        const q = searchQuery.toLowerCase();
        return getClientName(c).toLowerCase().includes(q) ||
          c.channel.includes(q) ||
          c.lastMessage?.content.toLowerCase().includes(q);
      })
    : conversations;

  if (loading && conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 gap-4">
        <div className="relative w-10 h-10">
          <div className="absolute inset-0 rounded-full border-2 border-indigo-100" />
          <div className="absolute inset-0 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
        </div>
        <p className="text-slate-400 text-xs font-medium">Loading conversations\u2026</p>
      </div>
    );
  }

  if (error && conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 p-6">
        <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center">
          <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg>
        </div>
        <p className="text-red-500 text-xs text-center font-medium">{error}</p>
        <button onClick={fetchConversations}
          className="px-4 py-1.5 bg-indigo-600 text-white rounded-lg text-xs hover:bg-indigo-700 font-semibold shadow-sm shadow-indigo-500/20 transition-all">
          Retry
        </button>
      </div>
    );
  }

  if (filtered.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 gap-3">
        <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center">
          <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 9v.906a2.25 2.25 0 01-1.183 1.981l-6.478 3.488M2.25 9v.906a2.25 2.25 0 001.183 1.981l6.478 3.488m8.839 2.51l-4.66-2.51m0 0l-1.023-.55a2.25 2.25 0 00-2.134 0l-1.022.55m0 0l-4.661 2.51m16.5 1.615a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V8.844a2.25 2.25 0 011.183-1.981l7.5-4.039a2.25 2.25 0 012.134 0l7.5 4.039a2.25 2.25 0 011.183 1.98V19.5z" /></svg>
        </div>
        <div className="text-center">
          <p className="text-slate-600 text-sm font-semibold">No conversations</p>
          <p className="text-slate-400 text-xs mt-0.5">Messages will appear here</p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-y-auto h-full px-2 py-1">
      {filtered.map((conv, idx) => {
        const name = getClientName(conv);
        const initials = getInitials(name);
        const isSelected = selected === conv.id;
        const channelInfo = CHANNEL_ICONS[conv.channel] ?? CHANNEL_ICONS.web;
        const aiDot = AI_MODE_DOT[(conv.aiMode as string) ?? 'draft'] ?? AI_MODE_DOT.draft;
        const preview = conv.lastMessage?.content ?? 'No messages yet';
        const time = conv.updatedAt ? timeAgo(conv.updatedAt) : '';

        return (
          <button
            key={conv.id}
            onClick={() => onSelect(conv.id)}
            className={`w-full text-left px-3 py-3 flex items-start gap-3 transition-all duration-200 rounded-xl mb-0.5 group ${
              isSelected
                ? 'bg-indigo-50/80 ring-1 ring-indigo-200/60 shadow-sm'
                : 'hover:bg-slate-50/80'
            }`}
            style={{ animationDelay: `${idx * 30}ms` }}
          >
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${getAvatarGradient(conv.clientId)} flex items-center justify-center text-white text-xs font-bold shadow-md shadow-slate-200/50 transition-transform duration-200 group-hover:scale-105`}>
                {initials}
              </div>
              <div className={`absolute -bottom-0.5 -right-0.5 w-4.5 h-4.5 ${channelInfo.bg} rounded-full flex items-center justify-center text-[7px] ring-2 ring-white ${channelInfo.ring}`} style={{width:'18px',height:'18px'}}>
                {channelInfo.emoji}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className={`text-[13px] truncate ${isSelected ? 'font-bold text-indigo-900' : 'font-semibold text-slate-800'}`}>
                  {name}
                </p>
                <span className="text-[10px] text-slate-400 flex-shrink-0 tabular-nums font-medium">{time}</span>
              </div>
              <p className="text-xs text-slate-500 truncate mt-0.5 leading-relaxed">{preview.slice(0, 55)}{preview.length > 55 ? '\u2026' : ''}</p>
              <div className="flex items-center gap-1.5 mt-2">
                <span className={`inline-block w-1.5 h-1.5 rounded-full ${aiDot}`} title={`AI: ${conv.aiMode ?? 'draft'}`} />
                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${
                  conv.status === 'open' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200/60'
                  : conv.status === 'pending' ? 'bg-amber-50 text-amber-600 border border-amber-200/60'
                  : 'bg-slate-100 text-slate-500 border border-slate-200/60'
                }`}>
                  {conv.status}
                </span>
                {conv.assignedTo ? (
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-600 border border-blue-200/60">
                    {conv.assignedTo.name.split(' ')[0]}
                  </span>
                ) : (
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-orange-50 text-orange-500 border border-orange-200/60">
                    Unassigned
                  </span>
                )}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
