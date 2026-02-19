import { useState, useEffect, useCallback, useRef } from 'react';

interface Message {
  id: string;
  conversationId: string;
  sender: string;
  content: string;
  createdAt: string;
}

interface MessageThreadProps {
  conversationId: string;
}

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

function shouldShowDateLabel(messages: Message[], index: number): boolean {
  if (index === 0) return true;
  return new Date(messages[index - 1].createdAt).toDateString() !== new Date(messages[index].createdAt).toDateString();
}

export function MessageThread({ conversationId }: MessageThreadProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const prevCountRef = useRef(0);

  const fetchMessages = useCallback(async () => {
    if (!conversationId) return;
    try {
      setLoading(prev => messages.length === 0 ? true : prev);
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${BACKEND_URL}/messages/conversations/${conversationId}/messages?take=100`,
        { headers: { Authorization: `Bearer ${token || 'demo'}` } }
      );
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = (await response.json()) as Message[];
      setMessages(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, [conversationId, messages.length]);

  useEffect(() => {
    if (!conversationId) { setMessages([]); return; }
    fetchMessages();
    const interval = setInterval(fetchMessages, 4000);
    return () => clearInterval(interval);
  }, [conversationId, fetchMessages]);

  useEffect(() => {
    if (messages.length > prevCountRef.current && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
    prevCountRef.current = messages.length;
  }, [messages.length]);

  if (!conversationId) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-slate-400 text-sm">Select a conversation</p>
      </div>
    );
  }

  if (loading && messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3">
        <div className="relative w-8 h-8">
          <div className="absolute inset-0 rounded-full border-2 border-indigo-100" />
          <div className="absolute inset-0 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
        </div>
        <p className="text-slate-400 text-xs font-medium">Loading messages\u2026</p>
      </div>
    );
  }

  if (error && messages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-red-400 text-sm font-medium">{error}</p>
          <button onClick={fetchMessages} className="mt-2 text-xs text-indigo-600 hover:text-indigo-700 font-medium">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-5 space-y-1">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 opacity-60">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" /></svg>
            </div>
            <p className="text-slate-400 text-sm font-medium">No messages yet</p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isClient = msg.sender === 'client';
            const isAi = msg.sender === 'ai';
            const showDate = shouldShowDateLabel(messages, idx);

            return (
              <div key={msg.id}>
                {showDate && (
                  <div className="flex items-center gap-3 my-5">
                    <div className="flex-1 h-px bg-slate-200/80" />
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest px-2">
                      {formatDateLabel(msg.createdAt)}
                    </span>
                    <div className="flex-1 h-px bg-slate-200/80" />
                  </div>
                )}

                <div className={`flex ${isClient ? 'justify-start' : 'justify-end'} mb-1.5 animate-slide-up`}>
                  <div className={`group relative max-w-[70%] ${isClient ? 'pr-10' : 'pl-10'}`}>
                    <div
                      className={`px-4 py-3 text-[13px] leading-relaxed transition-all ${
                        isClient
                          ? 'bg-white border border-slate-200/80 text-slate-800 rounded-2xl rounded-tl-md shadow-sm hover:shadow-md'
                          : isAi
                            ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-2xl rounded-tr-md shadow-lg shadow-emerald-500/15 hover:shadow-xl hover:shadow-emerald-500/20'
                            : 'bg-gradient-to-br from-indigo-500 to-violet-600 text-white rounded-2xl rounded-tr-md shadow-lg shadow-indigo-500/15 hover:shadow-xl hover:shadow-indigo-500/20'
                      }`}
                    >
                      <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                    </div>
                    <div className={`flex items-center gap-1.5 mt-1 ${isClient ? '' : 'justify-end'}`}>
                      {isAi && (
                        <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-500 bg-emerald-50 border border-emerald-200/60 px-1.5 py-0.5 rounded-full">
                          <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" /></svg>
                          AI
                        </span>
                      )}
                      <span className="text-[10px] text-slate-400 font-medium">{formatTime(msg.createdAt)}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
