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
  MapPin, 
  FileText,
  AlertTriangle,
  RotateCw,
  ExternalLink
} from 'lucide-react';
import Link from 'next/link';

const InteractiveMap = dynamic(() => import('@/components/map/InteractiveMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[460px] bg-slate-100 flex items-center justify-center text-xs text-slate-500 font-mono">
      Loading OpenStreetMap GIS spatial layers...
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

  const handleRefresh = () => {
    setProjects(getProjects());
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans">
      {/* Official Government Portal Top Bar */}
      <div className="bg-slate-900 text-slate-200 text-[11px] px-4 py-1 flex items-center justify-between border-b border-slate-800">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-white">MUNICIPAL CORPORATION PUBLIC WORKS MONITOR</span>
            <span className="text-slate-500">|</span>
            <span className="text-slate-400">Civic Infrastructure & Utility Registry</span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span className="text-slate-400">Ward Coordination Active</span>
            <span className="text-slate-500">|</span>
            <Link href="/dept/login" className="hover:text-white font-medium text-blue-400 flex items-center gap-1">
              Officer Portal Login <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <header className="bg-white border-b border-slate-200 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xs bg-blue-800 text-white font-bold flex items-center justify-center text-sm shadow-xs">
              DO
            </div>
            <div>
              <h1 className="text-base font-extrabold text-slate-900 tracking-tight leading-none">
                DigOnce Public Works Transparency Portal
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Real-time tracking of road trenching, water mains, and underground utilities across municipal wards
              </p>
            </div>
          </div>

          <button
            onClick={handleRefresh}
            className="text-xs font-semibold px-2.5 py-1.5 border border-slate-300 rounded-xs hover:bg-slate-50 text-slate-700 flex items-center gap-1.5 shadow-2xs"
          >
            <RotateCw className="w-3.5 h-3.5 text-slate-500" /> Refresh Data
          </button>
        </div>
      </header>

      {/* Content Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex-1 w-full flex flex-col gap-3">
        {/* Metric Summary Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="bg-white p-3 rounded-xs border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Total Active Projects</span>
            <span className="text-lg font-bold text-slate-900">
              {projects.filter((p) => p.status === 'on_track' || p.status === 'at_risk').length}
            </span>
          </div>
          <div className="bg-white p-3 rounded-xs border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 block">Delayed / Stalled Works</span>
            <span className="text-lg font-bold text-rose-700">
              {projects.filter((p) => p.status === 'delayed' || p.status === 'stalled').length}
            </span>
          </div>
          <div className="bg-white p-3 rounded-xs border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 block">Dig-Once Clashes Prevented</span>
            <span className="text-lg font-bold text-amber-800">
              {projects.reduce((acc, p) => acc + (p.conflicts ? p.conflicts.length : 0), 0)}
            </span>
          </div>
          <div className="bg-white p-3 rounded-xs border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 block">Citizen Check-ins Recorded</span>
            <span className="text-lg font-bold text-blue-900">
              {projects.reduce((acc, p) => acc + p.citizenReports.length, 0)}
            </span>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="bg-white p-2.5 rounded-xs border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-2">
          <div className="flex-1 min-w-[240px] relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by road, department, contractor, or project ID..."
              className="w-full text-xs pl-8 pr-2.5 py-1.5 border border-slate-300 rounded-xs bg-slate-50/50 text-slate-900 focus:outline-hidden focus:border-blue-700"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="text-xs px-2 py-1.5 border border-slate-300 rounded-xs bg-white text-slate-800 font-medium"
            >
              <option value="all">All Utility Types</option>
              <option value="road">Road Resurfacing</option>
              <option value="water_pipeline">Water / Sewer Pipeline</option>
              <option value="drainage">Stormwater Drains</option>
              <option value="electricity">Underground Electric</option>
              <option value="metro">Metro Construction</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="text-xs px-2 py-1.5 border border-slate-300 rounded-xs bg-white text-slate-800 font-medium"
            >
              <option value="all">All Project Statuses</option>
              <option value="on_track">On Track</option>
              <option value="at_risk">At Risk</option>
              <option value="delayed">Delayed</option>
              <option value="stalled">Stalled</option>
              <option value="planned">Planned</option>
            </select>
          </div>
        </div>

        {/* 2-Pane GIS Map + Registry Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 flex-1 items-stretch">
          {/* Map Pane */}
          <div className="lg:col-span-7 h-[460px] lg:h-[620px] bg-white border border-slate-200 rounded-xs overflow-hidden">
            <InteractiveMap
              projects={filteredProjects}
              selectedProjectId={selectedProjectId}
              onSelectProject={(p) => setSelectedProjectId(p.id)}
            />
          </div>

          {/* Directory Pane */}
          <div className="lg:col-span-5 flex flex-col h-[460px] lg:h-[620px] bg-white border border-slate-200 rounded-xs p-3">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200 text-xs">
              <span className="font-bold uppercase tracking-wider text-slate-700">
                Registry Index ({filteredProjects.length})
              </span>
              <span className="text-[11px] text-slate-500">Select card to inspect corridor</span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
              {filteredProjects.length === 0 ? (
                <div className="text-center py-10 text-xs text-slate-500">
                  No public works match the selected search criteria.
                </div>
              ) : (
                filteredProjects.map((p) => (
                  <ProjectCard
                    key={p.id}
                    project={p}
                    isSelected={p.id === selectedProjectId}
                    onSelect={() => setSelectedProjectId(p.id)}
                    onOpenReportModal={(project) => setReportingProject(project)}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Citizen Verification Modal */}
      <ReportModal
        project={reportingProject}
        isOpen={Boolean(reportingProject)}
        onClose={() => setReportingProject(null)}
        onReportSubmitted={() => handleRefresh()}
      />
    </div>
  );
}
