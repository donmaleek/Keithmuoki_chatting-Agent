import { useState, useEffect, useRef, useMemo } from 'react';
import { apiClient } from '@/lib/api';

interface ReplyEditorProps {
  conversationId: string;
  aiMode: 'manual' | 'draft' | 'auto';
  onSend?: () => void;
  onContentChange?: (content: string) => void;
}

interface AiSuggestion {
  reply: string;
  aiRunId?: string;
}

const QUICK_SNIPPETS = [
  'Thanks for reaching out \u2014 I can help with that right away.',
  "Got it. I\u2019ll confirm the details and get back to you shortly.",
  'I can share a payment link in under a minute.',
  'Would you like me to walk you through the best plan for your use case?',
  "Great question \u2014 here\u2019s the quickest way to solve this."
];

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

export function ReplyEditor({ conversationId, aiMode, onSend, onContentChange }: ReplyEditorProps) {
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<AiSuggestion | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [showAi, setShowAi] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [showSnippets, setShowSnippets] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const draftKey = `reply-draft:${conversationId}`;

  const quality = useMemo(() => {
    const text = content.trim();
    if (!text) return { score: 0, label: 'Start typing', color: 'bg-slate-300', track: 'bg-slate-100' };
    let score = 35;
    if (text.length >= 30) score += 20;
    if (text.length >= 80) score += 15;
    if (/[.!?]$/.test(text)) score += 10;
    if (/thank|great|happy|glad|sure/i.test(text)) score += 10;
    if (/\b(i|we)\b.*\b(can|will)\b/i.test(text)) score += 10;
    const finalScore = Math.max(0, Math.min(100, score));
    if (finalScore >= 80) return { score: finalScore, label: 'Excellent', color: 'bg-gradient-to-r from-emerald-400 to-emerald-500', track: 'bg-emerald-100' };
    if (finalScore >= 60) return { score: finalScore, label: 'Strong', color: 'bg-gradient-to-r from-indigo-400 to-indigo-500', track: 'bg-indigo-100' };
    if (finalScore >= 40) return { score: finalScore, label: 'Good', color: 'bg-gradient-to-r from-amber-400 to-amber-500', track: 'bg-amber-100' };
    return { score: finalScore, label: 'Needs polish', color: 'bg-gradient-to-r from-rose-400 to-rose-500', track: 'bg-rose-100' };
  }, [content]);

  useEffect(() => { onContentChange?.(content); }, [content, onContentChange]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const saved = localStorage.getItem(draftKey);
    if (saved) setContent(saved);
  }, [draftKey]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (content.trim()) localStorage.setItem(draftKey, content);
    else localStorage.removeItem(draftKey);
  }, [content, draftKey]);

  useEffect(() => {
    const el = textareaRef.current;
    if (el) { el.style.height = 'auto'; el.style.height = Math.min(el.scrollHeight, 160) + 'px'; }
  }, [content]);

  const handleRequestAi = async () => {
    if (!content.trim()) return;
    setLoadingAi(true);
    setSendError(null);
    try {
      const response = await apiClient.post<AiSuggestion>('/ai/respond', { conversationId, message: content });
      setAiSuggestion(response);
      setShowAi(true);
    } catch (err) {
      console.error('Failed to get AI suggestion:', err);
      setSendError('AI suggestion failed');
    } finally {
      setLoadingAi(false);
    }
  };

  const handleAcceptAi = () => {
    if (aiSuggestion) { setContent(aiSuggestion.reply); setShowAi(false); textareaRef.current?.focus(); }
  };

  const handleUseSnippet = (snippet: string) => {
    setContent((prev) => `${prev}${prev.trim() ? '\n\n' : ''}${snippet}`);
    setShowSnippets(false);
    textareaRef.current?.focus();
  };

  const handleSend = async () => {
    if (!content.trim() || sending) return;
    setSending(true);
    setSendError(null);
    try {
      const token = localStorage.getItem('token') || 'demo';
      const res = await fetch(`${BACKEND_URL}/messages/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ conversationId, content })
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setContent('');
      setAiSuggestion(null);
      setShowAi(false);
      localStorage.removeItem(draftKey);
      onSend?.();
    } catch (err) {
      console.error('Failed to send:', err);
      setSendError('Failed to send');
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); handleSend(); }
  };

  return (
    <div className="p-3 space-y-2">
      {/* AI Suggestion */}
      {showAi && aiSuggestion && (
        <div className="p-3.5 bg-gradient-to-r from-indigo-50/80 to-violet-50/80 border border-indigo-200/50 rounded-2xl animate-slide-up">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-indigo-500/20">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" /></svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider mb-1">AI Suggestion</p>
              <p className="text-[13px] text-slate-700 whitespace-pre-wrap leading-relaxed">{aiSuggestion.reply}</p>
            </div>
            <div className="flex flex-col gap-1.5 flex-shrink-0">
              <button onClick={handleAcceptAi} className="px-3 py-1.5 text-xs bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-lg hover:opacity-90 font-semibold shadow-md shadow-indigo-500/20 transition-all">
                Use this
              </button>
              <button onClick={() => setShowAi(false)} className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-all">
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="bg-white rounded-2xl border border-slate-200/60 focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-500/10 focus-within:shadow-lg focus-within:shadow-indigo-500/5 transition-all duration-200">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={aiMode === 'manual' ? 'Type your message\u2026' : 'Type your message or use AI\u2026'}
          disabled={sending}
          className="w-full px-4 py-3 bg-transparent border-0 focus:outline-none focus:ring-0 text-sm text-slate-800 resize-none placeholder:text-slate-400 disabled:opacity-50"
          rows={1}
        />

        {/* Snippets panel */}
        {showSnippets && (
          <div className="px-3 pb-2 animate-slide-up">
            <div className="flex flex-wrap gap-1.5">
              {QUICK_SNIPPETS.map((snippet) => (
                <button
                  key={snippet}
                  type="button"
                  onClick={() => handleUseSnippet(snippet)}
                  className="text-[10px] px-2.5 py-1.5 rounded-lg bg-slate-50 text-slate-600 hover:bg-indigo-50 hover:text-indigo-700 border border-slate-200/60 hover:border-indigo-200/60 transition-all duration-150"
                >
                  {snippet.slice(0, 30)}\u2026
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Bottom toolbar */}
        <div className="px-3 pb-2.5 pt-1">
          {/* Quality bar */}
          {content.trim() && (
            <div className="mb-2.5">
              <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
                <span className="font-medium">Reply quality</span>
                <span className="font-bold tabular-nums">{quality.label} \u00B7 {quality.score}%</span>
              </div>
              <div className={`h-1.5 ${quality.track} rounded-full overflow-hidden`}>
                <div className={`h-full ${quality.color} rounded-full transition-all duration-500 ease-out`} style={{ width: `${quality.score}%` }} />
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              {/* AI mode badge */}
              <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-lg border ${
                aiMode === 'auto' ? 'bg-emerald-50 text-emerald-600 border-emerald-200/60'
                : aiMode === 'draft' ? 'bg-indigo-50 text-indigo-600 border-indigo-200/60'
                : 'bg-slate-100 text-slate-500 border-slate-200/60'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${
                  aiMode === 'auto' ? 'bg-emerald-500 animate-pulse-dot' : aiMode === 'draft' ? 'bg-indigo-500' : 'bg-slate-400'
                }`} />
                {aiMode === 'auto' ? 'AI Active' : aiMode === 'draft' ? 'AI Draft' : 'Manual'}
              </span>

              {/* Snippets toggle */}
              <button
                onClick={() => setShowSnippets(s => !s)}
                className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs transition-all ${
                  showSnippets ? 'bg-indigo-100 text-indigo-600' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'
                }`}
                title="Quick snippets"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" /></svg>
              </button>

              {aiMode === 'draft' && (
                <button
                  onClick={handleRequestAi}
                  disabled={loadingAi || !content.trim()}
                  className="inline-flex items-center gap-1 text-[11px] text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 px-2.5 py-1.5 rounded-lg disabled:opacity-40 font-semibold transition-all border border-transparent hover:border-indigo-200/60"
                >
                  {loadingAi ? (
                    <>
                      <span className="w-3 h-3 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                      Thinking\u2026
                    </>
                  ) : (
                    <>
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" /></svg>
                      Suggest
                    </>
                  )}
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              {sendError && <span className="text-[10px] text-red-500 font-medium">{sendError}</span>}
              <span className="text-[10px] text-slate-400 hidden sm:inline tabular-nums">{content.length} chars</span>
              <button
                onClick={handleSend}
                disabled={sending || !content.trim()}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl hover:opacity-95 disabled:opacity-40 text-xs font-semibold shadow-md shadow-indigo-500/20 hover:shadow-lg hover:shadow-indigo-500/30 hover:-translate-y-px active:translate-y-0 transition-all duration-200"
              >
                {sending ? (
                  <><span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> Sending</>
                ) : (
                  <>
                    Send
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" /></svg>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
