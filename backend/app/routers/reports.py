from fastapi import APIRouter, status

from app.core.db import db
from app.core.errors import AppError
from app.schemas.reports import Report, ReportCreateInput

router = APIRouter(prefix="/projects", tags=["Citizen Reports"])


@router.post(
    "/{project_id}/reports",
    response_model=Report,
    status_code=status.HTTP_201_CREATED,
    summary="Submit citizen field verification report",
)
async def submit_citizen_report(
    project_id: str,
    payload: ReportCreateInput,
) -> Report:
    """
    Submits a geo-tagged citizen verification report.
    Validates proximity to the project site using GPS coordinates.
    """
    try:
        report_data = db.add_citizen_report(
            project_id=project_id,
            kind=payload.kind,
            lat=payload.lat,
            lng=payload.lng,
            photo_url=payload.photo_url,
            notes=payload.notes,
            reporter_contact=payload.reporter_contact,
        )
        return Report(**report_data)
    except ValueError as e:
        raise AppError("PROJECT_NOT_FOUND", str(e), status.HTTP_404_NOT_FOUND)
