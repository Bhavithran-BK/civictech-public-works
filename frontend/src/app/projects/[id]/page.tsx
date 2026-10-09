'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { fetchProjectById, postProjectDelay } from '@/lib/api';
import { Project } from '@/lib/types';
import { StatusBadge, HealthScoreMeter, WorkTypeIcon } from '@/components/ui/Badges';
import { ReportModal } from '@/components/project/ReportModal';
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  AlertTriangle, 
  Building2, 
  User, 
  MapPin, 
  QrCode, 
  Printer, 
  Share2, 
  History, 
  CheckCircle2, 
  AlertOctagon, 
  ChevronRight,
  ShieldCheck,
  FileText
} from 'lucide-react';
import QRCode from 'qrcode';
import Link from 'next/link';
import { Suspense } from 'react';

function ProjectDetailContent() {
  const params = useParams();
  const router = useRouter();
  const projectId = params?.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [showDelayModal, setShowDelayModal] = useState(false);
  const [delayReason, setDelayReason] = useState('');
  const [newEndDate, setNewEndDate] = useState('');
  const [officerName, setOfficerName] = useState('Ward Executive Engineer');
  const [activeTab, setActiveTab] = useState<'timeline' | 'delays' | 'reports'>('timeline');

  const loadProject = React.useCallback(async () => {
    if (!projectId) return;
    const p = await fetchProjectById(projectId);
    if (p) {
      setProject(p);
      setNewEndDate(p.plannedEndDate);
      const publicUrl = typeof window !== 'undefined' ? window.location.href : `https://digonce.gov.in/projects/${projectId}`;
      QRCode.toDataURL(publicUrl, { width: 220, margin: 1 })
        .then((url: string) => setQrDataUrl(url))
        .catch(() => {});
    }
  }, [projectId]);

  useEffect(() => {
    loadProject();
  }, [loadProject]);

  if (!project) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center text-xs text-slate-500">
        Loading civic record dossier...
      </div>
    );
  }

  const handleDelaySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!delayReason.trim()) {
      alert('Mandatory delay reason required per municipal accountability policy');
      return;
    }
    try {
      const res = await postProjectDelay(project.id, {
        reason: delayReason,
        newEndDate,
        officerName
      });
      setProject({ ...res.project });
      setShowDelayModal(false);
      setDelayReason('');
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans">
      {/* Top Bar */}
      <header className="sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Ward Registry
          </Link>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100"
            >
              <Printer className="w-3.5 h-3.5" /> Print Dossier
            </button>
            <button
              onClick={() => setIsReportModalOpen(true)}
              className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-xs"
            >
              Field Check-in
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 w-full flex-1 space-y-6">
        {/* Project Header Dossier */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2.5 py-1 rounded">
                {project.referenceCode}
              </span>
              <span className="text-xs text-slate-500 font-medium">Ward {project.wardNumber} · {project.wardName}</span>
            </div>
            <StatusBadge status={project.status} size="lg" />
          </div>

          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              {project.title}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-3xl leading-relaxed">
              {project.purpose}
            </p>
          </div>

          {/* Key Facts Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-100 dark:border-slate-800/80">
            <div>
              <span className="text-[10px] font-semibold uppercase text-slate-400 block">Responsible Department</span>
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-0.5 block">
                {project.departmentName}
              </span>
            </div>
            <div>
              <span className="text-[10px] font-semibold uppercase text-slate-400 block">Sanctioned Contractor</span>
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-0.5 block truncate">
                {project.contractor}
              </span>
            </div>
            <div>
              <span className="text-[10px] font-semibold uppercase text-slate-400 block">Sanctioned Budget</span>
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-0.5 block">
                ₹{(project.budgetInr / 100000).toFixed(1)} Lakhs
              </span>
            </div>
            <div>
              <span className="text-[10px] font-semibold uppercase text-slate-400 block">Target Completion Date</span>
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100 mt-0.5 block">
                {project.plannedEndDate}
              </span>
            </div>
          </div>
        </div>

        {/* 2-Column Content: Left Dossier / Right QR Site Board */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column (8 cols): Health, Tabs, Timeline, Delays, Reports */}
          <div className="lg:col-span-8 space-y-4">
            {/* Project Health Score Card */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Public Health & Accountability Score
                </span>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Computed from schedule adherence, citizen check-in ratios, and official response cadence.
                </p>
              </div>
              <div className="text-right">
                <span className="text-3xl font-black text-slate-900 dark:text-slate-100 tabular-nums">
                  {project.healthScore}%
                </span>
                <div className="mt-1">
                  <HealthScoreMeter score={project.healthScore} showText={false} />
                </div>
              </div>
            </div>

            {/* Clash Alert banner if applicable */}
            {project.conflicts && project.conflicts.length > 0 && (
              <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-2xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-rose-800 dark:text-rose-300 font-bold text-xs uppercase tracking-wider">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  Dig-Once Spatio-Temporal Trench Clash
                </div>
                <p className="text-xs text-rose-700 dark:text-rose-400 leading-relaxed">
                  {project.conflicts[0].suggestedAction}
                </p>
                <div className="text-[11px] font-semibold text-rose-800 dark:text-rose-300">
                  Estimated Avoidable Municipal Repaving Cost: ₹{(project.conflicts[0].estimatedAvoidableCostInr / 100000).toFixed(1)} Lakhs
                </div>
              </div>
            )}

            {/* Audit History Tabs */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
              <div className="flex items-center border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 px-4">
                <button
                  onClick={() => setActiveTab('timeline')}
                  className={`py-3 px-3 text-xs font-bold border-b-2 transition-all ${
                    activeTab === 'timeline'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Official Log ({project.updates.length})
                </button>
                <button
                  onClick={() => setActiveTab('delays')}
                  className={`py-3 px-3 text-xs font-bold border-b-2 transition-all ${
                    activeTab === 'delays'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Delay Reasons ({project.delays.length})
                </button>
                <button
                  onClick={() => setActiveTab('reports')}
                  className={`py-3 px-3 text-xs font-bold border-b-2 transition-all ${
                    activeTab === 'reports'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Citizen Check-ins ({project.citizenReports.length})
                </button>
              </div>

              <div className="p-5">
                {activeTab === 'timeline' && (
                  <div className="space-y-4">
                    {project.updates.length === 0 ? (
                      <p className="text-xs text-slate-400">No official milestone progress logged yet.</p>
                    ) : (
                      project.updates.map((upd) => (
                        <div key={upd.id} className="border-l-2 border-blue-500 pl-3 space-y-1">
                          <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                            {upd.note}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            Logged by {upd.author} ({upd.authorRole}) · {upd.createdAt}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {activeTab === 'delays' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between pb-2">
                      <span className="text-xs text-slate-500">
                        Rule: A project end-date extension strictly requires a public verifiable justification.
                      </span>
                      <button
                        onClick={() => setShowDelayModal(true)}
                        className="text-xs font-semibold px-2.5 py-1 bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 rounded-lg hover:bg-rose-100"
                      >
                        Log Extension Notice
                      </button>
                    </div>

                    {project.delays.length === 0 ? (
                      <p className="text-xs text-slate-400">No delay notices filed. Project running as scheduled.</p>
                    ) : (
                      project.delays.map((del) => (
                        <div key={del.id} className="p-3 bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900 rounded-xl space-y-1 text-xs">
                          <div className="font-semibold text-rose-900 dark:text-rose-200">
                            Extended from {del.previousEndDate} to {del.newEndDate}
                          </div>
                          <div className="text-slate-700 dark:text-slate-300">
                            Reason: "{del.reason}"
                          </div>
                          <div className="text-[10px] text-slate-400">
                            Filed by {del.officerName} on {del.loggedAt}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {activeTab === 'reports' && (
                  <div className="space-y-3">
                    {project.citizenReports.length === 0 ? (
                      <p className="text-xs text-slate-400">No citizen check-ins recorded yet. Be the first to audit!</p>
                    ) : (
                      project.citizenReports.map((rep) => (
                        <div key={rep.id} className="p-3 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                              {rep.kind === 'no_activity' ? '🛑 Abandoned / Inactive' : rep.kind === 'safety_hazard' ? '⚠️ Open Hazard' : '👷 Work Ongoing'}
                            </span>
                            <span className="text-[10px] text-emerald-600 font-mono">
                              ✓ Verified ({rep.distanceMeters}m from site)
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-400">{rep.description}</p>
                          <div className="text-[10px] text-slate-400">
                            Submitted by {rep.reporterHandle} · {rep.createdAt}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column (4 cols): On-Site QR Board & Physical Transparency */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border-2 border-dashed border-slate-300 dark:border-slate-700 shadow-xs text-center space-y-3">
              <div className="flex items-center justify-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                <QrCode className="w-4 h-4 text-blue-600" />
                Physical Site Notice QR Code
              </div>

              {qrDataUrl ? (
                <div className="p-3 bg-white rounded-xl inline-block shadow-xs border border-slate-200 mx-auto">
                  <img src={qrDataUrl} alt="Project QR Code" className="w-40 h-40" />
                </div>
              ) : (
                <div className="w-40 h-40 bg-slate-100 rounded-xl mx-auto animate-pulse" />
              )}

              <p className="text-[11px] text-slate-500 leading-tight">
                Mandatory QR notice affixed to physical construction barricades. Scanning grants citizens immediate access to this audit page.
              </p>

              <button
                type="button"
                onClick={() => {
                  const link = document.createElement('a');
                  link.download = `${project.referenceCode}-site-qr.png`;
                  link.href = qrDataUrl;
                  link.click();
                }}
                className="w-full text-xs font-semibold py-2 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl transition-colors"
              >
                Download Notice Placard
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Citizen Geotagged Audit Modal */}
      <ReportModal
        project={project}
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        onReportSubmitted={() => {
          const fresh = getProjectById(project.id);
          if (fresh) setProject(fresh);
        }}
      />

      {/* Delay Logging Modal */}
      {showDelayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Log Mandatory Delay Justification
            </h3>
            <form onSubmit={handleDelaySubmit} className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-500 uppercase block mb-1">
                  New Target Completion Date
                </label>
                <input
                  type="date"
                  required
                  value={newEndDate}
                  onChange={(e) => setNewEndDate(e.target.value)}
                  className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-500 uppercase block mb-1">
                  Public Reason & Technical Justification
                </label>
                <textarea
                  required
                  rows={3}
                  value={delayReason}
                  onChange={(e) => setDelayReason(e.target.value)}
                  placeholder="E.g., Utility pipeline clash or unforeseen geological strata..."
                  className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDelayModal(false)}
                  className="text-xs px-3 py-1.5 text-slate-500 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="text-xs font-semibold px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg"
                >
                  Confirm & Post Delay
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ProjectDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center text-xs text-slate-500">
          Loading civic record dossier...
        </div>
      }
    >
      <ProjectDetailContent />
    </Suspense>
  );
}
