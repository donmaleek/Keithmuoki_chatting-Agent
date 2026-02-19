'use client';

import Link from 'next/link';

const PLANS = [
  {
    name: 'Starter',
    price: '$49',
    period: '/month',
    ideal: 'Solo operators and early-stage teams',
    features: ['2 agents', '1,000 conversations/mo', 'AI draft mode', 'Basic analytics'],
    accent: 'from-slate-700 to-slate-900',
  },
  {
    name: 'Growth',
    price: '$149',
    period: '/month',
    ideal: 'Growing teams closing customer conversations daily',
    features: ['10 agents', '10,000 conversations/mo', 'Auto + draft + manual AI', 'Team leaderboard + bonuses'],
    accent: 'from-indigo-500 to-violet-600',
    featured: true,
  },
  {
    name: 'Scale',
    price: 'Custom',
    period: '',
    ideal: 'Large businesses with multi-brand service operations',
    features: ['Unlimited agents', 'Priority support', 'Custom SLAs', 'Dedicated onboarding'],
    accent: 'from-emerald-500 to-teal-600',
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white px-6 py-10 relative overflow-hidden">
      <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-indigo-600/30 blur-3xl" />
      <div className="absolute -bottom-24 right-0 w-80 h-80 rounded-full bg-violet-600/20 blur-3xl" />

      <div className="relative z-10 max-w-6xl mx-auto">
        <div className="flex items-center justify-between gap-3 mb-10">
          <Link href="/" className="text-sm text-slate-300 hover:text-white transition-all">← Back to home</Link>
          <Link href="/login" className="px-4 py-2 rounded-xl bg-white/10 text-sm hover:bg-white/20 transition-all">Sign In</Link>
        </div>

        <div className="text-center max-w-2xl mx-auto mb-10">
          <p className="text-xs uppercase tracking-[0.2em] text-indigo-300">Pricing</p>
          <h1 className="text-4xl font-bold mt-3">Choose the right plan for your team</h1>
          <p className="text-slate-300 mt-3">Keith Muoki’s Agent helps teams respond faster, close more deals, and scale support with confidence.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-3xl border ${plan.featured ? 'border-indigo-300/50 ring-2 ring-indigo-300/30' : 'border-white/10'} bg-white/5 p-6 backdrop-blur-sm shadow-2xl shadow-black/20`}
            >
              <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${plan.accent} mb-4`} />
              <p className="text-lg font-semibold">{plan.name}</p>
              <p className="mt-2 text-3xl font-bold">{plan.price}<span className="text-base text-slate-300">{plan.period}</span></p>
              <p className="text-sm text-slate-300 mt-2">{plan.ideal}</p>
              <ul className="mt-5 space-y-2 text-sm text-slate-200">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2">
                    <span className="text-emerald-300">✓</span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <Link
                href={`/contact-sales?plan=${encodeURIComponent(plan.name)}`}
                className="mt-6 inline-flex w-full items-center justify-center rounded-xl px-4 py-2.5 bg-white/10 hover:bg-white/20 font-medium text-sm transition-all"
              >
                {plan.name === 'Scale' ? 'Talk to sales' : 'Get started'}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
