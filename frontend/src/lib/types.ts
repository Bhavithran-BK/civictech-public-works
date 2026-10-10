export type ProjectStatus = 'on_track' | 'at_risk' | 'delayed' | 'stalled' | 'planned' | 'completed';
export type WorkType = 'road' | 'drainage' | 'water_pipeline' | 'electricity' | 'telecom' | 'metro';
export type ReportKind = 'progress_verified' | 'no_activity' | 'safety_hazard' | 'poor_quality';

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface ProjectUpdate {
  id: string;
  projectId: string;
  author: string;
  authorRole: string;
  note: string;
  createdAt: string;
  photos?: string[];
}

export interface DelayRecord {
  id: string;
  projectId: string;
  reason: string;
  previousEndDate: string;
  newEndDate: string;
  loggedAt: string;
  officerName: string;
}

export interface CitizenReport {
  id: string;
  projectId: string;
  kind: ReportKind;
  description: string;
  photoUrl?: string;
  reportedLat: number;
  reportedLng: number;
  distanceMeters: number;
  verified: boolean;
  createdAt: string;
  reporterHandle: string;
}

export interface ProjectConflict {
  conflictingProjectId: string;
  conflictingProjectTitle: string;
  departmentName: string;
  overlapDistanceMeters: number;
  conflictType: 'spatial_temporal' | 'recent_paving_destruction';
  suggestedAction: string;
  estimatedAvoidableCostInr: number;
}

export interface Project {
  id: string;
  referenceCode: string;
  title: string;
  purpose: string;
  type: WorkType;
  departmentId: string;
  departmentName: string;
  departmentBadgeColor: string;
  contractor: string;
  budgetInr: number;
  startDate: string;
  plannedEndDate: string;
  actualEndDate?: string;
  status: ProjectStatus;
  healthScore: number; // 0 - 100
  wardNumber: number;
  wardName: string;
  roadName: string;
  coordinates: Coordinates;
  corridorPath: [number, number][]; // [lat, lng] array
  lastOfficialUpdateDaysAgo: number;
  unresolvedReportsCount: number;
  delays: DelayRecord[];
  updates: ProjectUpdate[];
  citizenReports: CitizenReport[];
  conflicts?: ProjectConflict[];
}

export interface FilterState {
  search: string;
  type: WorkType | 'all';
  status: ProjectStatus | 'all';
  department: string | 'all';
  ward: string | 'all';
}
