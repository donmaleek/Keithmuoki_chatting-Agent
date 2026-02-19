'use client';

import { ReactNode, useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api';

interface LayoutProps {
  children: ReactNode;
}

const ALL_NAV_ITEMS = [
  { href: '/dashboard', icon: '🏆', label: 'Dashboard', roles: ['admin'] },
  { href: '/inbox', icon: '💬', label: 'Inbox', roles: ['admin', 'agent'] },
  { href: '/companies', icon: '🏢', label: 'Companies', roles: ['admin', 'agent'] },
  { href: '/team', icon: '👥', label: 'Team', roles: ['admin'] },
  { href: '/analytics', icon: '📊', label: 'Analytics', roles: ['admin'] },
  { href: '/settings', icon: '⚙️', label: 'Settings', roles: ['admin', 'agent'] },
];

export default function Layout({ children }: LayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>('');

  useEffect(() => {
    apiClient
      .get<{ role: string; name: string }>('/auth/me')
      .then((u) => {
        setUserRole(u.role);
        setUserName(u.name);
      })
      .catch(() => {
        router.push('/login');
      });
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/login');
  };

  const navItems = ALL_NAV_ITEMS.filter(
    (item) => !userRole || item.roles.includes(userRole),
  );

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar — sleek dark */}
      <aside className="hidden w-[72px] bg-slate-900 md:flex flex-col items-center py-6 gap-1">
        {/* Logo */}
        <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-lg mb-8 shadow-lg shadow-indigo-500/30">
          KM
        </div>

        {/* Nav Items */}
        <nav className="flex-1 flex flex-col items-center gap-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
            return (
              <a
                key={item.href}
                href={item.href}
                title={item.label}
                className={`w-11 h-11 rounded-xl flex items-center justify-center text-lg transition-all ${
                  isActive
                    ? 'bg-indigo-600 shadow-lg shadow-indigo-500/30'
                    : 'hover:bg-slate-800 text-slate-400'
                }`}
              >
                {item.icon}
              </a>
            );
          })}
        </nav>

        {/* Bottom — User + Logout */}
        <div className="flex flex-col items-center gap-2">
          {userName && (
            <div className="w-9 h-9 rounded-lg bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-300" title={userName}>
              {userName.charAt(0).toUpperCase()}
            </div>
          )}
          <button
            onClick={handleLogout}
            title="Logout"
            className="w-11 h-11 rounded-xl flex items-center justify-center text-lg text-slate-500 hover:bg-slate-800 hover:text-slate-300 transition-all"
          >
            🚪
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-hidden flex flex-col">
        {children}
      </main>
    </div>
  );
}
