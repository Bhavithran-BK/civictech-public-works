from fastapi import APIRouter, Depends

from app.core.db import db
from app.core.security import get_optional_user
from app.schemas.dashboard import DashboardSummary

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/summary", response_model=DashboardSummary, summary="Get municipal dashboard executive summary")
async def get_dashboard_summary(_user=Depends(get_optional_user)) -> DashboardSummary:
    """Returns aggregated high-level KPIs and conflict prevention metrics."""
    summary_data = db.get_dashboard_summary()
    return DashboardSummary(**summary_data)
