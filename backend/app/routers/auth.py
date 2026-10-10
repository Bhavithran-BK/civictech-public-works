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
    password = credentials.password.strip()
    if len(password) < 6:
        raise AppError("INVALID_CREDENTIALS", "Password must be at least 6 characters long.", status.HTTP_400_BAD_REQUEST)

    user_record = db.get_user_by_email(email)

    if not user_record:
        # Check if email belongs to recognized municipal agency domains
        valid_domains = ("cityworks.gov", "chennaicorporation.gov.in", "gcc.gov.in", "cmwssb.tn.gov.in", "tangedco.gov.in")
        if any(email.endswith(f"@{dom}") or email.endswith(f".{dom}") for dom in valid_domains):
            is_admin = "admin" in email or "commissioner" in email
            dept_id = "dept-01"
            dept_name = "Greater Chennai Corporation - Roads & Bridges"
            if "water" in email or "cmwssb" in email:
                dept_id = "dept-02"
                dept_name = "Chennai Metro Water Supply & Sewerage Board"
            elif "power" in email or "tangedco" in email or "elec" in email:
                dept_id = "dept-03"
                dept_name = "TANGEDCO - Electricity Board"
            elif "drain" in email or "swd" in email:
                dept_id = "dept-04"
                dept_name = "GCC - Storm Water Drain Department"

            user_record = {
                "id": f"usr-{email.split('@')[0]}",
                "email": email,
                "full_name": "Municipal Commissioner (Admin)" if is_admin else f"Officer ({dept_name.split(' - ')[-1]})",
                "role": "admin" if is_admin else "officer",
                "department_id": dept_id,
                "department_name": dept_name,
            }
        else:
            raise AppError("INVALID_CREDENTIALS", "Unauthorized: Email is not registered in the municipal authority directory.", status.HTTP_401_UNAUTHORIZED)

    token = create_access_token(
        user_id=user_record["id"],
        email=user_record["email"],
        role=user_record["role"],
        department_id=user_record.get("department_id"),
    )

    user = User(**user_record)
    return LoginResponse(access_token=token, token_type="bearer", user=user)
