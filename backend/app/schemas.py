from pydantic import BaseModel, Field
from typing import List, Optional, Literal

WorkType = Literal['road', 'drainage', 'water_pipeline', 'electricity', 'telecom', 'metro']
ProjectStatus = Literal['on_track', 'at_risk', 'delayed', 'stalled', 'planned', 'completed']
ReportKind = Literal['progress_verified', 'no_activity', 'safety_hazard', 'poor_quality']

class Coordinates(BaseModel):
    lat: float
    lng: float

class CitizenReportCreate(BaseModel):
    kind: ReportKind
    description: str
    reportedLat: float
    reportedLng: float
    reporterHandle: Optional[str] = "Anonymous Resident"

class CitizenReportOut(BaseModel):
    id: str
    projectId: str
    kind: ReportKind
    description: str
    reportedLat: float
    reportedLng: float
    distanceMeters: int
    verified: bool
    createdAt: str
    reporterHandle: str

class DelayCreate(BaseModel):
    reason: str
    newEndDate: str
    officerName: str

class DelayOut(BaseModel):
    id: str
    projectId: str
    reason: str
    previousEndDate: str
    newEndDate: str
    loggedAt: str
    officerName: str

class ProjectConflictOut(BaseModel):
    conflictingProjectId: str
    conflictingProjectTitle: str
    departmentName: str
    overlapDistanceMeters: float
    conflictType: str
    suggestedAction: str
    estimatedAvoidableCostInr: float
    jointWindowStart: Optional[str] = None
    jointWindowEnd: Optional[str] = None

class ProjectCreate(BaseModel):
    referenceCode: str
    title: str
    purpose: str
    type: WorkType
    departmentId: str
    departmentName: str
    contractor: str
    budgetInr: float
    startDate: str
    plannedEndDate: str
    wardNumber: int
    wardName: str
    roadName: str
    coordinates: Coordinates
    corridorPath: List[List[float]]

class ProjectOut(BaseModel):
    id: str
    referenceCode: str
    title: str
    purpose: str
    type: WorkType
    departmentId: str
    departmentName: str
    contractor: str
    budgetInr: float
    startDate: str
    plannedEndDate: str
    status: ProjectStatus
    healthScore: int
    wardNumber: int
    wardName: str
    roadName: str
    coordinates: Coordinates
    corridorPath: List[List[float]]
    lastOfficialUpdateDaysAgo: int
    unresolvedReportsCount: int
    delays: List[DelayOut] = []
    citizenReports: List[CitizenReportOut] = []
    conflicts: List[ProjectConflictOut] = []
