from typing import Optional
from pydantic import AliasChoices, BaseModel, ConfigDict, Field, computed_field

from app.schemas.common import ReportKind


class ReportCreateInput(BaseModel):
    model_config = ConfigDict(populate_by_name=True, extra="ignore")

    kind: ReportKind
    photo_url: Optional[str] = Field(None, validation_alias=AliasChoices("photo_url", "photoUrl"))
    lat: float = Field(..., validation_alias=AliasChoices("lat", "reportedLat"))
    lng: float = Field(..., validation_alias=AliasChoices("lng", "reportedLng"))
    notes: Optional[str] = Field(None, validation_alias=AliasChoices("notes", "description"))
    reporter_contact: Optional[str] = Field("Anonymous Resident", validation_alias=AliasChoices("reporter_contact", "reporterHandle"))


class Report(BaseModel):
    model_config = ConfigDict(populate_by_name=True, extra="ignore")

    id: str
    project_id: str = Field(..., validation_alias=AliasChoices("project_id", "projectId"))
    kind: ReportKind
    photo_url: Optional[str] = Field(None, validation_alias=AliasChoices("photo_url", "photoUrl"))
    lat: float = Field(..., validation_alias=AliasChoices("lat", "reportedLat"))
    lng: float = Field(..., validation_alias=AliasChoices("lng", "reportedLng"))
    distance_m: float = Field(..., validation_alias=AliasChoices("distance_m", "distanceMeters"))
    verified: bool = False
    notes: Optional[str] = Field(None, validation_alias=AliasChoices("notes", "description"))
    reporter_contact: Optional[str] = Field(None, validation_alias=AliasChoices("reporter_contact", "reporterHandle"))
    created_at: str = Field(..., validation_alias=AliasChoices("created_at", "createdAt"))

    @computed_field
    @property
    def projectId(self) -> str:
        return self.project_id

    @computed_field
    @property
    def distanceMeters(self) -> float:
        return self.distance_m

    @computed_field
    @property
    def description(self) -> Optional[str]:
        return self.notes
