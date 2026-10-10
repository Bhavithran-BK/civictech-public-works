import { Project } from './types';

/**
 * Extracts a safe [lat, lng] point for a project.
 * Handles both GeoJSON [lng, lat] and [lat, lng] formats.
 */
export function getProjectPoint(proj: any): [number, number] {
  if (!proj) return [13.0428, 80.2526];

  // 1. If project has coordinates: { lat, lng }
  if (proj.coordinates && typeof proj.coordinates.lat === 'number' && typeof proj.coordinates.lng === 'number') {
    return [proj.coordinates.lat, proj.coordinates.lng];
  }

  // 2. If project has coordinates: [[lng, lat], ...] or [[lat, lng], ...]
  if (Array.isArray(proj.coordinates) && proj.coordinates.length > 0) {
    const mid = proj.coordinates[Math.floor(proj.coordinates.length / 2)];
    if (Array.isArray(mid) && mid.length >= 2) {
      const a = Number(mid[0]);
      const b = Number(mid[1]);
      // In Chennai/India: longitude is ~80, latitude is ~13
      if (a > 60 && b < 40) {
        return [b, a]; // [lat, lng]
      }
      return [a, b];
    }
  }

  // 3. If project has corridorPath: [[lat, lng], ...]
  if (Array.isArray(proj.corridorPath) && proj.corridorPath.length > 0) {
    const pt = proj.corridorPath[0];
    if (Array.isArray(pt) && pt.length >= 2) {
      const a = Number(pt[0]);
      const b = Number(pt[1]);
      if (a > 60 && b < 40) {
        return [b, a];
      }
      return [a, b];
    }
  }

  return [13.0428, 80.2526]; // Safe fallback Chennai Central
}

/**
 * Extracts corridor polyline path in Leaflet [lat, lng] order.
 */
export function getProjectCorridor(proj: any): [number, number][] {
  if (!proj) return [];

  // Prefer corridorPath if formatted as [lat, lng]
  if (Array.isArray(proj.corridorPath) && proj.corridorPath.length > 0) {
    return proj.corridorPath.map((pt: any) => {
      if (Array.isArray(pt) && pt.length >= 2) {
        const a = Number(pt[0]);
        const b = Number(pt[1]);
        if (a > 60 && b < 40) return [b, a];
        return [a, b];
      }
      return [13.0428, 80.2526];
    });
  }

  // Fallback to coordinates: [[lng, lat], ...]
  if (Array.isArray(proj.coordinates) && proj.coordinates.length > 0) {
    return proj.coordinates.map((pt: any) => {
      if (Array.isArray(pt) && pt.length >= 2) {
        const a = Number(pt[0]);
        const b = Number(pt[1]);
        if (a > 60 && b < 40) return [b, a];
        return [a, b];
      }
      return [13.0428, 80.2526];
    });
  }

  return [];
}

/**
 * Normalizes any project object from backend/cache to ensure all fields are safe.
 */
export function normalizeProject(raw: any): Project {
  if (!raw) return raw;

  const [lat, lng] = getProjectPoint(raw);
  const corridorPath = getProjectCorridor(raw);

  return {
    ...raw,
    referenceCode: raw.referenceCode || raw.id,
    title: raw.title || 'Civic Infrastructure Project',
    purpose: raw.purpose || '',
    type: raw.type || 'road',
    departmentId: raw.departmentId || raw.department_id || 'dept-01',
    departmentName: raw.departmentName || raw.department_name || 'Public Works Department',
    departmentBadgeColor: raw.departmentBadgeColor || '#2563eb',
    contractor: raw.contractor || 'Authorized Municipal Contractor',
    budgetInr: raw.budgetInr ?? raw.budget ?? 0,
    budget: raw.budget ?? raw.budgetInr ?? 0,
    startDate: raw.startDate || raw.start_date || new Date().toISOString().slice(0, 10),
    plannedEndDate: raw.plannedEndDate || raw.end_date || raw.original_end_date || new Date().toISOString().slice(0, 10),
    status: raw.status || 'on_track',
    healthScore: raw.healthScore ?? raw.health_score ?? 100,
    health_score: raw.health_score ?? raw.healthScore ?? 100,
    wardNumber: raw.wardNumber ?? (raw.ward ? parseInt(String(raw.ward).replace(/\D/g, '')) || 1 : 1),
    wardName: raw.wardName || raw.ward || 'Central Ward',
    roadName: raw.roadName || raw.location_name || 'Municipal Road Corridor',
    location_name: raw.location_name || raw.roadName || 'Municipal Road Corridor',
    coordinates: { lat, lng },
    corridorPath,
    lastOfficialUpdateDaysAgo: raw.lastOfficialUpdateDaysAgo ?? 2,
    unresolvedReportsCount: raw.unresolvedReportsCount ?? 0,
    delays: Array.isArray(raw.delays) ? raw.delays : [],
    updates: Array.isArray(raw.updates) ? raw.updates : [],
    citizenReports: Array.isArray(raw.citizenReports) ? raw.citizenReports : (Array.isArray(raw.reports) ? raw.reports : []),
    conflicts: Array.isArray(raw.conflicts) ? raw.conflicts : [],
    latest_delay_reason: raw.latest_delay_reason || (raw.delays?.[0]?.reason ?? null),
  };
}
