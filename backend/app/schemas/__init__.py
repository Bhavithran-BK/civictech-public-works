from typing import List, Optional
from pydantic import BaseModel, ConfigDict

from app.schemas.common import (
    ConflictType,
    ProjectStatus,
    ProjectType,
    ReportKind,
    UserRole,
    normalize_project_type,
)
from app.schemas.auth import Department, LoginInput, LoginResponse, User
from app.schemas.conflicts import (
    ConflictCheckInput,
    ConflictCheckResult,
    ConflictingProject,
    JointWindow,
)
from app.schemas.dashboard import DashboardSummary, StatusCounts
from app.schemas.projects import (
    DelayCreateInput,
    DelayRecord,
    Project,
    ProjectBase,
    ProjectCreateInput,
    ProjectUpdateCreateInput,
    ProjectUpdateInput,
    ProjectUpdateRecord,
)
from app.schemas.reports import Report, ReportCreateInput
from app.schemas.subscriptions import SubscriptionCreateInput, SubscriptionResponse


class ProjectDetail(Project):
    model_config = ConfigDict(populate_by_name=True, extra="ignore")

    updates: List[ProjectUpdateRecord] = []
    delays: List[DelayRecord] = []
    reports: List[Report] = []


__all__ = [
    "ConflictType",
    "ProjectStatus",
    "ProjectType",
    "ReportKind",
    "UserRole",
    "normalize_project_type",
    "Department",
    "User",
    "LoginInput",
    "LoginResponse",
    "ConflictCheckInput",
    "ConflictCheckResult",
    "ConflictingProject",
    "JointWindow",
    "DashboardSummary",
    "StatusCounts",
    "DelayCreateInput",
    "DelayRecord",
    "Project",
    "ProjectBase",
    "ProjectCreateInput",
    "ProjectDetail",
    "ProjectUpdateCreateInput",
    "ProjectUpdateInput",
    "ProjectUpdateRecord",
    "Report",
    "ReportCreateInput",
    "SubscriptionCreateInput",
    "SubscriptionResponse",
]
