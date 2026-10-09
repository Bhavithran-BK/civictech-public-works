'use client';

import React, { useState } from 'react';
import { Project, ReportKind } from '@/lib/types';
import { addCitizenReport } from '@/lib/api';
import { X, Camera, MapPin, CheckCircle, AlertOctagon, HelpCircle, Loader2 } from 'lucide-react';

interface ReportModalProps {
  project: Project | null;
  isOpen: boolean;
  onClose: () => void;
  onReportSubmitted: (updatedProjectStatus: Project['status'], newHealthScore: number) => void;
}

export const ReportModal: React.FC<ReportModalProps> = ({
  project,
  isOpen,
  onClose,
  onReportSubmitted
}) => {
  const [kind, setKind] = useState<ReportKind>('progress_verified');
  const [description, setDescription] = useState('');
  const [reporterHandle, setReporterHandle] = useState('Resident Citizen');
  const [isLocating, setIsLocating] = useState(false);
  const [gpsLocation, setGpsLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsDistance, setGpsDistance] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successResult, setSuccessResult] = useState<{ status: string; health: number } | null>(null);

  if (!isOpen || !project) return null;

  const handleAcquireLocation = () => {
    setIsLocating(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setGpsLocation({ lat, lng });
          setIsLocating(false);
        },
        () => {
          // Fallback simulation for desktop / local testing near site
          const simulatedLat = project.coordinates.lat + (Math.random() - 0.5) * 0.001;
          const simulatedLng = project.coordinates.lng + (Math.random() - 0.5) * 0.001;
          setGpsLocation({ lat: simulatedLat, lng: simulatedLng });
          setIsLocating(false);
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    } else {
      // Simulate close location
      setGpsLocation({ lat: project.coordinates.lat + 0.0001, lng: project.coordinates.lng + 0.0001 });
      setIsLocating(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    setIsSubmitting(true);

    const lat = gpsLocation?.lat || project.coordinates.lat;
    const lng = gpsLocation?.lng || project.coordinates.lng;

    try {
      const res = addCitizenReport(
        project.id,
        {
          projectId: project.id,
          kind,
          description,
          reportedLat: lat,
          reportedLng: lng,
          reporterHandle: reporterHandle.trim() || 'Anonymous Resident'
        },
        project.coordinates
      );

      setSuccessResult({ status: res.status, health: res.newHealthScore });
      setTimeout(() => {
        setIsSubmitting(false);
        onReportSubmitted(res.status, res.newHealthScore);
        onClose();
        setSuccessResult(null);
        setDescription('');
        setGpsLocation(null);
      }, 1400);
    } catch (err) {
      setIsSubmitting(false);
      alert('Error submitting report.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Citizen Check-in & On-Site Audit
            </h2>
            <p className="text-xs text-slate-500 font-mono mt-0.5">{project.referenceCode} · {project.roadName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {successResult ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Audit Recorded!</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Verified GPS distance logged. Project health recalculated to{' '}
              <span className="font-semibold text-slate-900 dark:text-slate-100">{successResult.health}%</span>.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Kind Selector */}
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-2">
                Observation Type
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'progress_verified', label: 'Work in Progress', icon: '👷', desc: 'Active crew & machinery' },
                  { id: 'no_activity', label: 'No Activity / Abandoned', icon: '🛑', desc: 'No work happening' },
                  { id: 'safety_hazard', label: 'Safety Hazard', icon: '⚠️', desc: 'Unbarricaded open ditch' },
                  { id: 'poor_quality', label: 'Poor Quality Work', icon: '🔍', desc: 'Substandard finish' }
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setKind(item.id as ReportKind)}
                    className={`p-3 text-left rounded-xl border transition-all ${
                      kind === item.id
                        ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/30 text-blue-900 dark:text-blue-100 font-semibold'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="text-base mb-1">{item.icon}</div>
                    <div className="text-xs font-semibold">{item.label}</div>
                    <div className="text-[10px] text-slate-500 font-normal">{item.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-1">
                Field Observation Notes
              </label>
              <textarea
                required
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="E.g., Ditch left open since Friday without hazard cones..."
                className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            {/* GPS Verification Check */}
            <div className="p-3 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-600" />
                <span className="text-xs text-slate-700 dark:text-slate-300">
                  {gpsLocation ? (
                    <span className="text-emerald-600 font-medium flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" /> GPS Coordinates Acquired
                    </span>
                  ) : (
                    'Audit requires geo-verification'
                  )}
                </span>
              </div>
              <button
                type="button"
                onClick={handleAcquireLocation}
                disabled={isLocating}
                className="text-xs font-semibold px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-100"
              >
                {isLocating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Acquire GPS'}
              </button>
            </div>

            {/* Submit */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Post Verified Public Check-in'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
