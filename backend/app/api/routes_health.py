from fastapi import APIRouter, status, Response
from app.database.session import check_db_ready

router = APIRouter()


@router.get("/")
def root():
    return {
        "message": "Welcome to APAARSetu API",
        "docs": "/docs",
        "health": "/api/v1/health",
        "ready": "/api/v1/ready",
    }


@router.get("/api/v1/health")
def health():
    return {
        "status": "ok",
        "service": "APAARSetu API",
    }


@router.get("/api/v1/ready")
def readiness(response: Response):
    is_ready, msg = check_db_ready()
    if not is_ready:
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
        return {
            "status": "not_ready",
            "database": "unreachable",
            "message": msg,
        }
    return {
        "status": "ready",
        "database": "connected",
        "message": msg,
    }

