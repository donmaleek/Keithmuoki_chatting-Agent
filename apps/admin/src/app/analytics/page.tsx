'use client';

import Layout from '@/components/Layout';

export default function AnalyticsPage() {
  const stats = [
    { label: 'Total Conversations', value: '1,284', change: '+12%', changeLabel: 'this month', icon: '💬', gradient: 'from-indigo-500 to-blue-600', shadow: 'shadow-indigo-500/20' },
    { label: 'Avg Response Time', value: '2.4h', change: '-0.5h', changeLabel: 'vs last month', icon: '⚡', gradient: 'from-emerald-500 to-teal-600', shadow: 'shadow-emerald-500/20' },
    { label: 'AI Reply Rate', value: '68%', change: '+5%', changeLabel: 'confidence', icon: '🤖', gradient: 'from-purple-500 to-violet-600', shadow: 'shadow-purple-500/20' },
    { label: 'Satisfaction', value: '4.7/5', change: '234', changeLabel: 'ratings', icon: '⭐', gradient: 'from-amber-500 to-orange-600', shadow: 'shadow-amber-500/20' },
  ];

  const channels = [
    { name: 'WhatsApp', value: 542, percent: 42, color: 'bg-emerald-500' },
    { name: 'SMS', value: 328, percent: 26, color: 'bg-blue-500' },
    { name: 'Email', value: 245, percent: 19, color: 'bg-purple-500' },
    { name: 'Web Chat', value: 169, percent: 13, color: 'bg-amber-500' },
  ];

  const recentActivity = [
    { time: '2 min ago', action: 'AI replied to WhatsApp message', client: 'Sarah K.', type: 'ai' },
    { time: '8 min ago', action: 'Payment link sent', client: 'James M.', type: 'payment' },
    { time: '15 min ago', action: 'Manual reply sent', client: 'Aisha N.', type: 'manual' },
    { time: '23 min ago', action: 'New conversation started', client: 'Peter O.', type: 'new' },
    { time: '1h ago', action: 'AI draft approved', client: 'Grace W.', type: 'ai' },
  ];

  return (
    <Layout>
      <div className="p-6 lg:p-8 space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Analytics</h1>
          <p className="text-slate-500 text-sm mt-1">Your messaging metrics and performance</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <div key={stat.label} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/60 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center text-white text-lg shadow-md ${stat.shadow}`}>
                  {stat.icon}
                </div>
                <span className="text-xs text-emerald-600 font-medium bg-emerald-50 px-2 py-1 rounded-lg">{stat.change}</span>
              </div>
              <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
              <p className="text-xs text-slate-400 mt-0.5">{stat.label} · {stat.changeLabel}</p>
            </div>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Channel Breakdown */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/60">
            <h3 className="font-semibold text-slate-900 text-sm mb-5">Messages by Channel</h3>
            <div className="space-y-4">
              {channels.map((ch) => (
                <div key={ch.name}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm text-slate-700 font-medium">{ch.name}</span>
                    <span className="text-xs text-slate-400">{ch.value} ({ch.percent}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div
                      className={`${ch.color} h-2 rounded-full transition-all`}
                      style={{ width: `${ch.percent}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-5 pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Total messages</span>
                <span className="font-semibold text-slate-700">1,284</span>
              </div>
            </div>
          </div>

          {/* Response Performance */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/60">
            <h3 className="font-semibold text-slate-900 text-sm mb-5">Response Performance</h3>
            <div className="space-y-4">
              {[
                { label: 'AI Auto-replies', value: '872', sub: '68% of total', bar: 68, color: 'bg-gradient-to-r from-purple-500 to-violet-500' },
                { label: 'AI Drafts Used', value: '198', sub: '15% of total', bar: 15, color: 'bg-gradient-to-r from-blue-500 to-indigo-500' },
                { label: 'Manual Replies', value: '214', sub: '17% of total', bar: 17, color: 'bg-gradient-to-r from-amber-500 to-orange-500' },
              ].map((item) => (
                <div key={item.label}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm text-slate-700 font-medium">{item.label}</span>
                    <div className="text-right">
                      <span className="text-sm font-semibold text-slate-800">{item.value}</span>
                      <span className="text-xs text-slate-400 ml-1.5">{item.sub}</span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div
                      className={`${item.color} h-2 rounded-full`}
                      style={{ width: `${item.bar}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-5 pt-4 border-t border-slate-100 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-xs text-slate-500">AI handling <strong className="text-slate-700">83%</strong> of all conversations</span>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/60">
          <h3 className="font-semibold text-slate-900 text-sm mb-4">Recent Activity</h3>
          <div className="space-y-1">
            {recentActivity.map((item, i) => (
              <div key={i} className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${
                  item.type === 'ai' ? 'bg-purple-50 text-purple-600' :
                  item.type === 'payment' ? 'bg-emerald-50 text-emerald-600' :
                  item.type === 'manual' ? 'bg-blue-50 text-blue-600' :
                  'bg-amber-50 text-amber-600'
                }`}>
                  {item.type === 'ai' ? '🤖' : item.type === 'payment' ? '💰' : item.type === 'manual' ? '✍️' : '🆕'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-800 font-medium truncate">{item.action}</p>
                  <p className="text-xs text-slate-400">{item.client}</p>
                </div>
                <span className="text-[11px] text-slate-400 whitespace-nowrap">{item.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
