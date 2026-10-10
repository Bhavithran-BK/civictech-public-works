import logging
from fastapi import APIRouter, status

from app.core.db import db
from app.core.errors import AppError
from app.schemas.subscriptions import SubscriptionCreateInput, SubscriptionResponse
from app.services.notifications import notification_service

logger = logging.getLogger("uvicorn")

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
        logger.info(f"📧 [SUBSCRIPTION REGISTERED] {payload.email} -> Project '{project_id}'")

        if res.get("message") == "Subscribed successfully":
            project = db.get_project_by_id(project_id)
            project_title = project.get("title", project_id) if project else project_id
            notification_service.dispatch_subscription_confirmation(
                project_id=project_id,
                project_title=project_title,
                email=payload.email,
            )

        return SubscriptionResponse(**res)
    except ValueError as e:
        raise AppError("PROJECT_NOT_FOUND", str(e), status.HTTP_404_NOT_FOUND)
