from fastapi import APIRouter, status

from app.core.db import db
from app.core.errors import AppError
from app.core.security import create_access_token
from app.schemas.auth import LoginInput, LoginResponse, User

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/login", response_model=LoginResponse, summary="Officer / Admin login")
async def login(credentials: LoginInput) -> LoginResponse:
    """Authenticates an officer or administrator and returns a JWT access token."""
    email = credentials.email.strip().lower()
    user_record = db.get_user_by_email(email)

    # For hackathon/demo purposes, if user not found, create or map officer
    if not user_record:
        if "admin" in email:
            user_record = {
                "id": "usr-admin",
                "email": email,
                "full_name": "Municipal Commissioner (Admin)",
                "role": "admin",
                "department_id": "dept-01",
                "department_name": "Greater Chennai Corporation",
            }
        else:
            user_record = {
                "id": "usr-officer",
                "email": email,
                "full_name": "Department Field Officer",
                "role": "officer",
                "department_id": "dept-01",
                "department_name": "Greater Chennai Corporation - Roads & Bridges",
            }

    token = create_access_token(
        user_id=user_record["id"],
        email=user_record["email"],
        role=user_record["role"],
        department_id=user_record.get("department_id"),
    )

    user = User(**user_record)
    return LoginResponse(access_token=token, token_type="bearer", user=user)
