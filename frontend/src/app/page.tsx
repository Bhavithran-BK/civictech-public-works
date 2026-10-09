import React from 'react';
import Link from 'next/link';
import {
  Building2,
  MapPin,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  Activity,
  Layers,
  FileCheck2,
} from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col">
      {/* Navigation */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center font-black text-white text-lg tracking-wider shadow-sm">
              DO
            </div>
            <span className="font-extrabold text-lg tracking-tight text-white">
              DigOnce
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/dept/login"
              className="px-3.5 py-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors border border-slate-700"
            >
              Officer Login
            </Link>
            <Link
              href="/dept/dashboard"
              className="px-3.5 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-sm transition-all flex items-center gap-1.5"
            >
              <span>Authority Dashboard</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col justify-center max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-20 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-400/20 text-blue-400 text-xs font-semibold mx-auto mb-6">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>CivicTech Public Works Coordination & Dig-Once Engine</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
          Stopping Repeat Road Excavations Through Inter-Agency Coordination
        </h1>

        <p className="mt-4 text-sm sm:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
          A shared planner that stops departments from digging the same road twice, powered by PostGIS
          conflict detection, mandatory delay accountability, and citizen verification.
        </p>

        {/* Feature Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-12 text-left">
          <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800">
            <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg w-fit mb-3">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white">Dig-Once Conflict Engine</h3>
            <p className="text-xs text-slate-400 mt-1">
              Geospatial buffer queries identify schedule clashes between roads, drains, power, and water utilities.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800">
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg w-fit mb-3">
              <Activity className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white">Delay Accountability</h3>
            <p className="text-xs text-slate-400 mt-1">
              Delays cannot be saved without mandatory public justification reasons. Stalled projects auto-flag.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800">
            <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg w-fit mb-3">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white">Authority Oversight</h3>
            <p className="text-xs text-slate-400 mt-1">
              Live executive metrics tracking duplicate-dig savings (₹4.85+ Cr), overdue projects, and open citizen reports.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/dept/dashboard"
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
          >
            <span>Open Authority Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/dept/projects/new"
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-sm border border-slate-700 transition-all"
          >
            Schedule Work (Test Conflict Warning)
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-6 text-center text-xs text-slate-500">
        DigOnce Public Works Coordination Platform • Built for Civic Transparency
      </footer>
    </div>
  );
}
