import React from 'react';
import { ProjectStatus } from '@/lib/types';
import {
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  CalendarClock,
  CheckCheck,
  Ban,
} from 'lucide-react';

interface StatusBadgeProps {
  status: ProjectStatus;
  healthScore?: number;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  healthScore,
  className = '',
}) => {
  // Always pair color with icon and text label
  switch (status) {
    case 'on_track':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold badge-on-track ${className}`}
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>On track</span>
        </span>
      );

    case 'at_risk':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold badge-at-risk ${className}`}
        >
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
          <span>At risk</span>
        </span>
      );

    case 'delayed':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold badge-delayed ${className}`}
        >
          <AlertOctagon className="w-3.5 h-3.5 text-rose-600" />
          <span>Delayed</span>
        </span>
      );

    case 'planned':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold badge-planned ${className}`}
        >
          <CalendarClock className="w-3.5 h-3.5 text-gray-500" />
          <span>Planned</span>
        </span>
      );

    case 'completed':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold badge-completed ${className}`}
        >
          <CheckCheck className="w-3.5 h-3.5 text-blue-600" />
          <span>Completed</span>
        </span>
      );

    case 'stalled':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold badge-stalled animate-pulse uppercase tracking-wider ${className}`}
        >
          <Ban className="w-3.5 h-3.5 text-rose-300" />
          <span>Stalled</span>
        </span>
      );

    default:
      return null;
  }
};
