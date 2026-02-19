'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

interface Message {
  id: string;
  sender: 'client' | 'agent' | 'ai';
  content: string;
  createdAt: string;
}

interface CompanyInfo {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  status: string;
  anchorToken: string;
}

export default function PublicChatPage({ params }: { params: { slug: string } }) {
  const [company, setCompany] = useState<CompanyInfo | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [conversationId, setConversationId] = useState<string | null>(null);

  // Client info (collected on first message)
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [showIntro, setShowIntro] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Fetch company info
  useEffect(() => {
    fetch(`${BACKEND}/companies/anchor/${params.slug}`)
      .then(r => {
        if (!r.ok) throw new Error('Company not found');
        return r.json();
      })
      .then(data => {
        setCompany(data);
        setLoading(false);

        // Restore session
        const session = localStorage.getItem(`chat_session_${params.slug}`);
        if (session) {
          const parsed = JSON.parse(session);
          setConversationId(parsed.conversationId);
          setClientName(parsed.clientName || '');
          setClientEmail(parsed.clientEmail || '');
          setShowIntro(false);
        }
      })
      .catch(() => {
        setError('This chat is not available.');
        setLoading(false);
      });
  }, [params.slug]);

  // Poll for new messages when conversation exists
  const fetchMessages = useCallback(async () => {
    if (!conversationId) return;
    try {
      const res = await fetch(`${BACKEND}/messages?conversationId=${conversationId}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(Array.isArray(data) ? data : data.messages || []);
      }
    } catch {
      // silent
    }
  }, [conversationId]);

  useEffect(() => {
    if (conversationId) {
      fetchMessages();
      pollRef.current = setInterval(fetchMessages, 3000);
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [conversationId, fetchMessages]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const startChat = async () => {
    if (!clientName.trim()) return;
    setShowIntro(false);
  };

  const sendMessage = async () => {
    if (!input.trim() || !company || sending) return;
    setSending(true);

    try {
      const res = await fetch(`${BACKEND}/companies/anchor/${company.anchorToken}/ingest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName: clientName || 'Visitor',
          clientEmail: clientEmail || undefined,
          message: input.trim(),
          channel: 'web',
        }),
      });

      if (!res.ok) throw new Error('Failed to send');
      const data = await res.json();

      // Save session
      if (!conversationId) {
        setConversationId(data.conversationId);
        localStorage.setItem(`chat_session_${params.slug}`, JSON.stringify({
          conversationId: data.conversationId,
          clientName,
          clientEmail,
        }));
      }

      // Optimistic add
      setMessages(prev => [...prev, {
        id: data.messageId,
        sender: 'client',
        content: input.trim(),
        createdAt: new Date().toISOString(),
      }]);

      setInput('');

      // Fetch after a short delay to get any AI response
      setTimeout(fetchMessages, 1500);
    } catch {
      setError('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-indigo-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 text-sm">Loading chat...</p>
        </div>
      </div>
    );
  }

  if (error && !company) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-indigo-50">
        <div className="text-center">
          <div className="text-4xl mb-3">😕</div>
          <h2 className="text-lg font-semibold text-slate-700">{error}</h2>
          <p className="text-slate-500 text-sm mt-1">This company chat link may be invalid or inactive.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden flex flex-col" style={{ height: '600px' }}>
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-5 py-4 flex items-center gap-3">
          {company?.logo ? (
            <img src={company.logo} alt="" className="w-9 h-9 rounded-full border-2 border-white/30" />
          ) : (
            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-sm">
              {company?.name?.charAt(0) || '?'}
            </div>
          )}
          <div>
            <h1 className="text-white font-semibold text-sm">{company?.name}</h1>
            <p className="text-indigo-200 text-xs">
              <span className="inline-block w-1.5 h-1.5 bg-green-400 rounded-full mr-1" />
              Online • We typically reply instantly
            </p>
          </div>
        </div>

        {/* Intro form or messages */}
        {showIntro ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 gap-4">
            <div className="text-center mb-2">
              <h2 className="text-lg font-semibold text-slate-800">Welcome! 👋</h2>
              <p className="text-slate-500 text-sm mt-1">
                Start a conversation with {company?.name}. Enter your name to begin.
              </p>
            </div>

            <div className="w-full space-y-3">
              <input
                type="text"
                placeholder="Your name *"
                value={clientName}
                onChange={e => setClientName(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                onKeyDown={e => e.key === 'Enter' && startChat()}
              />
              <input
                type="email"
                placeholder="Your email (optional)"
                value={clientEmail}
                onChange={e => setClientEmail(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                onKeyDown={e => e.key === 'Enter' && startChat()}
              />
              <button
                onClick={startChat}
                disabled={!clientName.trim()}
                className="w-full py-2.5 bg-indigo-600 text-white rounded-xl font-medium text-sm hover:bg-indigo-700 disabled:opacity-40 transition-colors"
              >
                Start Chat
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Messages area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-slate-400 text-sm">
                    Send a message to start the conversation!
                  </p>
                </div>
              )}

              {messages.map(msg => (
                <div key={msg.id} className={`flex ${msg.sender === 'client' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                      msg.sender === 'client'
                        ? 'bg-indigo-600 text-white rounded-br-md'
                        : 'bg-slate-100 text-slate-800 rounded-bl-md'
                    }`}
                  >
                    {msg.sender !== 'client' && (
                      <p className="text-[10px] font-medium text-indigo-500 mb-0.5">
                        {msg.sender === 'ai' ? '🤖 AI Assistant' : '👤 Agent'}
                      </p>
                    )}
                    {msg.content}
                    <p className={`text-[10px] mt-1 ${msg.sender === 'client' ? 'text-indigo-200' : 'text-slate-400'}`}>
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input area */}
            <div className="border-t border-slate-100 p-3">
              {error && (
                <p className="text-red-500 text-xs mb-2 text-center">{error}</p>
              )}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={input}
                  onChange={e => { setInput(e.target.value); setError(''); }}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                  className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  disabled={sending}
                />
                <button
                  onClick={sendMessage}
                  disabled={!input.trim() || sending}
                  className="p-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-40 transition-colors"
                >
                  {sending ? (
                    <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="31.4" strokeDashoffset="10" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </>
        )}

        {/* Powered by footer */}
        <div className="text-center py-2 border-t border-slate-50">
          <p className="text-[10px] text-slate-400">
            Powered by <span className="font-semibold text-indigo-500">ChatAgent</span>
          </p>
        </div>
      </div>
    </div>
  );
}
