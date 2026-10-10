from typing import List
from fastapi import APIRouter

from app.core.db import db
from app.schemas.auth import Department

router = APIRouter(prefix="/departments", tags=["Departments"])


@router.get("", response_model=List[Department], summary="List all municipal departments")
async def list_departments() -> List[Department]:
    """Retrieves all participating civic departments and authorities."""
    depts = db.get_departments()
    return [Department(**d) for d in depts]
