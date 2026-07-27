from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List
from app.api.dependencies import get_db
from app.schemas.common import StandardResponse, success_response, PaginationMeta
from app.schemas.finance import DailyClosingCreate, DailyClosingResponse
from app.services.finance import FinanceService
from app.repositories.finance import daily_closing_repo

router = APIRouter()

@router.post("", response_model=StandardResponse[DailyClosingResponse], status_code=201)
def create_daily_closing(closing_in: DailyClosingCreate, db: Session = Depends(get_db)):
    closing = FinanceService.calculate_daily_closing(db, business_date=closing_in.business_date, physical_cash=closing_in.physical_cash)
    return success_response(data=closing, message="Daily closing completed successfully")

@router.get("", response_model=StandardResponse[List[DailyClosingResponse]])
def list_daily_closings(
    db: Session = Depends(get_db),
    page: int = Query(1, ge=1),
    page_size: int = Query(100, ge=1, le=1000)
):
    skip = (page - 1) * page_size
    closings, total = daily_closing_repo.get_all_closings(db, skip=skip, limit=page_size)
    meta = PaginationMeta(page=page, page_size=page_size, total_items=total, total_pages=(total + page_size - 1) // page_size if total > 0 else 1)
    return success_response(data=closings, meta=meta)
