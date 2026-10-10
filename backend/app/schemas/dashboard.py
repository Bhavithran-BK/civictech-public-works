from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field

from app.schemas.projects import Project


class StatusCounts(BaseModel):
    on_track: int = 0
    at_risk: int = 0
    delayed: int = 0
    planned: int = 0
    completed: int = 0
    stalled: int = 0


class DashboardSummary(BaseModel):
    model_config = ConfigDict(populate_by_name=True, extra="ignore")

    total_projects: int
    status_counts: StatusCounts
    overdue_projects_count: int = 0
    open_reports_count: int = 0
    unresponsive_reports_72h: int = 0
    duplicate_dig_savings_est_inr: float = 0.0
    recent_conflicts_prevented: int = 0
    overdue_projects: Optional[List[Project]] = None
