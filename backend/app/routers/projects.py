import io
from typing import List, Optional
from fastapi import APIRouter, Depends, Query, Response, status
import qrcode

from app.core.config import settings
from app.core.db import db
from app.core.errors import AppError
from app.core.security import check_department_access, get_optional_user, require_officer
from app.schemas.auth import User
from app.schemas.conflicts import ConflictCheckInput, ConflictCheckResult
from app.schemas import (
    DelayCreateInput,
    Project,
    ProjectCreateInput,
    ProjectDetail,
    ProjectUpdateCreateInput,
    ProjectUpdateInput,
    ProjectUpdateRecord,
)
from app.services.conflict_engine import check_spatial_temporal_conflicts
from app.services.notifications import notification_service

router = APIRouter(prefix="/projects", tags=["Projects"])


@router.get("", response_model=List[Project], summary="List projects with optional filtering")
async def list_projects(
    type: Optional[str] = Query(None, description="Filter by utility type (road, drain, pipeline, etc.)"),
    department_id: Optional[str] = Query(None, description="Filter by department UUID"),
    status: Optional[str] = Query(None, description="Filter by status (on_track, at_risk, delayed, planned, stalled)"),
    bbox: Optional[str] = Query(None, description="Bounding box filter minLng,minLat,maxLng,maxLat"),
    limit: int = Query(50, ge=1, le=200, description="Pagination limit"),
    offset: int = Query(0, ge=0, description="Pagination offset"),
) -> List[Project]:
    """Retrieves all public works projects matching query filters with pagination."""
    projects_data = db.get_projects(
        project_type=type,
        department_id=department_id,
        status=status,
        bbox=bbox,
    )
    paginated = projects_data[offset : offset + limit]
    return [Project(**p) for p in paginated]


@router.get("/conflict-check", include_in_schema=False)
@router.post(
    "/conflict-check",
    response_model=ConflictCheckResult,
    summary="Check for spatial proximity and schedule clashes",
)
async def conflict_check(
    payload: ConflictCheckInput,
    _user=Depends(get_optional_user),
) -> ConflictCheckResult:
    """
    Core DigOnce Spatio-Temporal Conflict Detection Engine.
    Detects concurrent corridor trenching and road excavation moratorium clashes.
    """
    all_projects = db.get_projects()
    result = check_spatial_temporal_conflicts(
        new_corridor=payload.coordinates,
        new_start=payload.start_date,
        new_end=payload.end_date,
        new_dept_id=payload.department_id,
        existing_projects=all_projects,
        buffer_meters=payload.buffer_meters,
    )
    return result


@router.get("/{project_id}", response_model=ProjectDetail, summary="Get project detail by ID")
async def get_project(project_id: str) -> ProjectDetail:
    """Retrieves complete project audit record including progress notes, delays, and citizen reports."""
    project_data = db.get_project_by_id(project_id)
    if not project_data:
        raise AppError("PROJECT_NOT_FOUND", f"Project with ID '{project_id}' was not found", status.HTTP_404_NOT_FOUND)
    return ProjectDetail(**project_data)


@router.post(
    "",
    response_model=Project,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new infrastructure project",
)
async def create_project(
    payload: ProjectCreateInput,
    user: User = Depends(require_officer),
) -> Project:
    """
    Officer or Admin creates a new public works infrastructure project.
    Validates LineString coordinates, dates, and department authorization.
    """
    check_department_access(user, payload.department_id)
    data = payload.model_dump(by_alias=False)
    created = db.create_project(data)
    return Project(**created)


@router.patch("/{project_id}", response_model=Project, summary="Update project metadata")
async def update_project(
    project_id: str,
    payload: ProjectUpdateInput,
    user: User = Depends(require_officer),
) -> Project:
    """Updates mutable project attributes such as budget, contractor, or status."""
    existing = db.get_project_by_id(project_id)
    if not existing:
        raise AppError("PROJECT_NOT_FOUND", f"Project with ID '{project_id}' was not found", status.HTTP_404_NOT_FOUND)

    check_department_access(user, existing["department_id"])

    updates = payload.model_dump(exclude_unset=True)
    updated = db.update_project(project_id, updates)
    return Project(**updated)


@router.post(
    "/{project_id}/delays",
    response_model=Project,
    summary="Log project delay notice (mandatory reason)",
)
async def log_project_delay(
    project_id: str,
    payload: DelayCreateInput,
    user: User = Depends(require_officer),
) -> Project:
    """
    Logs an official delay notice with mandatory justification.
    Enforces department permission boundary, recalculates health score, and alerts subscribers.
    """
    existing = db.get_project_by_id(project_id)
    if not existing:
        raise AppError("PROJECT_NOT_FOUND", f"Project with ID '{project_id}' was not found", status.HTTP_404_NOT_FOUND)

    check_department_access(user, existing["department_id"])

    try:
        updated_project = db.log_delay(
            project_id=project_id,
            reason=payload.reason,
            new_end_date=payload.new_end_date,
            logged_by=user.id,
        )

        # Notify subscribers
        subscribers = [s["email"] for s in db.subscriptions.get(project_id, [])]
        if subscribers:
            notification_service.dispatch_delay_alert(
                project_id=project_id,
                project_title=updated_project["title"],
                reason=payload.reason,
                new_end_date=payload.new_end_date,
                subscriber_emails=subscribers,
            )

        return Project(**updated_project)
    except ValueError as e:
        raise AppError("PROJECT_NOT_FOUND", str(e), status.HTTP_404_NOT_FOUND)


@router.post(
    "/{project_id}/updates",
    response_model=ProjectUpdateRecord,
    summary="Add official progress update",
)
async def add_project_update(
    project_id: str,
    payload: ProjectUpdateCreateInput,
    user: User = Depends(require_officer),
) -> ProjectUpdateRecord:
    """Logs an official engineering progress update on the project and notifies subscribers."""
    existing = db.get_project_by_id(project_id)
    if not existing:
        raise AppError("PROJECT_NOT_FOUND", f"Project with ID '{project_id}' was not found", status.HTTP_404_NOT_FOUND)

    check_department_access(user, existing["department_id"])

    try:
        record = db.add_project_update(
            project_id=project_id,
            note=payload.note,
            author_id=user.id,
        )

        # Notify subscribers
        subscribers = [s["email"] for s in db.subscriptions.get(project_id, [])]
        if subscribers:
            notification_service.dispatch_project_update(
                project_id=project_id,
                project_title=existing["title"],
                note=payload.note,
                subscriber_emails=subscribers,
            )

        return ProjectUpdateRecord(**record)
    except ValueError as e:
        raise AppError("PROJECT_NOT_FOUND", str(e), status.HTTP_404_NOT_FOUND)


@router.get(
    "/{project_id}/qr",
    summary="Generate QR code for project public page",
    responses={
        200: {
            "content": {"image/png": {}},
            "description": "PNG image of the QR code.",
        }
    },
)
async def get_project_qr(project_id: str):
    """Generates a scannable QR code directing citizens to the public project dossier."""
    project_data = db.get_project_by_id(project_id)
    if not project_data:
        raise AppError("PROJECT_NOT_FOUND", f"Project with ID '{project_id}' was not found", status.HTTP_404_NOT_FOUND)

    frontend_base = "http://localhost:3000"
    if isinstance(settings.CORS_ORIGINS, list) and settings.CORS_ORIGINS:
        frontend_base = settings.CORS_ORIGINS[0]

    target_url = f"{frontend_base}/projects/{project_id}"

    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=8,
        border=2,
    )
    qr.add_data(target_url)
    qr.make(fit=True)
    img = qr.make_image(fill_color="#1e293b", back_color="#ffffff")

    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return Response(content=buf.getvalue(), media_type="image/png")
