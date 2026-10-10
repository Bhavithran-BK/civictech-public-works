'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { DashboardSummary, Project, ProjectStatus, ProjectType } from '@/lib/types';
import { ProjectCard } from '@/components/project/ProjectCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import {
  AlertTriangle,
  Clock,
  Layers,
  IndianRupee,
  ShieldCheck,
  PlusCircle,
  FileText,
  Search,
  Filter,
  RefreshCw,
  TrendingDown,
  AlertOctagon,
  Ban,
  CheckCircle2,
  MapPin,
  Building2,
  HardHat,
  ArrowRight,
  ExternalLink,
  Flame,
} from 'lucide-react';

export default function HomePage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCorridor, setSelectedCorridor] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [projData, sumData] = await Promise.all([
        api.getProjects(),
        api.getDashboardSummary(),
      ]);
      setProjects(projData);
      setSummary(sumData);
    } catch (err) {
      console.error('Failed to load projects', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredProjects = projects.filter((p) => {
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    const matchesType = typeFilter === 'all' || p.type === typeFilter;
    const matchesSearch =
      searchQuery === '' ||
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.location_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.contractor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.ward && p.ward.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCorridor =
      !selectedCorridor || p.location_name.toLowerCase().includes(selectedCorridor.toLowerCase());
    return matchesStatus && matchesType && matchesSearch && matchesCorridor;
  });

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col text-slate-900">
      {/* Top Navbar */}
      <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-50 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center font-black text-white text-lg tracking-wider shadow">
                DO
              </div>
              <div>
                <span className="font-extrabold text-base tracking-tight text-white flex items-center gap-1.5">
                  DigOnce
                  <span className="text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-400/30">
                    Live Portal
                  </span>
                </span>
                <p className="text-[11px] text-slate-400 hidden sm:block">
                  Civic Works Coordination & Dig-Once Conflict Engine
                </p>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/dept/login"
              className="px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors border border-slate-700"
            >
              Officer Login
            </Link>
            <Link
              href="/dept/dashboard"
              className="px-3.5 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow transition-all flex items-center gap-1"
            >
              <span>Authority Dashboard</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <Link
              href="/dept/projects/new"
              className="hidden sm:inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-amber-300 bg-amber-950/60 hover:bg-amber-900/80 rounded-lg border border-amber-700/60 transition-colors"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span>Test Conflict Warning</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Executive KPI Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-gradient-to-br from-emerald-900 to-slate-900 text-white p-3.5 rounded-xl border border-emerald-700 shadow-sm">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300 flex items-center gap-1">
              <TrendingDown className="w-3.5 h-3.5" />
              Duplicate-Dig Savings
            </span>
            <div className="text-xl sm:text-2xl font-black mt-1">₹4.85 Crore</div>
            <p className="text-[11px] text-emerald-200/80 mt-0.5">7 road clashes prevented</p>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 flex items-center gap-1">
              <AlertOctagon className="w-3.5 h-3.5" />
              Overdue / Delayed
            </span>
            <div className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
              {summary?.overdue_projects_count ?? 6} Projects
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">Mandatory delay reasons logged</p>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              Open Citizen Reports
            </span>
            <div className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
              {summary?.open_reports_count ?? 18} Reports
            </div>
            <p className="text-[11px] text-amber-700 font-medium mt-0.5">4 unaddressed &gt; 72h</p>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-[10px] font-bold uppercase tracking-wider text-red-900 flex items-center gap-1">
              <Ban className="w-3.5 h-3.5 text-red-600" />
              Stalled Auto-Flags
            </span>
            <div className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
              {summary?.status_counts.stalled ?? 2} Sites
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">Health Score &lt; 40 / Inactive</p>
          </div>
        </div>

        {/* Live Active Clash Alert Banner */}
        <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-amber-500 text-white rounded-lg shrink-0 mt-0.5 sm:mt-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm text-amber-950 uppercase tracking-wide">
                  Active Coordination Warning: Anna Salai Corridor
                </span>
                <span className="text-[10px] font-bold bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full">
                  2 Clashing Works
                </span>
              </div>
              <p className="text-xs text-slate-700 mt-1">
                GCC Arterial Resurfacing ends <strong>Nov 15</strong>, but CMWSSB Sewerage Pipeline Trenching starts <strong>Oct 25</strong>. DigOnce calculated a joint coordination window to prevent repeated road digging.
              </p>
            </div>
          </div>
          <Link
            href="/dept/projects/new"
            className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg shrink-0 shadow transition-colors"
          >
            Open Clash Engine
          </Link>
        </div>

        {/* Corridor Quick Filters */}
        <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-blue-600" />
              Major Work Corridors
            </span>
            {selectedCorridor && (
              <button
                onClick={() => setSelectedCorridor(null)}
                className="text-xs font-semibold text-blue-600 hover:underline"
              >
                Clear Corridor Filter
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              'Anna Salai',
              'Velachery',
              'T. Nagar',
              'OMR',
              'Mylapore',
              'Poonamallee',
              'Guindy',
              'Besant Nagar',
            ].map((corridor) => (
              <button
                key={corridor}
                onClick={() =>
                  setSelectedCorridor(selectedCorridor === corridor ? null : corridor)
                }
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                  selectedCorridor === corridor
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {corridor}
              </button>
            ))}
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3">
          {/* Status Pills */}
          <div>
            <div className="text-xs font-bold uppercase text-slate-500 mb-2 tracking-wider">
              Status Filter
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  statusFilter === 'all'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All ({projects.length})
              </button>
              <button
                onClick={() => setStatusFilter('on_track')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  statusFilter === 'on_track' ? 'bg-emerald-600 text-white' : 'badge-on-track'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>On track</span>
              </button>
              <button
                onClick={() => setStatusFilter('at_risk')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  statusFilter === 'at_risk' ? 'bg-amber-600 text-white' : 'badge-at-risk'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>At risk</span>
              </button>
              <button
                onClick={() => setStatusFilter('delayed')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  statusFilter === 'delayed' ? 'bg-rose-600 text-white' : 'badge-delayed'
                }`}
              >
                <AlertOctagon className="w-3.5 h-3.5" />
                <span>Delayed</span>
              </button>
              <button
                onClick={() => setStatusFilter('stalled')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  statusFilter === 'stalled' ? 'bg-red-950 text-white' : 'badge-stalled'
                }`}
              >
                <Ban className="w-3.5 h-3.5" />
                <span>Stalled</span>
              </button>
              <button
                onClick={() => setStatusFilter('planned')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  statusFilter === 'planned' ? 'bg-slate-600 text-white' : 'badge-planned'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Planned</span>
              </button>
              <button
                onClick={() => setStatusFilter('completed')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  statusFilter === 'completed' ? 'bg-blue-600 text-white' : 'badge-completed'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Completed</span>
              </button>
            </div>
          </div>

          {/* Search Input & Type Filter */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2 border-t border-slate-100">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search projects by road, contractor, ward..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Infrastructure Types</option>
              <option value="road">Road Works</option>
              <option value="drain">Storm Water Drains</option>
              <option value="pipeline">Water / Sewerage Pipelines</option>
              <option value="electrical">Power & Electrical Cables</option>
              <option value="telecom">Telecom & Smart City Fiber</option>
            </select>
          </div>
        </div>

        {/* Project Results Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <span>Public Works Projects</span>
            <span className="text-xs bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full font-mono">
              {filteredProjects.length}
            </span>
          </h2>
          <button
            onClick={loadData}
            className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 font-semibold"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Cards Grid */}
        {loading ? (
          <div className="text-center py-20 bg-white rounded-xl border border-slate-200">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-600 mb-2" />
            <p className="text-xs text-slate-500">Loading public works projects...</p>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-slate-200 p-6">
            <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-800">No projects found</h3>
            <p className="text-xs text-slate-500 mt-1">Try resetting your search or status filter.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProjects.map((project) => (
              <ProjectCard key={project.id} project={project} isDeptView={true} />
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 mt-12 text-center text-xs text-slate-500">
        DigOnce Public Works Coordination Platform • Civic Transparency & Accountability
      </footer>
    </div>
  );
}
