'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import {
  LayoutDashboard,
  PlusCircle,
  LogOut,
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
    <header className="bg-white text-gray-800 border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <Link href="/dept/dashboard" className="flex items-center gap-2 group">
              <div className="w-9 h-9 rounded bg-blue-700 flex items-center justify-center font-bold text-white text-lg tracking-wider">
                DO
              </div>
              <div>
                <span className="font-bold text-base tracking-tight text-gray-900 flex items-center gap-1.5">
                  DigOnce
                  <span className="text-[10px] font-semibold bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded border border-gray-200">
                    Dept Portal
                  </span>
                </span>
                <p className="text-[11px] text-gray-500 font-medium hidden sm:block">
                  Civic Works Coordination
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
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
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
              <span className="text-xs font-semibold text-gray-800 flex items-center gap-1 justify-end">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                {user?.full_name || 'Officer Rajesh (GCC)'}
              </span>
              <span className="text-[10px] text-gray-500">
                {user?.department_name || 'GCC - Roads & Bridges'}
              </span>
            </div>

            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors border border-gray-200"
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
