from fastapi import APIRouter, status

from app.core.db import db
from app.core.errors import AppError
from app.schemas.subscriptions import SubscriptionCreateInput, SubscriptionResponse

router = APIRouter(prefix="/projects", tags=["Subscriptions"])


@router.post(
    "/{project_id}/subscribe",
    response_model=SubscriptionResponse,
    summary="Subscribe to project progress notifications",
)
async def subscribe_to_project(
    project_id: str,
    payload: SubscriptionCreateInput,
) -> SubscriptionResponse:
    """Subscribes a resident's email to real-time project milestone and delay alerts."""
    try:
        res = db.add_subscription(project_id=project_id, email=payload.email)
        return SubscriptionResponse(**res)
    except ValueError as e:
        raise AppError("PROJECT_NOT_FOUND", str(e), status.HTTP_404_NOT_FOUND)
