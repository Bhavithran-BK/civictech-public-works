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
      ((p.location_name || p.roadName)?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
      p.contractor.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <DeptNav />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Top Header & Action */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
              Authority Oversight & Coordination
            </h1>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">
              Live inter-department roadwork schedule, clash resolution, and accountability tracking
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadData}
              className="p-2 text-gray-600 hover:text-gray-900 bg-white border border-gray-200 rounded hover:bg-gray-50 transition-colors shadow-sm"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <Link
              href="/dept/projects/new"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white text-xs sm:text-sm font-medium rounded shadow-sm transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Schedule New Project</span>
            </Link>
          </div>
        </div>

        {/* Executive Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
          {/* Card 1: Duplicate-Dig Savings */}
          <div className="bg-white text-gray-900 rounded p-4 shadow-sm border border-gray-200 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-green-700">
                Duplicate-Dig Savings
              </span>
              <div className="p-1.5 bg-green-50 rounded text-green-700">
                <IndianRupee className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <span className="text-xl sm:sm:text-2xl font-bold tracking-tight text-gray-900">
                ₹{(((summary?.duplicate_dig_savings_est_inr ?? 0)) / 10000000).toFixed(2)} Cr
              </span>
              <p className="text-[11px] text-green-700 mt-1 flex items-center gap-1 font-medium">
                <TrendingDown className="w-3 h-3" />
                <span>{summary?.recent_conflicts_prevented ?? 0} inter-agency clashes prevented</span>
              </p>
            </div>
          </div>

          {/* Card 2: Overdue Projects */}
          <div className="bg-white rounded p-4 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-red-600">
                Overdue / Delayed
              </span>
              <div className="p-1.5 bg-red-50 rounded text-red-600">
                <AlertOctagon className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <span className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900">
                {summary?.overdue_projects_count ?? 6}
              </span>
              <p className="text-[11px] text-gray-500 mt-1 font-medium">
                Projects past planned completion
              </p>
            </div>
          </div>

          {/* Card 3: Open Citizen Reports */}
          <div className="bg-white rounded p-4 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-yellow-700">
                Citizen Reports
              </span>
              <div className="p-1.5 bg-yellow-50 rounded text-yellow-700">
                <FileText className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <span className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900">
                {summary?.open_reports_count ?? 18}
              </span>
              <p className="text-[11px] text-yellow-700 font-medium mt-1">
                {summary?.unresponsive_reports_72h ?? 4} unaddressed &gt; 72h
              </p>
            </div>
          </div>

          {/* Card 4: Stalled Auto-Flags */}
          <div className="bg-white rounded p-4 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-700">
                Stalled Auto-Flags
              </span>
              <div className="p-1.5 bg-red-50 rounded text-red-800">
                <Ban className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <span className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900">
                {summary?.status_counts.stalled ?? 2}
              </span>
              <p className="text-[11px] text-gray-500 mt-1 font-medium">
                Health score &lt; 40 / Inactive
              </p>
            </div>
          </div>
        </div>

        {/* Status Distribution Pills */}
        <div className="bg-white border border-gray-200 rounded p-3 sm:p-4 mb-6 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase text-gray-600 tracking-wider">
              Project Status Counts
            </span>
            <span className="text-xs font-semibold text-gray-700">
              Total: {projects.length} works
            </span>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded text-xs font-semibold transition-all border ${
                statusFilter === 'all'
                  ? 'bg-blue-700 text-white border-blue-700'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              All ({projects.length})
            </button>

            <button
              onClick={() => setStatusFilter('on_track')}
              className={`px-3 py-1.5 rounded text-xs font-semibold transition-all flex items-center gap-1.5 border ${
                statusFilter === 'on_track'
                  ? 'bg-green-600 text-white border-green-600'
                  : 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>On track ({summary?.status_counts.on_track ?? 11})</span>
            </button>

            <button
              onClick={() => setStatusFilter('at_risk')}
              className={`px-3 py-1.5 rounded text-xs font-semibold transition-all flex items-center gap-1.5 border ${
                statusFilter === 'at_risk'
                  ? 'bg-yellow-600 text-white border-yellow-600'
                  : 'bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>At risk ({summary?.status_counts.at_risk ?? 5})</span>
            </button>

            <button
              onClick={() => setStatusFilter('delayed')}
              className={`px-3 py-1.5 rounded text-xs font-semibold transition-all flex items-center gap-1.5 border ${
                statusFilter === 'delayed'
                  ? 'bg-red-600 text-white border-red-600'
                  : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
              }`}
            >
              <AlertOctagon className="w-3.5 h-3.5" />
              <span>Delayed ({summary?.status_counts.delayed ?? 6})</span>
            </button>

            <button
              onClick={() => setStatusFilter('stalled')}
              className={`px-3 py-1.5 rounded text-xs font-bold transition-all flex items-center gap-1.5 border ${
                statusFilter === 'stalled'
                  ? 'bg-red-800 text-white border-red-800'
                  : 'bg-red-100 text-red-800 border-red-300 hover:bg-red-200'
              }`}
            >
              <Ban className="w-3.5 h-3.5" />
              <span>Stalled ({summary?.status_counts.stalled ?? 2})</span>
            </button>

            <button
              onClick={() => setStatusFilter('planned')}
              className={`px-3 py-1.5 rounded text-xs font-semibold transition-all flex items-center gap-1.5 border ${
                statusFilter === 'planned'
                  ? 'bg-gray-600 text-white border-gray-600'
                  : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Planned ({summary?.status_counts.planned ?? 3})</span>
            </button>

            <button
              onClick={() => setStatusFilter('completed')}
              className={`px-3 py-1.5 rounded text-xs font-semibold transition-all flex items-center gap-1.5 border ${
                statusFilter === 'completed'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
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
            <Search className="w-4 h-4 absolute left-3 top-1/2 -trangray-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by road name, ward, contractor, or purpose..."
              className="w-full pl-9 pr-4 py-2 bg-white border border-gray-300 rounded text-xs sm:text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
            />
          </div>
          <div className="text-xs font-medium text-gray-600 self-center">
            Showing {filteredProjects.length} of {projects.length} public works
          </div>
        </div>

        {/* Project List / Grid */}
        {loading ? (
          <div className="text-center py-16 bg-white rounded border border-gray-200">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-600 mb-2" />
            <p className="text-xs text-gray-500">Loading department projects...</p>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="text-center py-16 bg-white rounded border border-gray-200 p-6">
            <FileText className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-gray-800">No projects match your filter</h3>
            <p className="text-xs text-gray-500 mt-1">
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
