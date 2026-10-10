from datetime import date, datetime
from typing import Any, List, Optional
from pydantic import AliasChoices, BaseModel, ConfigDict, Field, computed_field, field_validator, model_validator

from app.schemas.common import ProjectStatus, ProjectType, normalize_project_type


class ProjectBase(BaseModel):
    model_config = ConfigDict(populate_by_name=True, extra="ignore")

    title: str = Field(..., min_length=3, max_length=255)
    purpose: str = Field(..., min_length=5)
    type: str
    department_id: str = Field(..., validation_alias=AliasChoices("department_id", "departmentId"))
    contractor: str = Field(..., min_length=2)
    budget: float = Field(..., gt=0, validation_alias=AliasChoices("budget", "budgetInr"))
    start_date: str = Field(..., validation_alias=AliasChoices("start_date", "startDate"))
    end_date: str = Field(..., validation_alias=AliasChoices("end_date", "endDate", "plannedEndDate"))
    location_name: str = Field(..., min_length=2, validation_alias=AliasChoices("location_name", "locationName", "roadName"))
    ward: Optional[str] = Field(None, validation_alias=AliasChoices("ward", "wardName"))
    coordinates: List[List[float]] = Field(..., validation_alias=AliasChoices("coordinates", "corridorPath"))

    @field_validator("type", mode="before")
    @classmethod
    def validate_type(cls, v: str) -> str:
        canonical = normalize_project_type(str(v))
        valid_types = {"road", "drain", "pipeline", "electrical", "telecom"}
        if canonical not in valid_types:
            raise ValueError(f"Invalid project type: {v}. Must be one of {valid_types}")
        return canonical

    @field_validator("coordinates")
    @classmethod
    def validate_coordinates(cls, v: List[List[float]]) -> List[List[float]]:
        if len(v) < 2:
            raise ValueError("Coordinates must contain at least 2 vertices for a LineString corridor")
        for pt in v:
            if len(pt) < 2:
                raise ValueError("Each coordinate point must have [longitude, latitude] or [latitude, longitude]")
        return v

    @model_validator(mode="after")
    def validate_date_ordering(self) -> "ProjectBase":
        try:
            sd = datetime.strptime(self.start_date[:10], "%Y-%m-%d").date()
            ed = datetime.strptime(self.end_date[:10], "%Y-%m-%d").date()
            if ed < sd:
                raise ValueError("end_date cannot be earlier than start_date")
        except ValueError as err:
            if "end_date cannot be earlier than start_date" in str(err):
                raise err
        return self


class ProjectCreateInput(ProjectBase):
    pass


class ProjectUpdateInput(BaseModel):
    model_config = ConfigDict(populate_by_name=True, extra="ignore")

    title: Optional[str] = None
    purpose: Optional[str] = None
    contractor: Optional[str] = None
    budget: Optional[float] = Field(None, gt=0, validation_alias=AliasChoices("budget", "budgetInr"))
    status: Optional[ProjectStatus] = None


class ProjectUpdateRecord(BaseModel):
    model_config = ConfigDict(populate_by_name=True, extra="ignore")

    id: str
    project_id: str = Field(..., validation_alias=AliasChoices("project_id", "projectId"))
    author_id: Optional[str] = Field(None, validation_alias=AliasChoices("author_id", "authorId"))
    note: str
    created_at: str = Field(..., validation_alias=AliasChoices("created_at", "createdAt"))

    @computed_field
    @property
    def projectId(self) -> str:
        return self.project_id


class ProjectUpdateCreateInput(BaseModel):
    model_config = ConfigDict(populate_by_name=True, extra="ignore")

    note: str = Field(..., min_length=3)


class DelayRecord(BaseModel):
    model_config = ConfigDict(populate_by_name=True, extra="ignore")

    id: str
    project_id: str = Field(..., validation_alias=AliasChoices("project_id", "projectId"))
    reason: str
    old_end_date: str = Field(..., validation_alias=AliasChoices("old_end_date", "oldEndDate", "previousEndDate"))
    new_end_date: str = Field(..., validation_alias=AliasChoices("new_end_date", "newEndDate"))
    logged_by: Optional[str] = Field(None, validation_alias=AliasChoices("logged_by", "loggedBy", "officerName"))
    created_at: str = Field(..., validation_alias=AliasChoices("created_at", "createdAt", "loggedAt"))

    @computed_field
    @property
    def projectId(self) -> str:
        return self.project_id

    @computed_field
    @property
    def newEndDate(self) -> str:
        return self.new_end_date


class DelayCreateInput(BaseModel):
    model_config = ConfigDict(populate_by_name=True, extra="ignore")

    reason: str = Field(..., min_length=5, description="Mandatory detailed reason for project delay")
    new_end_date: str = Field(..., validation_alias=AliasChoices("new_end_date", "newEndDate"), description="Revised completion date")

    @field_validator("reason")
    @classmethod
    def check_non_empty_reason(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Delay reason is mandatory and cannot be empty or whitespace.")
        return v.strip()


class Project(BaseModel):
    model_config = ConfigDict(populate_by_name=True, extra="ignore")

    id: str
    title: str
    purpose: str
    type: ProjectType
    department_id: str = Field(..., validation_alias=AliasChoices("department_id", "departmentId"))
    department_name: Optional[str] = Field(None, validation_alias=AliasChoices("department_name", "departmentName"))
    contractor: str
    budget: float = Field(..., validation_alias=AliasChoices("budget", "budgetInr"))
    start_date: str = Field(..., validation_alias=AliasChoices("start_date", "startDate"))
    end_date: str = Field(..., validation_alias=AliasChoices("end_date", "endDate", "plannedEndDate"))
    original_end_date: str = Field(..., validation_alias=AliasChoices("original_end_date", "originalEndDate"))
    status: ProjectStatus
    health_score: int = Field(..., ge=0, le=100, validation_alias=AliasChoices("health_score", "healthScore"))
    location_name: str = Field(..., validation_alias=AliasChoices("location_name", "locationName", "roadName"))
    ward: Optional[str] = Field(None, validation_alias=AliasChoices("ward", "wardName"))
    latest_delay_reason: Optional[str] = Field(None, validation_alias=AliasChoices("latest_delay_reason", "latestDelayReason"))
    coordinates: List[List[float]] = Field(..., validation_alias=AliasChoices("coordinates", "corridorPath"))

    # Computed fields for backward compatibility with both frontend branches
    @computed_field
    @property
    def departmentId(self) -> str:
        return self.department_id

    @computed_field
    @property
    def departmentName(self) -> Optional[str]:
        return self.department_name

    @computed_field
    @property
    def budgetInr(self) -> float:
        return self.budget

    @computed_field
    @property
    def startDate(self) -> str:
        return self.start_date

    @computed_field
    @property
    def plannedEndDate(self) -> str:
        return self.end_date

    @computed_field
    @property
    def healthScore(self) -> int:
        return self.health_score

    @computed_field
    @property
    def corridorPath(self) -> List[List[float]]:
        return self.coordinates
