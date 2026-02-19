import { useState, useEffect } from 'react';

interface ClientProfileProps {
  clientId: string;
}

interface ClientData {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  createdAt?: string;
}

const AVATAR_GRADIENTS = [
  'from-indigo-500 to-violet-500',
  'from-rose-500 to-pink-500',
  'from-emerald-500 to-teal-500',
  'from-amber-500 to-orange-500',
  'from-cyan-500 to-blue-500',
];

function getGradient(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_GRADIENTS[Math.abs(hash) % AVATAR_GRADIENTS.length];
}

function getInitials(name: string): string {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

export function ClientProfile({ clientId }: ClientProfileProps) {
  const [client, setClient] = useState<ClientData | null>(null);

  useEffect(() => {
    setClient({
      id: clientId,
      name: 'Client',
      email: 'client@example.com',
      phone: '+1 (234) 567-890',
      createdAt: new Date().toISOString()
    });
  }, [clientId]);

  if (!client) return null;

  const name = client.name || `Client ${clientId.slice(0, 6)}`;
  const initials = getInitials(name);
  const gradient = getGradient(clientId);

  return (
    <div className="flex flex-col h-full animate-fade-in">
      {/* Header */}
      <div className="p-6 border-b border-slate-100">
        <div className="flex flex-col items-center">
          <div className="relative">
            <div className={`w-18 h-18 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white text-xl font-bold shadow-xl`} style={{width:'72px',height:'72px'}}>
              {initials}
            </div>
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center">
              <span className="w-2 h-2 rounded-full bg-white animate-pulse-dot" />
            </div>
          </div>
          <h3 className="font-bold text-slate-900 mt-3.5 text-sm">{name}</h3>
          <p className="text-[11px] text-slate-400 mt-0.5 font-mono bg-slate-50 px-2 py-0.5 rounded-md">{clientId.slice(0, 12)}\u2026</p>
        </div>
      </div>

      {/* Details */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        {/* Contact */}
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm1.294 6.336a6.721 6.721 0 01-3.17.789 6.721 6.721 0 01-3.168-.789 3.376 3.376 0 016.338 0z" /></svg>
            Contact
          </p>
          <div className="space-y-2">
            {client.email && (
              <div className="flex items-center gap-2.5 p-2.5 bg-slate-50/80 rounded-xl border border-slate-100 hover:bg-slate-50 transition-all group">
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                  <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" /></svg>
                </div>
                <span className="text-xs text-slate-700 truncate font-medium">{client.email}</span>
              </div>
            )}
            {client.phone && (
              <div className="flex items-center gap-2.5 p-2.5 bg-slate-50/80 rounded-xl border border-slate-100 hover:bg-slate-50 transition-all group">
                <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center group-hover:bg-green-100 transition-colors">
                  <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" /></svg>
                </div>
                <span className="text-xs text-slate-700 font-medium">{client.phone}</span>
              </div>
            )}
          </div>
        </div>

        {/* Tags */}
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" /><path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" /></svg>
            Tags
          </p>
          <div className="flex flex-wrap gap-1.5">
            {['Customer', 'Active'].map((tag) => (
              <span
                key={tag}
                className="px-2.5 py-1 bg-gradient-to-r from-slate-50 to-slate-100 text-slate-600 rounded-lg text-[11px] font-semibold border border-slate-200/60 hover:border-indigo-200/60 hover:text-indigo-600 cursor-default transition-all"
              >
                {tag}
              </span>
            ))}
            <button className="px-2.5 py-1 bg-slate-50 text-slate-400 rounded-lg text-[11px] font-semibold border border-dashed border-slate-300 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50 transition-all">
              + Add
            </button>
          </div>
        </div>

        {/* Activity */}
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            Activity
          </p>
          <div className="space-y-2.5">
            <div className="flex items-center justify-between p-2.5 bg-slate-50/80 rounded-xl border border-slate-100">
              <span className="text-xs text-slate-500">First contact</span>
              <span className="text-xs text-slate-700 font-semibold">
                {client.createdAt ? new Date(client.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '\u2014'}
              </span>
            </div>
            <div className="flex items-center justify-between p-2.5 bg-slate-50/80 rounded-xl border border-slate-100">
              <span className="text-xs text-slate-500">Status</span>
              <span className="inline-flex items-center gap-1.5 text-xs text-emerald-600 font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.4)] animate-pulse-dot" />
                Active
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" /></svg>
            Actions
          </p>
          <div className="space-y-1.5">
            {[
              { icon: 'M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z', label: 'View full history' },
              { icon: 'M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z', label: 'Add tag' },
              { icon: 'M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10', label: 'Add note' },
            ].map(({ icon, label }) => (
              <button key={label} className="w-full px-3 py-2.5 text-xs text-slate-600 border border-slate-200/60 rounded-xl hover:bg-indigo-50/50 hover:text-indigo-600 hover:border-indigo-200/60 font-medium text-left flex items-center gap-2.5 transition-all group">
                <svg className="w-4 h-4 text-slate-400 group-hover:text-indigo-500 transition-colors" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d={icon} /></svg>
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
