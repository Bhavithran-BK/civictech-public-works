import { Project, CitizenReport, DelayRecord } from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export async function fetchProjects(workType?: string, status?: string): Promise<Project[]> {
  try {
    const params = new URLSearchParams();
    if (workType && workType !== 'all') params.append('type', workType);
    if (status && status !== 'all') params.append('status', status);

    const url = `${API_BASE_URL}/projects${params.toString() ? `?${params.toString()}` : ''}`;
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch projects');
    return await res.json();
  } catch (error) {
    console.error('API Error in fetchProjects, fallback to cache:', error);
    // If backend isn't reached, try local cache
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('digonce_projects_cache');
      if (stored) return JSON.parse(stored);
    }
    return [];
  }
}

export async function fetchProjectById(id: string): Promise<Project | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/projects/${id}`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Project not found');
    return await res.json();
  } catch (error) {
    console.error('API Error in fetchProjectById:', error);
    return null;
  }
}

export async function postCitizenReport(
  projectId: string,
  report: {
    kind: string;
    description: string;
    reportedLat: number;
    reportedLng: number;
    reporterHandle: string;
  }
): Promise<{ success: boolean; report: CitizenReport; newHealthScore: number; status: Project['status'] }> {
  const res = await fetch(`${API_BASE_URL}/projects/${projectId}/reports`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(report)
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to submit report');
  }

  return await res.json();
}

export async function postProjectDelay(
  projectId: string,
  delay: {
    reason: string;
    newEndDate: string;
    officerName: string;
  }
): Promise<{ success: boolean; project: Project }> {
  const res = await fetch(`${API_BASE_URL}/projects/${projectId}/delays`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(delay)
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to log delay');
  }

  return await res.json();
}
