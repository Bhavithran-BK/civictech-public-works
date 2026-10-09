'use client';

import React, { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { getProjects } from '@/lib/api';
import { Project, WorkType, ProjectStatus } from '@/lib/types';
import { ProjectCard } from '@/components/project/ProjectCard';
import { ReportModal } from '@/components/project/ReportModal';
import { 
  Building2, 
  Search, 
  SlidersHorizontal, 
  ShieldCheck, 
  Layers, 
  MapPin, 
  ArrowUpRight,
  TrendingUp,
  AlertTriangle,
  FileSpreadsheet
} from 'lucide-react';
import Link from 'next/link';

// Dynamically import Leaflet Map to ensure no SSR window errors
const InteractiveMap = dynamic(() => import('@/components/map/InteractiveMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[460px] rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse flex items-center justify-center text-xs text-slate-400 font-mono">
      Initializing PostGIS GIS Cartography Engine...
    </div>
  )
});

export default function CitizenPortalPage() {
  const [projects, setProjects] = useState<Project[]>(() => getProjects());
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<WorkType | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'all'>('all');
  const [reportingProject, setReportingProject] = useState<Project | null>(null);
  const [viewTab, setViewTab] = useState<'split' | 'map' | 'list'>('split');

  // Filtered projects
  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      const matchesSearch =
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.referenceCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.roadName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.departmentName.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesType = typeFilter === 'all' || p.type === typeFilter;
      const matchesStatus = statusFilter === 'all' || p.status === statusFilter;

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [projects, searchQuery, typeFilter, statusFilter]);

  const handleRefreshData = () => {
    setProjects(getProjects());
  };

  const selectedProject = useMemo(
    () => projects.find((p) => p.id === selectedProjectId),
    [projects, selectedProjectId]
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans">
      {/* Institutional Civic Header */}
      <header className="sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black shadow-md tracking-tight">
              DO
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base tracking-tight text-slate-900 dark:text-slate-100">
                  DigOnce
                </span>
                <span className="text-[10px] font-semibold bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-900">
                  Municipal Public Works Registry
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                Unified Ward Coordination & Citizen Verification Portal
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/dept/login"
              className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 hover:text-slate-900 flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <Building2 className="w-3.5 h-3.5 text-slate-500" />
              <span>Officer Sign In</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex-1 w-full flex flex-col gap-4">
        {/* KPI Micro-Banners */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Active Road Works</div>
            <div className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-0.5">
              {projects.filter((p) => p.status === 'on_track' || p.status === 'at_risk').length}
            </div>
            <div className="text-[10px] text-emerald-600 font-medium mt-0.5">Live monitoring in 8 wards</div>
          </div>
          <div className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Delayed / Stalled</div>
            <div className="text-xl font-bold text-rose-600 dark:text-rose-400 mt-0.5">
              {projects.filter((p) => p.status === 'delayed' || p.status === 'stalled').length}
            </div>
            <div className="text-[10px] text-rose-600 font-medium mt-0.5">SLA escalation active</div>
          </div>
          <div className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Dig-Once Clashes Caught</div>
            <div className="text-xl font-bold text-amber-600 dark:text-amber-400 mt-0.5">
              {projects.reduce((acc, p) => acc + (p.conflicts ? p.conflicts.length : 0), 0)}
            </div>
            <div className="text-[10px] text-amber-600 font-medium mt-0.5">Saved ₹34.0 Lakhs repeat cost</div>
          </div>
          <div className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Citizen Check-ins</div>
            <div className="text-xl font-bold text-blue-600 dark:text-blue-400 mt-0.5">
              {projects.reduce((acc, p) => acc + p.citizenReports.length, 0)}
            </div>
            <div className="text-[10px] text-blue-600 font-medium mt-0.5">100% Geo-verified on site</div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-[260px]">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search road, reference code, contractor, ward..."
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Type selector */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300"
            >
              <option value="all">All Utility Types</option>
              <option value="road">🛣️ Road Resurfacing</option>
              <option value="water_pipeline">💧 Water Pipeline</option>
              <option value="drainage">🌊 Storm Drainage</option>
              <option value="electricity">⚡ Underground Power</option>
              <option value="metro">🚇 Metro Corridors</option>
            </select>

            {/* Status selector */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300"
            >
              <option value="all">All Statuses</option>
              <option value="on_track">🟢 On Track</option>
              <option value="at_risk">🟡 At Risk</option>
              <option value="delayed">🔴 Delayed</option>
              <option value="stalled">🟣 Stalled</option>
              <option value="planned">⚪ Planned</option>
            </select>
          </div>
        </div>

        {/* Content Layout: Split Map & Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 items-stretch">
          {/* Left / Top: Interactive Map */}
          <div className="lg:col-span-7 flex flex-col h-[480px] lg:h-[620px]">
            <InteractiveMap
              projects={filteredProjects}
              selectedProjectId={selectedProjectId}
              onSelectProject={(p) => setSelectedProjectId(p.id)}
            />
          </div>

          {/* Right / Bottom: Project Feed */}
          <div className="lg:col-span-5 flex flex-col h-[480px] lg:h-[620px] overflow-hidden">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Registry Feed ({filteredProjects.length})
              </span>
              <span className="text-[11px] text-slate-400">Click a card to highlight corridor</span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pt-3 pr-1">
              {filteredProjects.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs">
                  No public works match the current filter criteria.
                </div>
              ) : (
                filteredProjects.map((proj) => (
                  <ProjectCard
                    key={proj.id}
                    project={proj}
                    isSelected={proj.id === selectedProjectId}
                    onSelect={() => setSelectedProjectId(proj.id)}
                    onOpenReportModal={(p) => setReportingProject(p)}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Citizen Geotagged Audit Modal */}
      <ReportModal
        project={reportingProject}
        isOpen={Boolean(reportingProject)}
        onClose={() => setReportingProject(null)}
        onReportSubmitted={() => handleRefreshData()}
      />
    </div>
  );
}
