from typing import Optional
from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.schemas.common import UserRole


class Department(BaseModel):
    model_config = ConfigDict(populate_by_name=True, extra="ignore")

    id: str
    name: str
    code: str
    type: str
    contact_email: Optional[str] = None


class User(BaseModel):
    model_config = ConfigDict(populate_by_name=True, extra="ignore")

    id: str
    email: str
    full_name: Optional[str] = None
    role: UserRole
    department_id: Optional[str] = Field(None, alias="departmentId")
    department_name: Optional[str] = Field(None, alias="departmentName")


class LoginInput(BaseModel):
    model_config = ConfigDict(populate_by_name=True, extra="ignore")

    email: str
    password: str


class LoginResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True, extra="ignore")

    access_token: str
    token_type: str = "bearer"
    user: User
