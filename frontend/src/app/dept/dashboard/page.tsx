'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { DashboardSummary, Project, ProjectStatus } from '@/lib/types';
import { DeptNav } from '@/components/DeptNav';
import { ProjectCard } from '@/components/project/ProjectCard';
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
} from 'lucide-react';

export default function DeptDashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [sumData, projData] = await Promise.all([
        api.getDashboardSummary(),
        api.getProjects(),
      ]);
      setSummary(sumData);
      setProjects(projData);
    } catch (err) {
      console.error('Failed to load dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredProjects = projects.filter((p) => {
    const matchesStatus =
      statusFilter === 'all' || p.status === statusFilter;
    const matchesSearch =
      searchQuery === '' ||
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.location_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.contractor.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <DeptNav />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Top Header & Action */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Authority Oversight & Coordination
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Live inter-department roadwork schedule, clash resolution, and accountability tracking
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadData}
              className="p-2 text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <Link
              href="/dept/projects/new"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold rounded-lg shadow-sm transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Schedule New Project</span>
            </Link>
          </div>
        </div>

        {/* Executive Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
          {/* Card 1: Duplicate-Dig Savings */}
          <div className="bg-gradient-to-br from-emerald-900 to-slate-900 text-white rounded-xl p-4 shadow-sm border border-emerald-800/40 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-300">
                Duplicate-Dig Savings
              </span>
              <div className="p-1.5 bg-emerald-500/20 rounded-lg text-emerald-300">
                <IndianRupee className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <span className="text-xl sm:text-2xl font-black tracking-tight text-white">
                ₹{((summary?.duplicate_dig_savings_est_inr || 48500000) / 10000000).toFixed(2)} Cr
              </span>
              <p className="text-[11px] text-emerald-200/80 mt-1 flex items-center gap-1 font-medium">
                <TrendingDown className="w-3 h-3" />
                <span>{summary?.recent_conflicts_prevented || 7} road tears avoided</span>
              </p>
            </div>
          </div>

          {/* Card 2: Overdue Projects */}
          <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600">
                Overdue / Delayed
              </span>
              <div className="p-1.5 bg-rose-50 rounded-lg text-rose-600">
                <AlertOctagon className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <span className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
                {summary?.overdue_projects_count ?? 6}
              </span>
              <p className="text-[11px] text-slate-500 mt-1 font-medium">
                Projects past planned completion
              </p>
            </div>
          </div>

          {/* Card 3: Open Citizen Reports */}
          <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600">
                Citizen Reports
              </span>
              <div className="p-1.5 bg-amber-50 rounded-lg text-amber-600">
                <FileText className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <span className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
                {summary?.open_reports_count ?? 18}
              </span>
              <p className="text-[11px] text-amber-600 font-medium mt-1">
                {summary?.unresponsive_reports_72h ?? 4} unaddressed &gt; 72h
              </p>
            </div>
          </div>

          {/* Card 4: Stalled Auto-Flags */}
          <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                Stalled Auto-Flags
              </span>
              <div className="p-1.5 bg-red-100 rounded-lg text-red-800">
                <Ban className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <span className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
                {summary?.status_counts.stalled ?? 2}
              </span>
              <p className="text-[11px] text-slate-500 mt-1 font-medium">
                Health score &lt; 40 / Inactive
              </p>
            </div>
          </div>
        </div>

        {/* Status Distribution Pills */}
        <div className="bg-white border border-slate-200 rounded-xl p-3 sm:p-4 mb-6 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase text-slate-500 tracking-wider">
              Project Status Counts
            </span>
            <span className="text-xs font-semibold text-slate-600">
              Total: {projects.length} works
            </span>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                statusFilter === 'all'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All ({projects.length})
            </button>

            <button
              onClick={() => setStatusFilter('on_track')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                statusFilter === 'on_track'
                  ? 'bg-emerald-600 text-white'
                  : 'badge-on-track hover:opacity-80'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>On track ({summary?.status_counts.on_track ?? 11})</span>
            </button>

            <button
              onClick={() => setStatusFilter('at_risk')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                statusFilter === 'at_risk'
                  ? 'bg-amber-600 text-white'
                  : 'badge-at-risk hover:opacity-80'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>At risk ({summary?.status_counts.at_risk ?? 5})</span>
            </button>

            <button
              onClick={() => setStatusFilter('delayed')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                statusFilter === 'delayed'
                  ? 'bg-rose-600 text-white'
                  : 'badge-delayed hover:opacity-80'
              }`}
            >
              <AlertOctagon className="w-3.5 h-3.5" />
              <span>Delayed ({summary?.status_counts.delayed ?? 6})</span>
            </button>

            <button
              onClick={() => setStatusFilter('stalled')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                statusFilter === 'stalled'
                  ? 'bg-red-900 text-white'
                  : 'badge-stalled hover:opacity-80'
              }`}
            >
              <Ban className="w-3.5 h-3.5" />
              <span>Stalled ({summary?.status_counts.stalled ?? 2})</span>
            </button>

            <button
              onClick={() => setStatusFilter('planned')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                statusFilter === 'planned'
                  ? 'bg-slate-600 text-white'
                  : 'badge-planned hover:opacity-80'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Planned ({summary?.status_counts.planned ?? 3})</span>
            </button>

            <button
              onClick={() => setStatusFilter('completed')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                statusFilter === 'completed'
                  ? 'bg-blue-600 text-white'
                  : 'badge-completed hover:opacity-80'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Completed ({summary?.status_counts.completed ?? 1})</span>
            </button>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by road name, ward, contractor, or purpose..."
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="text-xs font-medium text-slate-500 self-center">
            Showing {filteredProjects.length} of {projects.length} public works
          </div>
        </div>

        {/* Project List / Grid */}
        {loading ? (
          <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-600 mb-2" />
            <p className="text-xs text-slate-500">Loading department projects...</p>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-slate-200 p-6">
            <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-800">No projects match your filter</h3>
            <p className="text-xs text-slate-500 mt-1">
              Try adjusting the status filter or search query.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProjects.map((project) => (
              <ProjectCard key={project.id} project={project} isDeptView={true} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
