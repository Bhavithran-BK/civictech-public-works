'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { fetchProjectById, postCitizenReport } from '@/lib/api';
import { Project, ReportKind } from '@/lib/types';
import { ArrowLeft, Camera, MapPin, CheckCircle, AlertTriangle, ShieldCheck, Loader2 } from 'lucide-react';
import Link from 'next/link';

function ReportContent() {
  const params = useParams();
  const router = useRouter();
  const projectId = params?.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [kind, setKind] = useState<ReportKind>('no_activity');
  const [description, setDescription] = useState('');
  const [reporterHandle, setReporterHandle] = useState('');
  const [gpsLocation, setGpsLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string; verified: boolean } | null>(null);

  useEffect(() => {
    if (projectId) {
      fetchProjectById(projectId).then((p) => {
        if (p) setProject(p);
      });
    }
  }, [projectId]);

  const handleAcquireLocation = () => {
    setIsLocating(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setGpsLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setIsLocating(false);
        },
        () => {
          // Fallback simulation near project coordinates
          if (project) {
            setGpsLocation({
              lat: project.coordinates.lat + (Math.random() - 0.5) * 0.001,
              lng: project.coordinates.lng + (Math.random() - 0.5) * 0.001
            });
          }
          setIsLocating(false);
        },
        { enableHighAccuracy: true, timeout: 6000 }
      );
    } else {
      if (project) {
        setGpsLocation({ lat: project.coordinates.lat, lng: project.coordinates.lng });
      }
      setIsLocating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project || !description.trim()) return;

    setIsSubmitting(true);
    const lat = gpsLocation?.lat || project.coordinates.lat;
    const lng = gpsLocation?.lng || project.coordinates.lng;

    try {
      const res = await postCitizenReport(project.id, {
        kind,
        description,
        reportedLat: lat,
        reportedLng: lng,
        reporterHandle: reporterHandle.trim() || 'Anonymous Resident'
      });

      setResult({
        success: true,
        message: res.report.verified
          ? `Verified! Your audit was within ${res.report.distanceMeters}m of the site. Project health updated to ${res.newHealthScore}%.`
          : `Audit submitted. Note: GPS location was ${res.report.distanceMeters}m away from the work zone (>500m threshold).`,
        verified: res.report.verified
      });

      setTimeout(() => {
        router.push(`/projects/${project.id}`);
      }, 2000);
    } catch {
      alert('Error recording citizen report.');
      setIsSubmitting(false);
    }
  };

  if (!project) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center text-xs text-slate-500">
        Loading project details...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans">
      <header className="sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link
            href={`/projects/${project.id}`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900"
          >
            <ArrowLeft className="w-4 h-4" /> Cancel
          </Link>
          <span className="text-xs font-bold font-mono text-slate-600 dark:text-slate-300">
            {project.referenceCode}
          </span>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 py-6 w-full flex-1">
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-5">
          <div>
            <h1 className="text-lg font-black tracking-tight text-slate-900 dark:text-slate-100">
              Citizen On-Site Check-in
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              {project.title} · <span className="font-medium text-slate-700 dark:text-slate-300">{project.roadName}</span>
            </p>
          </div>

          {result ? (
            <div className="p-6 text-center space-y-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl">
              <CheckCircle className="w-10 h-10 text-emerald-600 mx-auto" />
              <h2 className="text-sm font-bold text-emerald-900 dark:text-emerald-200">Public Audit Registered</h2>
              <p className="text-xs text-emerald-800 dark:text-emerald-300">{result.message}</p>
              <span className="text-[10px] text-slate-400 block">Redirecting to project page...</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 block mb-2">
                  What did you observe on site?
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'no_activity', label: 'No Activity / Stalled', icon: '🛑', sub: 'Trench left abandoned' },
                    { id: 'progress_verified', label: 'Work in Progress', icon: '👷', sub: 'Crew & equipment active' },
                    { id: 'safety_hazard', label: 'Hazardous / Open Ditch', icon: '⚠️', sub: 'No warning reflectors' },
                    { id: 'poor_quality', label: 'Substandard Paving', icon: '🔍', sub: 'Uneven or flawed repair' }
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setKind(item.id as ReportKind)}
                      className={`p-3 text-left rounded-xl border transition-all ${
                        kind === item.id
                          ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 font-semibold shadow-xs'
                          : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                      }`}
                    >
                      <div className="text-base mb-1">{item.icon}</div>
                      <div className="text-xs font-semibold">{item.label}</div>
                      <div className="text-[10px] text-slate-500">{item.sub}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 block mb-1">
                  Observation Details
                </label>
                <textarea
                  required
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe current road conditions, barricades, or contractor presence..."
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 block mb-1">
                  Your Handle (Optional)
                </label>
                <input
                  type="text"
                  value={reporterHandle}
                  onChange={(e) => setReporterHandle(e.target.value)}
                  placeholder="E.g., Ward 172 Resident or Community Club"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                />
              </div>

              {/* Geo-location Verification Box */}
              <div className="p-3 bg-slate-50 dark:bg-slate-950/80 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-blue-600" />
                  <span className="text-xs text-slate-700 dark:text-slate-300">
                    {gpsLocation ? (
                      <span className="text-emerald-600 font-medium flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" /> GPS Coordinates Attached
                      </span>
                    ) : (
                      'Attach GPS for official verification'
                    )}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleAcquireLocation}
                  disabled={isLocating}
                  className="text-xs font-semibold px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-100"
                >
                  {isLocating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Get GPS'}
                </button>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit Public Check-in'}
              </button>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}

export default function ReportPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center text-xs text-slate-500">
          Loading check-in portal...
        </div>
      }
    >
      <ReportContent />
    </Suspense>
  );
}
