import React from 'react';
import { Project } from '@/lib/types';
import { StatusBadge, HealthScoreMeter, WorkTypeIcon } from '../ui/Badges';
import { Calendar, AlertTriangle, ArrowRight, Building, FileSpreadsheet } from 'lucide-react';
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
      className={`relative p-3.5 rounded border transition-colors cursor-pointer bg-white ${
        isSelected
          ? 'border-blue-700 ring-1 ring-blue-700 shadow-xs'
          : 'border-slate-200 hover:border-slate-400'
      }`}
    >
      {/* Header: Project Reference ID & Status */}
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-[11px] font-bold text-slate-700 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded-xs">
            {project.referenceCode}
          </span>
          <span className="text-xs text-slate-500 font-medium">Ward {project.wardNumber} ({project.wardName})</span>
        </div>
        <StatusBadge status={project.status} size="sm" />
      </div>

      {/* Title */}
      <h3 className="font-bold text-slate-900 text-sm leading-snug mb-1">
        {project.title}
      </h3>

      {/* Municipal Agency & Corridor */}
      <div className="text-xs text-slate-600 space-y-0.5 mb-2.5">
        <div className="flex items-center gap-1">
          <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="font-semibold text-slate-800">{project.departmentName}</span>
        </div>
        <div className="flex items-center gap-1 text-slate-500 pl-4">
          <span className="truncate">{project.roadName}</span>
        </div>
      </div>

      {/* Mandatory 5 Fields Table */}
      <div className="grid grid-cols-2 gap-2 text-xs py-2 border-y border-slate-100 bg-slate-50/60 px-2 rounded-xs">
        <div>
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Contractor</span>
          <span className="text-slate-800 font-medium truncate block">{project.contractor}</span>
        </div>
        <div>
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Target Completion</span>
          <span className="text-slate-800 font-semibold flex items-center gap-1">
            <Calendar className="w-3 h-3 text-slate-400" />
            {project.plannedEndDate}
          </span>
        </div>
      </div>

      {/* Delay / Reason if delayed */}
      {project.delays.length > 0 && (
        <div className="mt-2 text-[11px] bg-rose-50 border border-rose-200 p-2 rounded-xs text-rose-900">
          <span className="font-bold">Delay Reason: </span>
          <span>{project.delays[0].reason}</span>
        </div>
      )}

      {/* Conflict Notice if any */}
      {project.conflicts && project.conflicts.length > 0 && (
        <div className="mt-2 text-[11px] bg-amber-50 border border-amber-300 p-2 rounded-xs text-amber-950 flex items-start gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Dig-Once Clash: </span>
            <span>Overlaps with {project.conflicts[0].departmentName}. Joint trenching advised.</span>
          </div>
        </div>
      )}

      {/* Health Score & Direct Links */}
      <div className="mt-3 pt-2 flex items-center justify-between border-t border-slate-100">
        <div>
          <span className="text-[10px] font-bold uppercase text-slate-400 block">Health Index</span>
          <HealthScoreMeter score={project.healthScore} />
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (onOpenReportModal) onOpenReportModal(project);
            }}
            className="text-xs font-semibold px-2 py-1 rounded-xs bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300"
          >
            Check-in
          </button>
          <Link
            href={`/projects/${project.id}`}
            onClick={(e) => e.stopPropagation()}
            className="text-xs font-bold text-blue-700 hover:text-blue-900 flex items-center gap-0.5"
          >
            Audit Record <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </div>
  );
};
