'use client';

import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { apiClient } from '@/lib/api';

const EXAMPLE_PROMPTS = [
  `You are Keith, the founder of [Your Business]. You're friendly, conversational, and genuinely enjoy helping clients.
Write like you're texting a friend who happens to be a customer — warm, direct, no corporate fluff.
Use contractions (I'm, we'll, don't), keep replies to 1-3 sentences, and match the client's vibe.
When asked about pricing, mention our starter plan and offer to hop on a quick call to discuss.
If someone's frustrated, acknowledge it genuinely ("oh no, that's not cool — let me sort this out for you").
Never use bullet points or numbered lists in chat. Just talk naturally.
If you don't know something, say "hmm let me check on that" instead of making stuff up.`,
  `You are Sarah from [Company Name] customer support. You're the kind of person who texts with exclamation marks because you're genuinely enthusiastic.
Keep it casual but helpful. 1-3 sentences max unless they need a detailed explanation.
Start replies naturally — "Hey!", "Sure thing!", "Oh gotcha" — like a real person would.
Always end with something that keeps the conversation going, like a quick question or next step.
If you need to check something, just say "give me a sec to look into that" — don't try to guess.
Match their energy — if they're chill, be chill. If they're worried, be reassuring and warm.`,
];

interface AiStats {
  totalRuns: number;
  totalCostUsd: number;
  totalTokens: number;
}

export default function SettingsPage() {
  const [apiKey] = useState('sk_...***');
  const [copied, setCopied] = useState(false);

  // AI Persona state
  const [systemPrompt, setSystemPrompt] = useState('');
  const [savedPrompt, setSavedPrompt] = useState('');
  const [savingPrompt, setSavingPrompt] = useState(false);
  const [promptSaved, setPromptSaved] = useState(false);
  const [promptError, setPromptError] = useState<string | null>(null);
  const [aiStats, setAiStats] = useState<AiStats | null>(null);

  // Sales context state
  const [salesContext, setSalesContext] = useState('');
  const [savedSalesContext, setSavedSalesContext] = useState('');
  const [savingSales, setSavingSales] = useState(false);
  const [salesSaved, setSalesSaved] = useState(false);
  const [salesError, setSalesError] = useState<string | null>(null);

  // Account state
  const [accountName, setAccountName] = useState('');
  const [accountEmail, setAccountEmail] = useState('');
  const [savedAccountName, setSavedAccountName] = useState('');
  const [savedAccountEmail, setSavedAccountEmail] = useState('');
  const [savingAccount, setSavingAccount] = useState(false);
  const [accountSaved, setAccountSaved] = useState(false);
  const [accountError, setAccountError] = useState<string | null>(null);

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  useEffect(() => {
    // Load account
    apiClient.get<{ name: string; email: string }>('/auth/me')
      .then((user) => {
        setAccountName(user.name || '');
        setSavedAccountName(user.name || '');
        setAccountEmail(user.email || '');
        setSavedAccountEmail(user.email || '');
      })
      .catch(() => { /* skip */ });

    // Load existing persona + sales context
    apiClient.get<{ systemPrompt: string; salesContext: string }>('/ai/persona')
      .then(data => {
        setSystemPrompt(data.systemPrompt || '');
        setSavedPrompt(data.systemPrompt || '');
        setSalesContext(data.salesContext || '');
        setSavedSalesContext(data.salesContext || '');
      })
      .catch(() => { /* not logged in, skip */ });

    // Load AI stats
    apiClient.get<AiStats>('/ai/stats')
      .then(setAiStats)
      .catch(() => { /* skip */ });
  }, []);

  const handleCopyApiKey = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSavePersona = async () => {
    if (!systemPrompt.trim()) return;
    setSavingPrompt(true);
    setPromptError(null);
    try {
      await apiClient.patch('/ai/persona', { systemPrompt });
      setSavedPrompt(systemPrompt);
      setPromptSaved(true);
      setTimeout(() => setPromptSaved(false), 3000);
    } catch (err) {
      setPromptError('Failed to save. Please try again.');
      console.error(err);
    } finally {
      setSavingPrompt(false);
    }
  };

  const hasUnsavedChanges = systemPrompt !== savedPrompt;
  const hasUnsavedSalesChanges = salesContext !== savedSalesContext;
  const hasUnsavedAccountChanges = accountName !== savedAccountName || accountEmail !== savedAccountEmail;

  const handleSaveSalesContext = async () => {
    setSavingSales(true);
    setSalesError(null);
    try {
      await apiClient.patch('/ai/sales-context', { salesContext });
      setSavedSalesContext(salesContext);
      setSalesSaved(true);
      setTimeout(() => setSalesSaved(false), 3000);
    } catch (err) {
      setSalesError('Failed to save. Please try again.');
      console.error(err);
    } finally {
      setSavingSales(false);
    }
  };

  const handleSaveAccount = async () => {
    setSavingAccount(true);
    setAccountError(null);
    try {
      await apiClient.patch('/auth/me', { name: accountName, email: accountEmail });
      setSavedAccountName(accountName);
      setSavedAccountEmail(accountEmail);
      setAccountSaved(true);
      setTimeout(() => setAccountSaved(false), 3000);
    } catch (err) {
      setAccountError(err instanceof Error ? err.message : 'Failed to save account details');
    } finally {
      setSavingAccount(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirm password must match');
      return;
    }

    setSavingPassword(true);
    setPasswordError(null);
    try {
      await apiClient.patch('/auth/me/password', {
        currentPassword,
        newPassword,
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordSaved(true);
      setTimeout(() => setPasswordSaved(false), 3000);
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : 'Failed to change password');
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <Layout>
      <div className="p-6 lg:p-8 max-w-4xl space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
          <p className="text-slate-500 text-sm mt-1">Manage your account, AI persona, and integrations</p>
        </div>

        {/* ── AI Persona / Training ─────────────────────────────────── */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/60">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white text-lg shadow-md shadow-purple-500/20">🧠</div>
              <div>
                <h2 className="text-base font-semibold text-slate-900">AI Persona & Training</h2>
                <p className="text-xs text-slate-500">Train your AI to talk exactly like you</p>
              </div>
            </div>
            {aiStats && (
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 text-purple-700 rounded-lg font-medium">
                  <span>⚡</span> {aiStats.totalRuns.toLocaleString()} runs
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg font-medium">
                  <span>💰</span> ${aiStats.totalCostUsd.toFixed(4)}
                </div>
              </div>
            )}
          </div>
          <p className="text-sm text-slate-600 mb-5 leading-relaxed">
            Write instructions in <strong className="text-slate-800">your own voice</strong>. Describe how you actually talk to clients — 
            your tone, your go-to phrases, how you handle tough questions. The AI will mirror your personality 
            so closely that clients won&apos;t notice the difference.
          </p>

          {/* Mode explanation */}
          <div className="grid grid-cols-3 gap-3 mb-5">
            {[
              { mode: 'Auto', icon: '⚡', gradient: 'from-emerald-50 to-green-50', border: 'border-emerald-200/60', text: 'text-emerald-800', desc: 'AI replies instantly as you — clients won\'t know the difference.' },
              { mode: 'Draft', icon: '✏️', gradient: 'from-blue-50 to-indigo-50', border: 'border-blue-200/60', text: 'text-blue-800', desc: 'AI writes a draft in your voice. You review and send.' },
              { mode: 'Manual', icon: '🙋', gradient: 'from-amber-50 to-orange-50', border: 'border-amber-200/60', text: 'text-amber-800', desc: 'You\'re handling this one personally. AI stays quiet.' },
            ].map(({ mode, icon, gradient, border, text, desc }) => (
              <div key={mode} className={`rounded-xl border ${border} bg-gradient-to-br ${gradient} p-3.5`}>
                <div className={`font-semibold text-xs ${text} mb-1 flex items-center gap-1.5`}>{icon} {mode}</div>
                <div className={`text-[11px] ${text} opacity-80 leading-relaxed`}>{desc}</div>
              </div>
            ))}
          </div>

          <label className="block text-xs font-medium text-slate-700 mb-2">
            Your AI System Prompt
            {hasUnsavedChanges && (
              <span className="ml-2 text-[11px] text-amber-600 font-normal bg-amber-50 px-2 py-0.5 rounded-full">● Unsaved</span>
            )}
          </label>
          <textarea
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            rows={10}
            placeholder="Write in your own voice — describe how YOU text clients..."
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 text-sm font-mono resize-y transition-all"
          />
          <p className="text-[11px] text-slate-400 mt-1.5">
            {systemPrompt.length} characters · Be specific about your tone, common answers, and what NOT to say.
          </p>

          {/* Example prompts */}
          <details className="mt-4 text-sm">
            <summary className="cursor-pointer text-indigo-600 hover:text-indigo-700 text-xs font-medium">
              📋 Load an example prompt to get started
            </summary>
            <div className="mt-3 space-y-3">
              {EXAMPLE_PROMPTS.map((ex, i) => (
                <div key={i} className="p-4 bg-slate-50 border border-slate-200/60 rounded-xl text-xs font-mono whitespace-pre-wrap text-slate-600 leading-relaxed">
                  {ex}
                  <button
                    onClick={() => setSystemPrompt(ex)}
                    className="mt-3 block px-4 py-1.5 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-lg hover:from-indigo-700 hover:to-indigo-800 text-xs font-sans font-medium shadow-sm"
                  >
                    Use this example
                  </button>
                </div>
              ))}
            </div>
          </details>

          {promptError && <p className="mt-3 text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{promptError}</p>}

          <div className="mt-5 flex items-center gap-3">
            <button
              onClick={handleSavePersona}
              disabled={savingPrompt || !systemPrompt.trim() || !hasUnsavedChanges}
              className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-xl hover:from-indigo-700 hover:to-indigo-800 disabled:opacity-40 text-sm font-medium shadow-md shadow-indigo-500/20 transition-all"
            >
              {savingPrompt ? 'Saving…' : 'Save Persona'}
            </button>
            {promptSaved && (
              <span className="text-emerald-600 text-xs font-medium bg-emerald-50 px-3 py-1.5 rounded-lg">✓ Saved — AI will use this from now on</span>
            )}
          </div>
        </div>

        {/* ── Product & Sales Training ───────────────────────────────── */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/60">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-white text-lg shadow-md shadow-emerald-500/20">💰</div>
              <div>
                <h2 className="text-base font-semibold text-slate-900">Product &amp; Sales Training</h2>
                <p className="text-xs text-slate-500">Teach your AI about your products so it can sell for you</p>
              </div>
            </div>
          </div>
          <p className="text-sm text-slate-600 mb-5 leading-relaxed">
            List your products, services, pricing, and key selling points below.
            The AI will <strong className="text-slate-800">naturally weave this into conversations</strong> — recommending the right product
            when a client shows interest, mentioning pricing when asked, and guiding them toward a purchase without being pushy.
          </p>

          <label className="block text-xs font-medium text-slate-700 mb-2">
            Product Catalog &amp; Sales Knowledge
            {hasUnsavedSalesChanges && (
              <span className="ml-2 text-[11px] text-amber-600 font-normal bg-amber-50 px-2 py-0.5 rounded-full">● Unsaved</span>
            )}
          </label>
          <textarea
            value={salesContext}
            onChange={(e) => setSalesContext(e.target.value)}
            rows={8}
            placeholder={`Example:\n\nOUR PRODUCTS:\n1. Starter Plan — $29/mo\n   - Up to 500 messages/month\n   - WhatsApp + SMS channels\n   - Perfect for small businesses just starting out\n\n2. Pro Plan — $79/mo\n   - Unlimited messages\n   - All channels (WhatsApp, SMS, Email, Instagram, Facebook, Telegram)\n   - AI auto-replies + draft mode\n   - Best seller — most clients choose this\n\n3. Enterprise — $199/mo\n   - Everything in Pro + dedicated support\n   - Custom integrations, SLA guarantee\n\nSPECIAL OFFERS:\n- 14-day free trial on all plans\n- 20% off annual billing\n- Refer a friend, get 1 month free\n\nCOMMON OBJECTIONS:\n- "Too expensive" → Mention the free trial and the ROI (saves 20+ hours/month on manual replies)\n- "I need to think about it" → No pressure, offer to send a comparison PDF`}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-300 text-sm font-mono resize-y transition-all"
          />
          <p className="text-[11px] text-slate-400 mt-1.5">
            {salesContext.length} characters · Include products, pricing, offers, and how to handle objections.
          </p>

          {salesError && <p className="mt-3 text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{salesError}</p>}

          <div className="mt-5 flex items-center gap-3">
            <button
              onClick={handleSaveSalesContext}
              disabled={savingSales || !hasUnsavedSalesChanges}
              className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-xl hover:from-emerald-700 hover:to-green-700 disabled:opacity-40 text-sm font-medium shadow-md shadow-emerald-500/20 transition-all"
            >
              {savingSales ? 'Saving…' : 'Save Product Info'}
            </button>
            {salesSaved && (
              <span className="text-emerald-600 text-xs font-medium bg-emerald-50 px-3 py-1.5 rounded-lg">✓ Saved — AI will use this for sales</span>
            )}
          </div>
        </div>

        {/* ── Account ───────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/60">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center text-white text-lg shadow-md shadow-blue-500/20">👤</div>
            <h2 className="text-base font-semibold text-slate-900">Admin Security</h2>
          </div>
          <div className="space-y-4 pb-5 border-b border-slate-100">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Email</label>
              <input type="email" value={accountEmail} onChange={(e) => setAccountEmail(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 transition-all" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Display Name</label>
              <input type="text" value={accountName} onChange={(e) => setAccountName(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 transition-all" />
            </div>
            {accountError && <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{accountError}</p>}
            <button onClick={handleSaveAccount} disabled={savingAccount || !hasUnsavedAccountChanges}
              className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-xl hover:from-indigo-700 hover:to-indigo-800 disabled:opacity-40 text-sm font-medium shadow-md shadow-indigo-500/20 transition-all">
              {savingAccount ? 'Saving…' : 'Save Account Changes'}
            </button>
            {accountSaved && <span className="text-emerald-600 text-xs font-medium bg-emerald-50 px-3 py-1.5 rounded-lg">✓ Account updated</span>}
          </div>

          <div className="space-y-4 pt-5">
            <h3 className="text-sm font-semibold text-slate-800">Change Password</h3>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Current Password</label>
              <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 transition-all" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">New Password</label>
              <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 transition-all" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Confirm New Password</label>
              <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 transition-all" />
            </div>
            {passwordError && <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{passwordError}</p>}
            <button onClick={handleChangePassword} disabled={savingPassword || !currentPassword || !newPassword || !confirmPassword}
              className="px-5 py-2.5 bg-gradient-to-r from-slate-800 to-slate-900 text-white rounded-xl hover:from-slate-900 hover:to-black disabled:opacity-40 text-sm font-medium shadow-md transition-all">
              {savingPassword ? 'Updating…' : 'Update Password'}
            </button>
            {passwordSaved && <span className="text-emerald-600 text-xs font-medium bg-emerald-50 px-3 py-1.5 rounded-lg">✓ Password changed successfully</span>}
          </div>
        </div>

        {/* ── API Keys ──────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/60">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white text-lg shadow-md shadow-amber-500/20">🔑</div>
            <h2 className="text-base font-semibold text-slate-900">API Keys</h2>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">API Key</label>
            <div className="flex gap-2">
              <input type="text" disabled value={apiKey}
                className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-sm text-slate-500" />
              <button onClick={handleCopyApiKey}
                className="px-4 py-2.5 border border-slate-200 rounded-xl hover:bg-slate-50 text-sm font-medium text-slate-700 transition-colors">
                {copied ? '✓ Copied' : 'Copy'}
              </button>
            </div>
            <p className="text-[11px] text-slate-400 mt-2">Use this key for n8n workflow authentication</p>
          </div>
        </div>

        {/* ── Integrations ──────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/60">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-lg shadow-md shadow-emerald-500/20">🔗</div>
            <h2 className="text-base font-semibold text-slate-900">Integrations</h2>
          </div>
          <div className="space-y-2">
            {[
              { name: 'Stripe', icon: '💳' },
              { name: 'Paystack', icon: '🏦' },
              { name: 'n8n', icon: '⚙️' },
              { name: 'OpenAI', icon: '🤖' },
              { name: 'WhatsApp (Meta)', icon: '💬' },
              { name: "Africa's Talking (SMS)", icon: '📱' },
            ].map(({ name, icon }) => (
              <div key={name} className="flex items-center justify-between p-3.5 bg-slate-50/50 border border-slate-100 rounded-xl hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="text-lg">{icon}</span>
                  <div>
                    <p className="font-medium text-slate-800 text-sm">{name}</p>
                    <p className="text-[11px] text-slate-400">Configure via environment variables</p>
                  </div>
                </div>
                <span className="text-[11px] text-slate-400 bg-white border border-slate-200 px-2.5 py-1 rounded-lg font-medium">Via .env</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Danger Zone ───────────────────────────────────────────── */}
        <div className="bg-gradient-to-br from-red-50 to-rose-50 rounded-2xl p-6 border border-red-200/60">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center text-white text-lg shadow-md shadow-red-500/20">⚠️</div>
            <div>
              <h2 className="text-base font-semibold text-red-900">Danger Zone</h2>
              <p className="text-red-600/70 text-xs">These actions cannot be undone</p>
            </div>
          </div>
          <button
            onClick={() => { localStorage.removeItem('token'); window.location.href = '/login'; }}
            className="px-5 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 text-sm font-medium shadow-md shadow-red-500/20 transition-all"
          >
            Logout
          </button>
        </div>
      </div>
    </Layout>
  );
}
