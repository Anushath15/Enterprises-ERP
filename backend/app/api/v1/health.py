from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.api.dependencies import get_db
from app.schemas.common import StandardResponse
from app.core.config import settings

router = APIRouter(tags=["Health Monitoring"])

@router.get("/", response_model=StandardResponse)
def health_check():
    """
    Basic application health check. 
    Verifies that the API process is running and responding.
    """
    return StandardResponse(success=True, message="API is healthy", data={"status": "OK"})

@router.get("/version", response_model=StandardResponse)
def get_version():
    """
    Returns the current deployed API version.
    """
    return StandardResponse(success=True, message="Version retrieved", data={"version": settings.VERSION})

@router.get("/database", response_model=StandardResponse)
def database_health_check(db: Session = Depends(get_db)):
    """
    Verifies database connectivity by executing a simple SELECT 1.
    """
    try:
        db.execute(text("SELECT 1"))
        return StandardResponse(success=True, message="Database is healthy", data={"status": "OK"})
    except Exception as e:
        return StandardResponse(success=False, message="Database connection failed", errors={"detail": str(e)})
