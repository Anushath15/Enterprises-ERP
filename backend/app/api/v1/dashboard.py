from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.api.dependencies import get_db
from app.schemas.common import StandardResponse, success_response
from app.schemas.finance import DashboardSummaryResponse
from app.services.finance import FinanceService

router = APIRouter()

@router.get("/summary", response_model=StandardResponse[DashboardSummaryResponse])
def get_dashboard_summary(db: Session = Depends(get_db)):
    summary = FinanceService.get_dashboard_summary(db)
    return success_response(data=summary)
