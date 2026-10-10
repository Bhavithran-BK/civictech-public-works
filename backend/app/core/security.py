from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional
from fastapi import Depends, Header, HTTPException, status
import jwt
from jwt import PyJWKClient
from jwt.exceptions import (
    DecodeError,
    ExpiredSignatureError,
    InvalidSignatureError,
    InvalidTokenError,
    PyJWKClientError,
    PyJWKError,
)

from app.core.config import settings
from app.core.db import db
from app.core.errors import AppError
from app.schemas.auth import User

# Derive JWKS URL by stripping any trailing slash from SUPABASE_URL
jwks_url = f"{settings.SUPABASE_URL.rstrip('/')}/auth/v1/.well-known/jwks.json"
jwks_client = PyJWKClient(jwks_url)


def create_access_token(user_id: str, email: str, role: str, department_id: Optional[str] = None) -> str:
    """Creates a signed JWT compatible with Supabase Auth structure."""
    expected_issuer = f"{settings.SUPABASE_URL.rstrip('/')}/auth/v1"
    payload = {
        "sub": user_id,
        "email": email,
        "role": role,
        "department_id": department_id,
        "iss": expected_issuer,
        "aud": "authenticated",
        "exp": datetime.now(timezone.utc) + timedelta(days=7),
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, settings.SUPABASE_JWT_SECRET, algorithm="HS256")


def decode_token(token: str) -> Dict[str, Any]:
    """
    Decodes and validates Supabase JWT tokens.
    Supports current ES256 tokens via JWKS and legacy HS256 tokens via SUPABASE_JWT_SECRET.
    Strictly restricts allowed algorithms and validates token issuer.
    """
    # Allow frontend demo fallback tokens only during non-production testing
    if (token.startswith("jwt-demo-") or token == "demo-token") and settings.DEBUG:
        users = db.get_users()
        u = users[0] if users else {
            "id": "usr-01",
            "email": "officer.roads@cityworks.gov",
            "full_name": "K. Rajesh (Executive Engineer)",
            "role": "officer",
            "department_id": "dept-01",
            "department_name": "Greater Chennai Corporation - Roads & Bridges",
        }
        return {
            "sub": u["id"],
            "email": u["email"],
            "role": u["role"],
            "department_id": u.get("department_id"),
            "aud": "authenticated",
        }

    # Safely inspect unverified header without trusting it for signature verification
    try:
        header = jwt.get_unverified_header(token)
    except Exception:
        raise AppError("INVALID_TOKEN", "Malformed or unreadable token header", status.HTTP_401_UNAUTHORIZED)

    if not isinstance(header, dict):
        raise AppError("INVALID_TOKEN", "Invalid token header format", status.HTTP_401_UNAUTHORIZED)

    alg = header.get("alg")
    # Explicit algorithm allowlist: never allow arbitrary or unverified algorithms
    if alg not in ("ES256", "HS256"):
        raise AppError("INVALID_TOKEN", f"Unsupported token algorithm: '{alg}'", status.HTTP_401_UNAUTHORIZED)

    expected_issuer = f"{settings.SUPABASE_URL.rstrip('/')}/auth/v1"

    if alg == "ES256":
        kid = header.get("kid")
        if not kid:
            raise AppError("INVALID_TOKEN", "Missing key ID (kid) in token header", status.HTTP_401_UNAUTHORIZED)

        try:
            signing_key = jwks_client.get_signing_key_from_jwt(token)
            key = signing_key.key
        except (PyJWKClientError, PyJWKError, Exception):
            raise AppError(
                "INVALID_TOKEN",
                "Failed to retrieve signing key for token verification",
                status.HTTP_401_UNAUTHORIZED,
            )

        try:
            payload = jwt.decode(
                token,
                key,
                algorithms=["ES256"],
                options={"verify_exp": True, "verify_signature": True, "verify_aud": False},
            )
        except ExpiredSignatureError:
            raise AppError("TOKEN_EXPIRED", "Authentication token has expired", status.HTTP_401_UNAUTHORIZED)
        except InvalidTokenError:
            raise AppError("INVALID_TOKEN", "Invalid authentication token signature", status.HTTP_401_UNAUTHORIZED)

        # ES256 Supabase Auth tokens must have the expected issuer
        if payload.get("iss") != expected_issuer:
            raise AppError("INVALID_TOKEN", "Token issuer mismatch", status.HTTP_401_UNAUTHORIZED)

    else:  # alg == "HS256"
        try:
            payload = jwt.decode(
                token,
                settings.SUPABASE_JWT_SECRET,
                algorithms=["HS256"],
                options={"verify_exp": True, "verify_signature": True, "verify_aud": False},
            )
        except ExpiredSignatureError:
            raise AppError("TOKEN_EXPIRED", "Authentication token has expired", status.HTTP_401_UNAUTHORIZED)
        except InvalidTokenError:
            raise AppError("INVALID_TOKEN", "Invalid authentication token signature", status.HTTP_401_UNAUTHORIZED)

        # Validate issuer if present in HS256 payload
        if "iss" in payload and payload["iss"] != expected_issuer:
            raise AppError("INVALID_TOKEN", "Token issuer mismatch", status.HTTP_401_UNAUTHORIZED)

    # Verify audience if claim is present
    if "aud" in payload and payload["aud"] not in ["authenticated", "anon"]:
        raise AppError("INVALID_AUDIENCE", "Token audience mismatch", status.HTTP_401_UNAUTHORIZED)

    return payload


def check_department_access(user: User, project_department_id: str) -> None:
    """
    Enforces department-level permission boundary (docs/09-edge-cases.md):
    Officers cannot modify projects outside their department. Administrators can manage any project.
    """
    if user.role == "admin":
        return
    if user.role == "officer":
        if user.department_id and user.department_id != project_department_id:
            raise AppError(
                "FORBIDDEN",
                f"Officer belonging to department '{user.department_id}' cannot modify projects for department '{project_department_id}'.",
                status.HTTP_403_FORBIDDEN,
            )


async def get_current_user(authorization: Optional[str] = Header(None)) -> User:
    """Dependency for extracting the authenticated user from the Authorization header."""
    if not authorization:
        raise AppError("UNAUTHORIZED", "Missing Authorization header", status.HTTP_401_UNAUTHORIZED)

    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token:
        raise AppError("UNAUTHORIZED", "Invalid Bearer token format", status.HTTP_401_UNAUTHORIZED)

    payload = decode_token(token)
    user_id = payload.get("sub")
    email = payload.get("email", "")
    role = payload.get("role", "officer")
    dept_id = payload.get("department_id")

    # Fetch user details from database if available
    user_record = db.get_user_by_id(user_id) if user_id else None
    if not user_record and email:
        user_record = db.get_user_by_email(email)

    if user_record:
        return User(**user_record)

    return User(
        id=user_id or "usr-01",
        email=email,
        full_name=payload.get("name", "Department Officer"),
        role=role,
        department_id=dept_id,
        department_name="Municipal Public Works",
    )


async def get_optional_user(authorization: Optional[str] = Header(None)) -> Optional[User]:
    """Dependency for endpoints allowing both authenticated and public requests."""
    if not authorization:
        return None
    try:
        return await get_current_user(authorization)
    except Exception:
        return None


def require_role(allowed_roles: list[str]):
    """Role-based authorization dependency factory."""
    async def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in allowed_roles:
            raise AppError(
                "FORBIDDEN",
                f"Operation requires one of roles: {', '.join(allowed_roles)}. Current role: {current_user.role}",
                status.HTTP_403_FORBIDDEN,
            )
        return current_user

    return role_checker


require_officer = require_role(["officer", "admin"])
require_admin = require_role(["admin"])
