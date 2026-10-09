'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import {
  LayoutDashboard,
  PlusCircle,
  LogOut,
  MapPin,
  Building2,
  ShieldCheck,
} from 'lucide-react';

export const DeptNav: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const user = api.getCurrentUser();

  const handleLogout = () => {
    api.logout();
    router.push('/dept/login');
  };

  const navLinks = [
    {
      name: 'Authority Dashboard',
      href: '/dept/dashboard',
      icon: LayoutDashboard,
    },
    {
      name: 'Schedule New Project',
      href: '/dept/projects/new',
      icon: PlusCircle,
    },
  ];

  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <Link href="/dept/dashboard" className="flex items-center gap-2 group">
              <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center font-black text-white text-lg tracking-wider group-hover:bg-blue-500 transition-colors shadow-sm">
                DO
              </div>
              <div>
                <span className="font-extrabold text-base tracking-tight text-white flex items-center gap-1.5">
                  DigOnce
                  <span className="text-[10px] font-semibold bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded border border-blue-400/30">
                    Dept Portal
                  </span>
                </span>
                <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
                  Civic Works Coordination & Conflict Detection
                </p>
              </div>
            </Link>
          </div>

          {/* Navigation Items */}
          <nav className="flex items-center gap-1 sm:gap-2">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden xs:inline">{link.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* User Status & Logout */}
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="hidden md:flex flex-col text-right">
              <span className="text-xs font-semibold text-slate-200 flex items-center gap-1 justify-end">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                {user?.full_name || 'Officer Rajesh (GCC)'}
              </span>
              <span className="text-[10px] text-slate-400">
                {user?.department_name || 'GCC - Roads & Bridges'}
              </span>
            </div>

            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs text-slate-400 hover:text-rose-300 hover:bg-rose-950/40 rounded-lg transition-colors border border-slate-700 hover:border-rose-900"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
