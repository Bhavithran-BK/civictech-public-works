'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import {
  Lock,
  Mail,
  ArrowRight,
  ShieldAlert,
  Loader2,
  KeyRound,
} from 'lucide-react';

export default function DeptLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Brand Header */}
        <div className="flex justify-center mb-3">
          <div className="w-12 h-12 rounded bg-blue-700 flex items-center justify-center font-bold text-white text-2xl shadow">
            DO
          </div>
        </div>
        <h1 className="text-center text-2xl sm:text-3xl font-bold text-gray-900">
          DigOnce Officer Portal
        </h1>
        <p className="mt-2 text-center text-sm text-gray-600 max-w-sm mx-auto">
          Municipal Department & Inter-Agency Coordination System
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white border border-gray-200 py-8 px-6 shadow-sm rounded sm:px-10">
          <form className="space-y-5" onSubmit={handleSubmit}>
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label
                htmlFor="email"
                className="block text-xs font-semibold text-gray-700 mb-1"
              >
                Official Department Email
              </label>
              <div className="relative rounded shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
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
                  className="block w-full pl-9 pr-3 py-2 border border-gray-300 rounded text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 transition-all"
                  placeholder="officer@department.gov"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs font-semibold text-gray-700 mb-1"
              >
                Password
              </label>
              <div className="relative rounded shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
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
                  className="block w-full pl-9 pr-3 py-2 border border-gray-300 rounded text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 transition-all"
                  placeholder="••••••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center gap-2 py-2 px-4 border border-transparent rounded shadow-sm text-sm font-medium text-white bg-blue-700 hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 transition-all disabled:opacity-50"
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

          {/* Municipal Directory Quick Fill for Testing */}
          <div className="mt-6 pt-5 border-t border-gray-200 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-gray-700">
              <KeyRound className="w-3.5 h-3.5 text-blue-700" />
              <span>Municipal Officer Directory (Click to Populate):</span>
            </div>
            <div className="space-y-1.5">
              <button
                type="button"
                onClick={() => {
                  setEmail('officer.roads@cityworks.gov');
                  setPassword('CityWorks2026!');
                }}
                className="w-full text-left p-2 rounded bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 text-xs transition-colors flex items-center justify-between"
              >
                <div>
                  <strong className="text-slate-900 block">Roads Executive Engineer (GCC)</strong>
                  <span className="text-[11px] text-slate-500 font-mono">officer.roads@cityworks.gov</span>
                </div>
                <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded font-semibold">
                  Fill
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setEmail('waterworks@cmwssb.tn.gov.in');
                  setPassword('MetroWater2026!');
                }}
                className="w-full text-left p-2 rounded bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 text-xs transition-colors flex items-center justify-between"
              >
                <div>
                  <strong className="text-slate-900 block">Water Board Engineer (CMWSSB)</strong>
                  <span className="text-[11px] text-slate-500 font-mono">waterworks@cmwssb.tn.gov.in</span>
                </div>
                <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded font-semibold">
                  Fill
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setEmail('admin@cityworks.gov');
                  setPassword('CityWorks2026!');
                }}
                className="w-full text-left p-2 rounded bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 text-xs transition-colors flex items-center justify-between"
              >
                <div>
                  <strong className="text-slate-900 block">Joint Commissioner (City Admin)</strong>
                  <span className="text-[11px] text-slate-500 font-mono">admin@cityworks.gov</span>
                </div>
                <span className="text-[10px] bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded font-semibold">
                  Admin Fill
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
