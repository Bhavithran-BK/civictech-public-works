'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import {
  Building2,
  Lock,
  Mail,
  ArrowRight,
  ShieldAlert,
  Loader2,
  KeyRound,
} from 'lucide-react';

export default function DeptLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('officer.roads@cityworks.gov');
  const [password, setPassword] = useState('CityWorks2026!');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await api.login(email, password);
      if (res && res.access_token) {
        router.push('/dept/dashboard');
      } else {
        setError('Invalid credentials. Please verify your municipal officer credentials.');
      }
    } catch (err: any) {
      setError(err?.message || 'Login failed. Please verify API connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Brand Header */}
        <div className="flex justify-center mb-3">
          <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center font-black text-white text-2xl shadow-lg shadow-blue-500/20">
            DO
          </div>
        </div>
        <h1 className="text-center text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
          DigOnce Officer Portal
        </h1>
        <p className="mt-2 text-center text-xs sm:text-sm text-slate-400 max-w-sm mx-auto">
          Municipal Department & Inter-Agency Coordination System
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-slate-900 border border-slate-800 py-8 px-6 shadow-xl rounded-2xl sm:px-10">
          <form className="space-y-5" onSubmit={handleSubmit}>
            {error && (
              <div className="p-3 bg-rose-950/60 border border-rose-800 text-rose-200 text-xs rounded-lg flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label
                htmlFor="email"
                className="block text-xs font-semibold text-slate-300 mb-1"
              >
                Official Department Email
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="officer@department.gov"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs font-semibold text-slate-300 mb-1"
              >
                Password
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="••••••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-blue-500 transition-all disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign into Department Portal</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Credentials Banner */}
          <div className="mt-6 pt-5 border-t border-slate-800">
            <div className="bg-slate-950/80 rounded-lg p-3 border border-slate-800">
              <div className="flex items-center gap-2 text-xs font-semibold text-blue-400 mb-1">
                <KeyRound className="w-3.5 h-3.5" />
                <span>Demo Judge Credentials</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Email: <span className="text-slate-200 font-mono">officer.roads@cityworks.gov</span>
              </p>
              <p className="text-[11px] text-slate-400">
                Password: <span className="text-slate-200 font-mono">CityWorks2026!</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
