'use client';

import React, { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { fetchProjects } from '@/lib/api';
import { Project, WorkType, ProjectStatus } from '@/lib/types';
import { ProjectCard } from '@/components/project/ProjectCard';
import { ReportModal } from '@/components/project/ReportModal';
import { 
  Building2, 
  Search, 
  MapPin, 
  ListFilter,
  Layers,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  Info
} from 'lucide-react';
import Link from 'next/link';

const InteractiveMap = dynamic(() => import('@/components/map/InteractiveMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-slate-100 flex flex-col items-center justify-center gap-2 text-slate-400">
      <div className="w-6 h-6 border-2 border-slate-300 border-t-blue-600 rounded-full animate-spin" />
      <span className="text-xs font-medium">Loading OpenStreetMap Corridors...</span>
    </div>
  )
});

export default function CitizenPortalPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<WorkType | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'all'>('all');
  const [reportingProject, setReportingProject] = useState<Project | null>(null);
  const [activeTab, setActiveTab] = useState<'map' | 'list'>('map'); // mobile switcher

  const loadProjectsFromApi = React.useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchProjects(typeFilter, statusFilter);
      setProjects(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [typeFilter, statusFilter]);

  React.useEffect(() => {
    loadProjectsFromApi();
  }, [loadProjectsFromApi]);

  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      const matchesSearch =
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.referenceCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.roadName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.departmentName.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesSearch;
    });
  }, [projects, searchQuery]);

  const handleRefresh = () => {
    loadProjectsFromApi();
  };

  const activeProject = useMemo(
    () => projects.find((p) => p.id === selectedProjectId),
    [projects, selectedProjectId]
  );

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-slate-50 text-slate-900 font-sans">
      {/* Top Navbar */}
      <header className="h-14 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between shrink-0 z-20 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-blue-700 text-white font-black flex items-center justify-center text-sm shadow-xs tracking-tight">
            DO
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm sm:text-base text-slate-900 tracking-tight">DigOnce</span>
              <span className="text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-0.2 rounded">
                Ward Trench Registry
              </span>
            </div>
            <p className="text-[11px] text-slate-500 hidden sm:block">
              Live Public Works Coordination & Citizen Verification
            </p>
          </div>
        </div>

        {/* Global Stats Pills & Officer Link */}
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="hidden md:flex items-center gap-3 text-xs pr-3 border-r border-slate-200">
            <span className="flex items-center gap-1.5 text-slate-600">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <strong>{projects.filter(p => p.status === 'on_track').length}</strong> On Track
            </span>
            <span className="flex items-center gap-1.5 text-rose-700">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <strong>{projects.filter(p => p.status === 'delayed' || p.status === 'stalled').length}</strong> Delayed/Stalled
            </span>
            <span className="flex items-center gap-1.5 text-amber-800">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              <strong>{projects.reduce((acc, p) => acc + (p.conflicts ? p.conflicts.length : 0), 0)}</strong> Clashes
            </span>
          </div>

          <Link
            href="/dept/login"
            className="text-xs font-semibold px-3 py-1.5 rounded-md bg-slate-900 hover:bg-slate-800 text-white flex items-center gap-1.5 shadow-2xs transition-colors"
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Officer Portal</span>
          </Link>
        </div>
      </header>

      {/* Main App Workspace: Left Sidebar + Right Map */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Sidebar (Search, Filters & Feed) */}
        <aside className="w-full md:w-[420px] lg:w-[460px] bg-white border-r border-slate-200 flex flex-col shrink-0 z-10">
          {/* Search & Filter Header */}
          <div className="p-3 border-b border-slate-200 space-y-2 bg-slate-50/50">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search road name, contractor, ward..."
                className="w-full text-xs pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-md text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
              />
            </div>

            {/* Dropdown Filters */}
            <div className="grid grid-cols-2 gap-2">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as any)}
                className="text-xs px-2 py-1.5 border border-slate-300 rounded-md bg-white text-slate-700"
              >
                <option value="all">All Utility Types</option>
                <option value="road">Road Resurfacing</option>
                <option value="water_pipeline">Water / Drainage</option>
                <option value="electricity">Electric Cables</option>
                <option value="metro">Metro Works</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="text-xs px-2 py-1.5 border border-slate-300 rounded-md bg-white text-slate-700"
              >
                <option value="all">All Statuses</option>
                <option value="on_track">On Track</option>
                <option value="at_risk">At Risk</option>
                <option value="delayed">Delayed</option>
                <option value="stalled">Stalled</option>
                <option value="planned">Planned</option>
              </select>
            </div>

            {/* Mobile View Toggle */}
            <div className="flex md:hidden items-center border border-slate-200 rounded-md overflow-hidden text-xs font-semibold">
              <button
                onClick={() => setActiveTab('map')}
                className={`flex-1 py-1 text-center ${activeTab === 'map' ? 'bg-blue-600 text-white' : 'bg-white text-slate-700'}`}
              >
                Map View
              </button>
              <button
                onClick={() => setActiveTab('list')}
                className={`flex-1 py-1 text-center ${activeTab === 'list' ? 'bg-blue-600 text-white' : 'bg-white text-slate-700'}`}
              >
                List View ({filteredProjects.length})
              </button>
            </div>
          </div>

          {/* Project List Feed */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
            <div className="flex items-center justify-between text-[11px] text-slate-500 pb-1">
              <span>Showing <strong>{filteredProjects.length}</strong> active corridors</span>
              <button onClick={handleRefresh} className="hover:text-slate-800 flex items-center gap-1">
                <RotateCw className="w-3 h-3" /> Refresh
              </button>
            </div>

            {filteredProjects.length === 0 ? (
              <div className="text-center py-12 text-xs text-slate-400">
                No civic projects match your filter.
              </div>
            ) : (
              filteredProjects.map((p) => (
                <ProjectCard
                  key={p.id}
                  project={p}
                  isSelected={p.id === selectedProjectId}
                  onSelect={() => {
                    setSelectedProjectId(p.id);
                    if (window.innerWidth < 768) setActiveTab('map');
                  }}
                  onOpenReportModal={(project) => setReportingProject(project)}
                />
              ))
            )}
          </div>
        </aside>

        {/* Right Map Canvas (Full Viewport Fill) */}
        <main className={`flex-1 h-full relative ${activeTab === 'map' ? 'block' : 'hidden md:block'}`}>
          <InteractiveMap
            projects={filteredProjects}
            selectedProjectId={selectedProjectId}
            onSelectProject={(p) => setSelectedProjectId(p.id)}
          />

          {/* Quick Floating Project Inspector when marker is clicked */}
          {activeProject && (
            <div className="absolute bottom-4 left-4 right-4 sm:right-auto sm:w-96 z-10 bg-white/95 backdrop-blur-md border border-slate-200 rounded-lg p-3.5 shadow-xl animate-in fade-in slide-in-from-bottom-2">
              <div className="flex items-start justify-between gap-2 mb-1">
                <span className="font-mono text-[11px] font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">
                  {activeProject.referenceCode}
                </span>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800">
                  {activeProject.status.replace('_', ' ')}
                </span>
              </div>
              <h4 className="text-xs font-bold text-slate-900 leading-snug line-clamp-1">
                {activeProject.title}
              </h4>
              <p className="text-[11px] text-slate-500 mt-0.5 truncate">{activeProject.roadName}</p>

              <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-[11px] text-slate-500">
                  Target: <strong>{activeProject.plannedEndDate}</strong>
                </span>
                <Link
                  href={`/projects/${activeProject.id}`}
                  className="font-bold text-blue-700 hover:text-blue-900 flex items-center gap-1 text-[11px]"
                >
                  Full Audit Dossier <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Citizen Geotagged Audit Modal */}
      <ReportModal
        project={reportingProject}
        isOpen={Boolean(reportingProject)}
        onClose={() => setReportingProject(null)}
        onReportSubmitted={() => handleRefresh()}
      />
    </div>
  );
}
