from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date
from app.api.dependencies import get_db
from app.schemas.common import StandardResponse, success_response
from app.schemas.report import (
    SalesReportItem, PurchasesReportItem, ExpenseReportItem,
    InventoryReportItem, CustomerOutstandingItem, DealerOutstandingItem
)
from app.services.report import ReportService
from app.exceptions.handlers import BusinessException

router = APIRouter()

def validate_dates(start_date: Optional[date], end_date: Optional[date]):
    if start_date and end_date and start_date > end_date:
        raise BusinessException("start_date cannot be after end_date", status_code=400)

@router.get("/sales", response_model=StandardResponse[List[SalesReportItem]])
def get_sales_report(
    db: Session = Depends(get_db),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    customer_id: Optional[int] = Query(None)
):
    validate_dates(start_date, end_date)
    report = ReportService.generate_sales_report(db, start_date, end_date, customer_id)
    return success_response(data=report)

@router.get("/purchases", response_model=StandardResponse[List[PurchasesReportItem]])
def get_purchases_report(
    db: Session = Depends(get_db),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    dealer_id: Optional[int] = Query(None)
):
    validate_dates(start_date, end_date)
    report = ReportService.generate_purchases_report(db, start_date, end_date, dealer_id)
    return success_response(data=report)

@router.get("/expenses", response_model=StandardResponse[List[ExpenseReportItem]])
def get_expenses_report(
    db: Session = Depends(get_db),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None)
):
    validate_dates(start_date, end_date)
    report = ReportService.generate_expenses_report(db, start_date, end_date)
    return success_response(data=report)

@router.get("/inventory", response_model=StandardResponse[List[InventoryReportItem]])
def get_inventory_report(
    db: Session = Depends(get_db),
    low_stock_only: bool = Query(False)
):
    report = ReportService.generate_inventory_report(db, low_stock_only)
    return success_response(data=report)

@router.get("/customers", response_model=StandardResponse[List[CustomerOutstandingItem]])
def get_customer_outstanding_report(db: Session = Depends(get_db)):
    report = ReportService.generate_customer_outstanding_report(db)
    return success_response(data=report)

@router.get("/dealers", response_model=StandardResponse[List[DealerOutstandingItem]])
def get_dealer_outstanding_report(db: Session = Depends(get_db)):
    report = ReportService.generate_dealer_outstanding_report(db)
    return success_response(data=report)
