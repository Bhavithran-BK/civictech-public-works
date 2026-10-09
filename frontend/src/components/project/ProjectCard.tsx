import React from 'react';
import { Project } from '@/lib/types';
import { StatusBadge, HealthScoreMeter, WorkTypeIcon } from '../ui/Badges';
import { Calendar, User, MapPin, AlertTriangle, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface ProjectCardProps {
  project: Project;
  isSelected?: boolean;
  onSelect?: () => void;
  onOpenReportModal?: (project: Project) => void;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  isSelected,
  onSelect,
  onOpenReportModal
}) => {
  return (
    <div
      onClick={onSelect}
      className={`group relative p-4 rounded-xl border transition-all duration-200 cursor-pointer bg-white dark:bg-slate-900 ${
        isSelected
          ? 'border-blue-600 ring-2 ring-blue-500/20 shadow-md'
          : 'border-slate-200/90 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs'
      }`}
    >
      {/* Header: Ref Code & Status Badge */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-mono text-[11px] font-semibold tracking-wider text-slate-500 uppercase bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
            {project.referenceCode}
          </span>
          <span className="text-xs text-slate-400 font-medium">· Ward {project.wardNumber}</span>
        </div>
        <StatusBadge status={project.status} size="sm" />
      </div>

      {/* Project Title */}
      <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-sm leading-snug mb-1.5 group-hover:text-blue-600 transition-colors">
        {project.title}
      </h3>

      {/* Department & Street info */}
      <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 mb-2.5">
        <WorkTypeIcon type={project.type} className="w-3.5 h-3.5 text-slate-400" />
        <span className="font-medium text-slate-700 dark:text-slate-300">{project.departmentName}</span>
        <span>•</span>
        <span className="truncate">{project.roadName}</span>
      </div>

      {/* Health Score & Delay Alert */}
      <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800/80 pt-2.5 mt-2">
        <div>
          <span className="text-[10px] uppercase tracking-wider text-slate-400 block mb-0.5">Project Health</span>
          <HealthScoreMeter score={project.healthScore} />
        </div>

        <div className="text-right">
          <span className="text-[10px] uppercase tracking-wider text-slate-400 block mb-0.5">Target Completion</span>
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1 justify-end">
            <Calendar className="w-3 h-3 text-slate-400" />
            {project.plannedEndDate}
          </span>
        </div>
      </div>

      {/* Conflict / Delay Banner if applicable */}
      {project.conflicts && project.conflicts.length > 0 && (
        <div className="mt-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-lg p-2 text-xs text-rose-800 dark:text-rose-300 flex items-start gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
          <div className="leading-tight">
            <span className="font-semibold">Dig-Once Clash Detected:</span> Coincides with {project.conflicts[0].departmentName}.
          </div>
        </div>
      )}

      {/* Card Actions */}
      <div className="mt-3 pt-2 flex items-center justify-between gap-2 border-t border-slate-100 dark:border-slate-800/60">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (onOpenReportModal) onOpenReportModal(project);
          }}
          className="text-xs font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:underline px-1 py-0.5"
        >
          Verify / Check-in
        </button>

        <Link
          href={`/projects/${project.id}`}
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 group-hover:translate-x-0.5 transition-transform"
        >
          Public Audit Dossier <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
};
