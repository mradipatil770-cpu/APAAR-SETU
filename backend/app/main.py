import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings, mask_sensitive_url
from app.database.session import check_db_ready
from app.api import (
    routes_health,
    routes_auth,
    routes_uploads,
    routes_dashboard,
    routes_anomalies,
    routes_reports,
    routes_aicte,
    routes_verifications,
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("apaarsetu")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup check
    logger.info("Initializing APAARSetu API service...")
    masked_db = mask_sensitive_url(settings.DATABASE_URL)
    logger.info(f"Environment: {settings.ENVIRONMENT} | DB Target: {masked_db}")

    # Check database readiness on startup
    if settings.DATABASE_URL:
        ready, msg = check_db_ready()
        if ready:
            logger.info("Supabase/PostgreSQL connection verified successfully.")
        else:
            logger.warning(f"Database readiness check warning: {msg}")
    else:
        logger.warning(
            "DATABASE_URL is not set. Service will respond to health checks, "
            "but transactional endpoints will fail until Supabase credentials are provided."
        )
    yield
    # Shutdown logic
    logger.info("Shutting down APAARSetu API service...")


app = FastAPI(
    title="APAARSetu API",
    description="APAAR ID-based student data management and verification prototype for AICTE institutions.",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# Restrictive CORS configuration for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Safe global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception during {request.method} {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "An internal server error occurred. Please contact the administrator."},
    )

# Include Routers
app.include_router(routes_health.router)
app.include_router(routes_auth.router)
app.include_router(routes_uploads.router)
app.include_router(routes_dashboard.router)
app.include_router(routes_anomalies.router)
app.include_router(routes_reports.router)
app.include_router(routes_aicte.router)
app.include_router(routes_verifications.router)

