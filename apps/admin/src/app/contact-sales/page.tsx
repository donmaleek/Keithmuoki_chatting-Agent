'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

export default function ContactSalesPage() {
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    companyName: '',
    phone: '',
    teamSize: '',
    monthlyVolume: '',
    useCase: '',
    planInterest: 'Growth',
    budgetRange: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const queryPlan = new URLSearchParams(window.location.search).get('plan');
    if (queryPlan) {
      setForm((prev) => ({ ...prev, planInterest: queryPlan }));
    }
  }, []);

  const update = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSuccess(null);
    setError(null);

    try {
      const response = await fetch(`${BACKEND_URL}/growth/inquiries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          teamSize: form.teamSize ? Number(form.teamSize) : undefined,
          monthlyVolume: form.monthlyVolume ? Number(form.monthlyVolume) : undefined,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to submit inquiry');
      }

      setSuccess('Inquiry submitted. Our team will contact you within 24 hours.');
      setForm((prev) => ({
        ...prev,
        fullName: '',
        email: '',
        companyName: '',
        phone: '',
        teamSize: '',
        monthlyVolume: '',
        useCase: '',
        budgetRange: '',
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white px-6 py-10 relative overflow-hidden">
      <div className="absolute -top-24 left-0 w-72 h-72 rounded-full bg-indigo-600/25 blur-3xl" />
      <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full bg-cyan-500/20 blur-3xl" />

      <div className="relative z-10 max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <Link href="/pricing" className="text-sm text-slate-300 hover:text-white transition-all">← Back to pricing</Link>
          <Link href="/" className="text-sm text-slate-300 hover:text-white transition-all">Home</Link>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-md p-7">
          <p className="text-xs uppercase tracking-[0.2em] text-indigo-300">Contact Sales</p>
          <h1 className="text-3xl font-bold mt-2">Let’s launch your team on Keith Muoki’s Agent</h1>
          <p className="text-slate-300 mt-2 text-sm">Tell us your goals and we’ll tailor setup, onboarding, and pricing for your business.</p>

          <form onSubmit={handleSubmit} className="mt-6 grid sm:grid-cols-2 gap-4">
            <input value={form.fullName} onChange={(e) => update('fullName', e.target.value)} required placeholder="Full name" className="px-4 py-2.5 rounded-xl bg-slate-900/60 border border-white/10 focus:border-indigo-300 focus:outline-none" />
            <input type="email" value={form.email} onChange={(e) => update('email', e.target.value)} required placeholder="Work email" className="px-4 py-2.5 rounded-xl bg-slate-900/60 border border-white/10 focus:border-indigo-300 focus:outline-none" />
            <input value={form.companyName} onChange={(e) => update('companyName', e.target.value)} required placeholder="Company name" className="px-4 py-2.5 rounded-xl bg-slate-900/60 border border-white/10 focus:border-indigo-300 focus:outline-none" />
            <input value={form.phone} onChange={(e) => update('phone', e.target.value)} placeholder="Phone (optional)" className="px-4 py-2.5 rounded-xl bg-slate-900/60 border border-white/10 focus:border-indigo-300 focus:outline-none" />

            <input type="number" min={1} value={form.teamSize} onChange={(e) => update('teamSize', e.target.value)} placeholder="Team size" className="px-4 py-2.5 rounded-xl bg-slate-900/60 border border-white/10 focus:border-indigo-300 focus:outline-none" />
            <input type="number" min={1} value={form.monthlyVolume} onChange={(e) => update('monthlyVolume', e.target.value)} placeholder="Monthly conversation volume" className="px-4 py-2.5 rounded-xl bg-slate-900/60 border border-white/10 focus:border-indigo-300 focus:outline-none" />

            <select value={form.planInterest} onChange={(e) => update('planInterest', e.target.value)} className="px-4 py-2.5 rounded-xl bg-slate-900/60 border border-white/10 focus:border-indigo-300 focus:outline-none">
              <option>Starter</option>
              <option>Growth</option>
              <option>Scale</option>
            </select>
            <input value={form.budgetRange} onChange={(e) => update('budgetRange', e.target.value)} placeholder="Budget range (optional)" className="px-4 py-2.5 rounded-xl bg-slate-900/60 border border-white/10 focus:border-indigo-300 focus:outline-none" />

            <textarea value={form.useCase} onChange={(e) => update('useCase', e.target.value)} required placeholder="Tell us your use case and goals" className="sm:col-span-2 px-4 py-3 rounded-xl bg-slate-900/60 border border-white/10 focus:border-indigo-300 focus:outline-none min-h-[120px]" />

            {error && <p className="sm:col-span-2 text-sm text-rose-300">{error}</p>}
            {success && <p className="sm:col-span-2 text-sm text-emerald-300">{success}</p>}

            <button type="submit" disabled={submitting} className="sm:col-span-2 mt-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 font-medium hover:opacity-95 disabled:opacity-50 transition-all">
              {submitting ? 'Submitting…' : 'Request demo & pricing call'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
