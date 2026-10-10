from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.core.config import settings
from app.core.errors import (
    AppError,
    app_error_handler,
    http_exception_handler,
    validation_exception_handler,
)

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="DigOnce Public Works Coordination, Conflict Detection & Citizen Accountability Platform",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)

# Configure CORS
origins = settings.CORS_ORIGINS if isinstance(settings.CORS_ORIGINS, list) else [settings.CORS_ORIGINS]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if origins else ["*"],
    allow_origin_regex=r"^https?:\/\/(.*\.onrender\.com|.*\.vercel\.app|localhost(:\d+)?|127\.0\.0\.1(:\d+)?)$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register uniform error handlers
app.add_exception_handler(AppError, app_error_handler)
app.add_exception_handler(StarletteHTTPException, http_exception_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)

# Include v1 Routers
from app.routers import (
    auth_router,
    dashboard_router,
    departments_router,
    projects_router,
    reports_router,
    subscriptions_router,
)

app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(dashboard_router, prefix=settings.API_V1_STR)
app.include_router(departments_router, prefix=settings.API_V1_STR)
app.include_router(projects_router, prefix=settings.API_V1_STR)
app.include_router(reports_router, prefix=settings.API_V1_STR)
app.include_router(subscriptions_router, prefix=settings.API_V1_STR)


# Root and Health check endpoints
@app.get("/", tags=["Root"], summary="API Root Status")
async def root():
    return {
        "name": settings.PROJECT_NAME,
        "status": "online",
        "documentation": "/docs",
        "api_v1": settings.API_V1_STR,
    }

@app.get("/health", tags=["Health"], summary="Health check endpoint")
@app.get(f"{settings.API_V1_STR}/health", tags=["Health"], summary="API v1 Health check endpoint")
async def health_check():
    """Returns application health status."""
    return {"status": "ok"}


from app.services.scheduler import start_scheduler, scheduler

@app.on_event("startup")
def on_startup():
    start_scheduler()

@app.on_event("shutdown")
def on_shutdown():
    if scheduler.running:
        scheduler.shutdown()
