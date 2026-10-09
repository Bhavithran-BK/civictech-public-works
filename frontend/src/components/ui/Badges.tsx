import React from 'react';
import { ProjectStatus, WorkType } from '@/lib/types';
import { 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  AlertOctagon, 
  CalendarClock, 
  CheckCheck,
  Shovel,
  Droplets,
  Zap,
  Radio,
  TrainTrack
} from 'lucide-react';

interface StatusBadgeProps {
  status: ProjectStatus;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const configs: Record<
    ProjectStatus,
    { label: string; bg: string; border: string; icon: React.ReactNode }
  > = {
    on_track: {
      label: 'On Track',
      bg: 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300',
      border: 'border-emerald-300 dark:border-emerald-800',
      icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
    },
    at_risk: {
      label: 'At Risk',
      bg: 'bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300',
      border: 'border-amber-300 dark:border-amber-800',
      icon: <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
    },
    delayed: {
      label: 'Delayed',
      bg: 'bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300',
      border: 'border-rose-300 dark:border-rose-800',
      icon: <AlertTriangle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
    },
    stalled: {
      label: 'Stalled',
      bg: 'bg-purple-50 text-purple-800 dark:bg-purple-950/40 dark:text-purple-300',
      border: 'border-purple-300 dark:border-purple-800',
      icon: <AlertOctagon className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
    },
    planned: {
      label: 'Planned',
      bg: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300',
      border: 'border-slate-300 dark:border-slate-700',
      icon: <CalendarClock className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
    },
    completed: {
      label: 'Completed',
      bg: 'bg-blue-50 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300',
      border: 'border-blue-300 dark:border-blue-800',
      icon: <CheckCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
    }
  };

  const c = configs[status] || configs.planned;
  const padding = size === 'sm' ? 'px-2 py-0.5 text-xs' : size === 'lg' ? 'px-3.5 py-1.5 text-sm font-semibold' : 'px-2.5 py-1 text-xs font-medium';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border shadow-xs tracking-tight ${c.bg} ${c.border} ${padding}`}
    >
      {c.icon}
      <span>{c.label}</span>
    </span>
  );
};

export const WorkTypeIcon: React.FC<{ type: WorkType; className?: string }> = ({ type, className = 'w-4 h-4' }) => {
  switch (type) {
    case 'road':
      return <Shovel className={className} />;
    case 'drainage':
    case 'water_pipeline':
      return <Droplets className={className} />;
    case 'electricity':
      return <Zap className={className} />;
    case 'telecom':
      return <Radio className={className} />;
    case 'metro':
      return <TrainTrack className={className} />;
    default:
      return <Shovel className={className} />;
  }
};

export const HealthScoreMeter: React.FC<{ score: number; showText?: boolean }> = ({ score, showText = true }) => {
  let color = 'bg-emerald-500';
  let label = 'Healthy';
  if (score < 40) {
    color = 'bg-rose-500';
    label = 'Critical';
  } else if (score < 70) {
    color = 'bg-amber-500';
    label = 'Sub-optimal';
  }

  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
        <div className={`h-full ${color} transition-all duration-500`} style={{ width: `${score}%` }} />
      </div>
      {showText && (
        <span className="text-xs font-semibold tabular-nums text-slate-700 dark:text-slate-300">
          {score}% <span className="text-[10px] text-slate-400 font-normal">({label})</span>
        </span>
      )}
    </div>
  );
};
