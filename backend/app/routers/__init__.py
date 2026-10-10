from app.routers.auth import router as auth_router
from app.routers.dashboard import router as dashboard_router
from app.routers.departments import router as departments_router
from app.routers.projects import router as projects_router
from app.routers.reports import router as reports_router
from app.routers.subscriptions import router as subscriptions_router

__all__ = [
    "auth_router",
    "dashboard_router",
    "departments_router",
    "projects_router",
    "reports_router",
    "subscriptions_router",
]
