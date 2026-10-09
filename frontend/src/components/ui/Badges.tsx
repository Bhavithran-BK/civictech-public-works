import React from 'react';
import { ProjectStatus, WorkType } from '@/lib/types';
import { 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
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
    { label: string; bg: string; text: string; border: string; icon: React.ReactNode }
  > = {
    on_track: {
      label: 'ON TRACK',
      bg: 'bg-emerald-50 text-emerald-800',
      border: 'border-emerald-300',
      text: 'text-emerald-800',
      icon: <CheckCircle2 className="w-3 h-3 text-emerald-700" />
    },
    at_risk: {
      label: 'AT RISK',
      bg: 'bg-amber-50 text-amber-900',
      border: 'border-amber-300',
      text: 'text-amber-900',
      icon: <Clock className="w-3 h-3 text-amber-700" />
    },
    delayed: {
      label: 'DELAYED',
      bg: 'bg-rose-50 text-rose-900',
      border: 'border-rose-300',
      text: 'text-rose-900',
      icon: <AlertTriangle className="w-3 h-3 text-rose-700" />
    },
    stalled: {
      label: 'STALLED',
      bg: 'bg-purple-50 text-purple-900',
      border: 'border-purple-300',
      text: 'text-purple-900',
      icon: <AlertOctagon className="w-3 h-3 text-purple-700" />
    },
    planned: {
      label: 'PLANNED',
      bg: 'bg-slate-100 text-slate-800',
      border: 'border-slate-300',
      text: 'text-slate-800',
      icon: <CalendarClock className="w-3 h-3 text-slate-700" />
    },
    completed: {
      label: 'COMPLETED',
      bg: 'bg-blue-50 text-blue-900',
      border: 'border-blue-300',
      text: 'text-blue-900',
      icon: <CheckCheck className="w-3 h-3 text-blue-700" />
    }
  };

  const c = configs[status] || configs.planned;
  const padding = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : size === 'lg' ? 'px-2.5 py-1 text-xs' : 'px-2 py-0.5 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1 rounded font-bold uppercase tracking-wider border ${c.bg} ${c.border} ${c.text} ${padding}`}
    >
      {c.icon}
      <span>{c.label}</span>
    </span>
  );
};

export const WorkTypeIcon: React.FC<{ type: WorkType; className?: string }> = ({ type, className = 'w-3.5 h-3.5' }) => {
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
  let barColor = 'bg-emerald-600';
  let label = 'Normal';
  if (score < 40) {
    barColor = 'bg-rose-600';
    label = 'Critical Delay';
  } else if (score < 70) {
    barColor = 'bg-amber-600';
    label = 'Slipping';
  }

  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 bg-slate-200 rounded-xs overflow-hidden">
        <div className={`h-full ${barColor}`} style={{ width: `${score}%` }} />
      </div>
      {showText && (
        <span className="text-xs font-semibold tabular-nums text-slate-700">
          {score}% <span className="text-[10px] text-slate-500 font-normal">({label})</span>
        </span>
      )}
    </div>
  );
};
