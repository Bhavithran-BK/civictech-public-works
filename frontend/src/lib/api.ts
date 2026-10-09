import { Project, CitizenReport, DelayRecord, ProjectUpdate } from './types';
import { INITIAL_PROJECTS } from './mock-data';

const STORAGE_KEY = 'digonce_projects_cache';

export function getProjects(): Project[] {
  if (typeof window === 'undefined') return INITIAL_PROJECTS;
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_PROJECTS));
    return INITIAL_PROJECTS;
  }
  try {
    return JSON.parse(stored);
  } catch {
    return INITIAL_PROJECTS;
  }
}

export function getProjectById(id: string): Project | undefined {
  const projects = getProjects();
  return projects.find((p) => p.id === id);
}

export function addCitizenReport(
  projectId: string,
  report: Omit<CitizenReport, 'id' | 'createdAt' | 'verified' | 'distanceMeters'>,
  projectCoord: { lat: number; lng: number }
): { success: boolean; report: CitizenReport; newHealthScore: number; status: Project['status'] } {
  const projects = getProjects();
  const projectIndex = projects.findIndex((p) => p.id === projectId);
  if (projectIndex === -1) throw new Error('Project not found');

  const p = projects[projectIndex];

  // PostGIS-like Harversine calculation for client verification
  const distance = calculateDistanceMeters(
    report.reportedLat,
    report.reportedLng,
    projectCoord.lat,
    projectCoord.lng
  );

  const isVerified = distance <= 500; // within 500 meters of the road site

  const newReport: CitizenReport = {
    ...report,
    id: `rep-${Date.now()}`,
    createdAt: new Date().toISOString().split('T')[0],
    verified: isVerified,
    distanceMeters: Math.round(distance)
  };

  p.citizenReports.unshift(newReport);

  // Recalculate health score & status flip rule as specified in 05-backend-structure.md
  let penalty = 0;
  if (newReport.kind === 'no_activity' && isVerified) penalty += 18;
  if (newReport.kind === 'safety_hazard' && isVerified) penalty += 15;
  if (newReport.kind === 'poor_quality' && isVerified) penalty += 10;
  if (newReport.kind === 'progress_verified' && isVerified) penalty -= 8;

  p.healthScore = Math.max(5, Math.min(100, p.healthScore - penalty));

  // Count unverified / no activity reports
  const noActivityCount = p.citizenReports.filter(
    (r) => r.kind === 'no_activity' && r.verified
  ).length;

  if (p.healthScore < 35 || noActivityCount >= 3) {
    p.status = 'stalled';
  } else if (p.healthScore < 65) {
    p.status = 'delayed';
  } else if (p.healthScore < 75) {
    p.status = 'at_risk';
  } else {
    p.status = 'on_track';
  }

  p.unresolvedReportsCount += 1;
  projects[projectIndex] = p;

  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  }

  return {
    success: true,
    report: newReport,
    newHealthScore: p.healthScore,
    status: p.status
  };
}

export function logDelay(
  projectId: string,
  reason: string,
  newEndDate: string,
  officerName: string
): Project {
  if (!reason.trim()) throw new Error('Reason is mandatory as per DigOnce civic policy');

  const projects = getProjects();
  const p = projects.find((x) => x.id === projectId);
  if (!p) throw new Error('Project not found');

  const delayRecord: DelayRecord = {
    id: `del-${Date.now()}`,
    projectId,
    reason,
    previousEndDate: p.plannedEndDate,
    newEndDate,
    loggedAt: new Date().toISOString().split('T')[0],
    officerName
  };

  p.delays.unshift(delayRecord);
  p.plannedEndDate = newEndDate;
  p.status = 'delayed';
  p.healthScore = Math.max(20, p.healthScore - 15);

  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  }

  return p;
}

function calculateDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}
