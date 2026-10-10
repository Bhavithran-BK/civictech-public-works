import React from 'react';
import Link from 'next/link';
import { Project } from '@/lib/types';
import { StatusBadge } from '@/components/ui/StatusBadge';
import {
  Calendar,
  Building2,
  HardHat,
  AlertCircle,
  ArrowRight,
  Activity,
} from 'lucide-react';

interface ProjectCardProps {
  project: Project;
  isDeptView?: boolean;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  isDeptView = true,
}) => {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
      <div>
        {/* Header: Type, Location, Status Badge */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div>
            <span className="text-[10px] font-bold tracking-wider uppercase text-blue-800 bg-blue-50 px-2 py-0.5 rounded">
              {project.type}
            </span>
            <p className="text-xs text-gray-500 mt-1 font-medium">
              {project.location_name} {project.ward ? `• ${project.ward}` : ''}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <StatusBadge status={project.status} healthScore={project.health_score} />
            <div className="flex items-center gap-1 text-[11px] font-semibold text-gray-600">
              <Activity className="w-3 h-3 text-gray-400" />
              <span>Health: {project.health_score}/100</span>
            </div>
          </div>
        </div>

        {/* 1. WHAT */}
        <div className="mb-3">
          <h3 className="font-bold text-gray-900 text-base leading-snug">
            {project.title}
          </h3>
          <p className="text-xs text-gray-600 line-clamp-2 mt-1">
            {project.purpose}
          </p>
        </div>

        {/* 5-Field Standard Spec */}
        <div className="space-y-2 text-xs border-t border-gray-100 pt-2.5 my-2">
          {/* 2. WHO */}
          <div className="flex items-start gap-1.5 text-gray-700">
            <Building2 className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />
            <div>
              <span className="font-semibold text-gray-900">Who: </span>
              <span>{project.department_name}</span>
              <div className="text-[11px] text-gray-500 flex items-center gap-1 mt-0.5">
                <HardHat className="w-3 h-3" />
                <span>Contractor: {project.contractor}</span>
              </div>
            </div>
          </div>

          {/* 3. WHEN */}
          <div className="flex items-center gap-1.5 text-gray-700">
            <Calendar className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <div>
              <span className="font-semibold text-gray-900">When: </span>
              <span>
                {project.start_date} → {project.end_date}
              </span>
              {project.end_date !== project.original_end_date && (
                <span className="text-[10px] text-rose-600 ml-1.5 font-medium">
                  (Orig: {project.original_end_date})
                </span>
              )}
            </div>
          </div>

          {/* 4. STATUS (Already Badged, textual confirmation) */}
          <div className="flex items-center gap-1.5 text-gray-700">
            <span className="font-semibold text-gray-900">Status: </span>
            <span className="capitalize">{project.status.replace('_', ' ')}</span>
          </div>

          {/* 5. WHY-DELAYED */}
          <div className="flex items-start gap-1.5">
            <AlertCircle
              className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${
                project.latest_delay_reason ? 'text-rose-600' : 'text-gray-300'
              }`}
            />
            <div>
              <span className="font-semibold text-gray-900">Why-delayed: </span>
              {project.latest_delay_reason ? (
                <span className="text-rose-700 font-medium">
                  {project.latest_delay_reason}
                </span>
              ) : (
                <span className="text-gray-400 italic">None logged (On schedule)</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Action footer */}
      {isDeptView && (
        <div className="border-t border-gray-100 pt-3 mt-2 flex items-center justify-between">
          <span className="text-xs font-semibold text-gray-500">
            ₹{(project.budget / 10000000).toFixed(2)} Cr
          </span>
          <Link
            href={`/dept/projects/${project.id}/edit`}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
          >
            <span>Update / Log Delay</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}
    </div>
  );
};
