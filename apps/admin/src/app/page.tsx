'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    apiClient
      .get<{ role: string }>('/auth/me')
      .then((user) => {
        if (user.role === 'admin') {
          router.replace('/dashboard');
        } else {
          router.replace('/inbox');
        }
      })
      .catch(() => {
        localStorage.removeItem('token');
      });
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-hidden relative">
      <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-indigo-600/30 blur-3xl" />
      <div className="absolute -bottom-40 -right-40 w-[28rem] h-[28rem] rounded-full bg-fuchsia-500/20 blur-3xl" />
      <div className="absolute inset-0 opacity-[0.18] [background-image:radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] [background-size:20px_20px]" />

      <header className="relative z-10 max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center font-bold text-sm shadow-lg shadow-indigo-500/30">
            KM
          </div>
          <p className="font-semibold tracking-tight">Keith Muoki’s Agent</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/pricing" className="px-4 py-2 text-sm rounded-xl bg-white/10 hover:bg-white/20 transition-all hover:scale-[1.02]">
            Pricing
          </Link>
          <Link href="/login" className="px-4 py-2 text-sm rounded-xl bg-white/10 hover:bg-white/20 transition-all hover:scale-[1.02]">
            Sign In
          </Link>
          <Link href="/register" className="px-4 py-2 text-sm rounded-xl bg-indigo-500 hover:bg-indigo-400 transition-all hover:scale-[1.02] shadow-lg shadow-indigo-500/30">
            Agent Register
          </Link>
        </div>
      </header>

      <main className="relative z-10 max-w-6xl mx-auto px-6 pt-14 pb-20 grid lg:grid-cols-2 gap-12 items-center">
        <div>
          <p className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-indigo-300 mb-5">
            ✨ Modern Multi-Agent Workspace
          </p>
          <h1 className="text-4xl lg:text-6xl font-bold leading-tight tracking-tight drop-shadow-[0_8px_28px_rgba(79,70,229,0.35)]">
            Keith Muoki’s Agent
            <span className="block text-indigo-300">Built for elite sales teams.</span>
          </h1>
          <p className="mt-6 text-slate-300 text-base lg:text-lg max-w-xl">
            A premium AI-powered inbox where agents collaborate, claim chats, switch AI modes, and close deals faster with measurable performance and bonuses.
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-2 text-xs text-slate-300">
            <span className="px-2.5 py-1 rounded-full bg-white/10 border border-white/15">Live Leaderboards</span>
            <span className="px-2.5 py-1 rounded-full bg-white/10 border border-white/15">AI Draft + Manual Modes</span>
            <span className="px-2.5 py-1 rounded-full bg-white/10 border border-white/15">Performance Bonuses</span>
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/register" className="px-6 py-3 rounded-2xl bg-gradient-to-r from-indigo-500 to-violet-600 font-medium shadow-xl shadow-indigo-500/30 hover:opacity-95 hover:scale-[1.02] transition-all">
              Register as Agent
            </Link>
            <Link href="/contact-sales?plan=Growth" className="px-6 py-3 rounded-2xl border border-indigo-300/40 bg-indigo-500/10 font-medium hover:bg-indigo-500/20 hover:scale-[1.02] transition-all">
              Book Demo
            </Link>
            <Link href="/login" className="px-6 py-3 rounded-2xl border border-white/20 bg-white/5 font-medium hover:bg-white/10 hover:scale-[1.02] transition-all">
              Open Dashboard
            </Link>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 lg:p-8 shadow-2xl shadow-black/30 ring-1 ring-indigo-300/10">
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Real-time Inbox', value: '24/7' },
              { label: 'AI Assist Modes', value: '3' },
              { label: 'Team Leaderboard', value: 'Live' },
              { label: 'Bonus Tracking', value: 'Auto' }
            ].map((item) => (
              <div key={item.label} className="rounded-2xl bg-slate-900/70 border border-white/10 p-4 hover:border-indigo-300/30 transition-all">
                <p className="text-2xl font-semibold text-indigo-300">{item.value}</p>
                <p className="text-xs text-slate-300 mt-1">{item.label}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-2xl p-4 bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 border border-emerald-300/20">
            <p className="text-sm text-emerald-200">&quot;Claim chat → close deal → earn bonus&quot; workflow is built in.</p>
          </div>
        </div>
      </main>

      <section className="relative z-10 max-w-6xl mx-auto px-6 pb-16">
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-5 flex flex-wrap gap-3 items-center justify-between">
          <p className="text-sm text-slate-300">Trusted by growth teams to close more deals with less response time.</p>
          <div className="flex flex-wrap gap-2">
            {['Fast support', 'Higher conversion', 'Unified channels', 'Enterprise ready'].map((item) => (
              <span key={item} className="text-xs px-3 py-1 rounded-full bg-white/10 border border-white/10 text-slate-200">
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="relative z-10 max-w-6xl mx-auto px-6 pb-16">
        <div className="mb-6">
          <p className="text-xs uppercase tracking-[0.2em] text-indigo-300">Why teams switch</p>
          <h2 className="text-2xl md:text-3xl font-bold mt-2">Everything needed to run a world-class sales desk</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {[
            { icon: '🧠', title: 'AI + Human Harmony', desc: 'Auto, draft, and manual modes in one seamless workflow.' },
            { icon: '⚡', title: 'Lightning Response', desc: 'Faster replies with smart suggestions and reusable snippets.' },
            { icon: '🏆', title: 'Performance League', desc: 'Leaderboard, response metrics, and bonus tracking built in.' },
            { icon: '👥', title: 'Team Assignment', desc: 'Claim chats, assign ownership, and keep accountability clear.' },
            { icon: '🔔', title: 'Real-time Updates', desc: 'Live inbox updates so no customer message is missed.' },
            { icon: '🔒', title: 'Role-based Access', desc: 'Admin and agent views tailored to responsibilities.' }
          ].map((f) => (
            <div key={f.title} className="rounded-2xl p-5 bg-white/5 border border-white/10 hover:border-indigo-300/40 hover:bg-white/10 transition-all">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/30 to-violet-500/30 border border-indigo-300/30 flex items-center justify-center text-lg mb-3">
                {f.icon}
              </div>
              <h3 className="font-semibold text-white">{f.title}</h3>
              <p className="text-sm text-slate-300 mt-1">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="relative z-10 max-w-6xl mx-auto px-6 pb-16">
        <div className="rounded-3xl p-6 md:p-8 bg-gradient-to-r from-indigo-600/20 to-violet-600/20 border border-indigo-300/20">
          <p className="text-xs uppercase tracking-[0.2em] text-indigo-200">How it works</p>
          <div className="grid md:grid-cols-3 gap-4 mt-4">
            {[
              { step: '01', title: 'Ingest all channels', text: 'WhatsApp, SMS, email and socials flow into one premium inbox.' },
              { step: '02', title: 'Assist every agent', text: 'AI suggests polished responses while agents keep final control.' },
              { step: '03', title: 'Measure and optimize', text: 'Track response quality, closures, and bonuses in real time.' }
            ].map((s) => (
              <div key={s.step} className="rounded-2xl bg-slate-900/40 border border-white/10 p-4">
                <p className="text-xs text-indigo-300 font-semibold">Step {s.step}</p>
                <p className="text-lg font-semibold mt-1">{s.title}</p>
                <p className="text-sm text-slate-300 mt-1">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative z-10 max-w-6xl mx-auto px-6 pb-24">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 md:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-5">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-indigo-300">Ready to lead?</p>
            <h3 className="text-2xl font-bold mt-2">Make Keith Muoki’s Agent your team’s command center.</h3>
            <p className="text-slate-300 mt-1">Onboard agents, close faster, and deliver a premium customer experience.</p>
          </div>
          <div className="flex gap-3">
            <Link href="/contact-sales?plan=Growth" className="px-5 py-3 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-sm font-medium transition-all">
              Start Selling Smarter
            </Link>
            <Link href="/pricing" className="px-5 py-3 rounded-xl border border-white/20 bg-white/5 text-sm font-medium hover:bg-white/10 transition-all">
              View Plans
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
