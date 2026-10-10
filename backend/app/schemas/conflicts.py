from typing import List, Optional
from pydantic import AliasChoices, BaseModel, ConfigDict, Field, computed_field


class ConflictCheckInput(BaseModel):
    model_config = ConfigDict(populate_by_name=True, extra="ignore")

    start_date: str = Field(..., validation_alias=AliasChoices("start_date", "startDate"))
    end_date: str = Field(..., validation_alias=AliasChoices("end_date", "endDate", "plannedEndDate"))
    coordinates: List[List[float]] = Field(..., validation_alias=AliasChoices("coordinates", "corridorPath"))
    buffer_meters: float = Field(50.0, validation_alias=AliasChoices("buffer_meters", "bufferMeters"))
    department_id: Optional[str] = Field(None, validation_alias=AliasChoices("department_id", "departmentId"))


class ConflictingProject(BaseModel):
    model_config = ConfigDict(populate_by_name=True, extra="ignore")

    project_id: str = Field(..., validation_alias=AliasChoices("project_id", "conflictingProjectId"))
    title: str = Field(..., validation_alias=AliasChoices("title", "conflictingProjectTitle"))
    department: str = Field(..., validation_alias=AliasChoices("department", "departmentName"))
    start_date: str = Field(..., validation_alias=AliasChoices("start_date", "startDate"))
    end_date: str = Field(..., validation_alias=AliasChoices("end_date", "endDate", "plannedEndDate"))
    distance_meters: float = Field(..., validation_alias=AliasChoices("distance_meters", "overlapDistanceMeters"))
    conflict_type: str = Field(..., validation_alias=AliasChoices("conflict_type", "conflictType"))
    description: Optional[str] = Field(None, validation_alias=AliasChoices("description", "suggestedAction"))
    estimated_avoidable_cost_inr: Optional[float] = Field(None, validation_alias=AliasChoices("estimated_avoidable_cost_inr", "estimatedAvoidableCostInr"))

    @computed_field
    @property
    def conflictingProjectId(self) -> str:
        return self.project_id

    @computed_field
    @property
    def conflictingProjectTitle(self) -> str:
        return self.title

    @computed_field
    @property
    def departmentName(self) -> str:
        return self.department

    @computed_field
    @property
    def overlapDistanceMeters(self) -> float:
        return self.distance_meters

    @computed_field
    @property
    def conflictType(self) -> str:
        return self.conflict_type

    @computed_field
    @property
    def suggestedAction(self) -> Optional[str]:
        return self.description

    @computed_field
    @property
    def estimatedAvoidableCostInr(self) -> Optional[float]:
        return self.estimated_avoidable_cost_inr


class JointWindow(BaseModel):
    model_config = ConfigDict(populate_by_name=True, extra="ignore")

    start_date: str = Field(..., validation_alias=AliasChoices("start_date", "jointWindowStart"))
    end_date: str = Field(..., validation_alias=AliasChoices("end_date", "jointWindowEnd"))
    recommendation: str = Field(..., validation_alias=AliasChoices("recommendation", "suggestedAction"))

    @computed_field
    @property
    def jointWindowStart(self) -> str:
        return self.start_date

    @computed_field
    @property
    def jointWindowEnd(self) -> str:
        return self.end_date

    @computed_field
    @property
    def suggestedAction(self) -> str:
        return self.recommendation


class ConflictCheckResult(BaseModel):
    model_config = ConfigDict(populate_by_name=True, extra="ignore")

    has_conflict: bool
    clash_count: int
    conflicting_projects: List[ConflictingProject] = []
    suggested_joint_window: Optional[JointWindow] = None
