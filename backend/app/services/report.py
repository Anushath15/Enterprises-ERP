from sqlalchemy.orm import Session
from datetime import date
from typing import Optional, List
from app.repositories.report import report_repo
from app.schemas.report import (
    SalesReportItem, PurchasesReportItem, ExpenseReportItem, 
    InventoryReportItem, CustomerOutstandingItem, DealerOutstandingItem
)

class ReportService:
    @staticmethod
    def generate_sales_report(db: Session, start_date: Optional[date] = None, end_date: Optional[date] = None, customer_id: Optional[int] = None) -> List[SalesReportItem]:
        results = report_repo.get_sales_summary(db, start_date, end_date, customer_id)
        return [
            SalesReportItem(
                date=str(row.dt),
                total_sales=row.total or 0.0,
                total_tax=row.tax or 0.0,
                total_discount=row.discount or 0.0,
                invoice_count=row.count or 0
            ) for row in results
        ]

    @staticmethod
    def generate_purchases_report(db: Session, start_date: Optional[date] = None, end_date: Optional[date] = None, dealer_id: Optional[int] = None) -> List[PurchasesReportItem]:
        results = report_repo.get_purchases_summary(db, start_date, end_date, dealer_id)
        return [
            PurchasesReportItem(
                date=str(row.dt),
                total_purchases=row.total or 0.0,
                total_tax=row.tax or 0.0,
                total_discount=row.discount or 0.0,
                invoice_count=row.count or 0
            ) for row in results
        ]

    @staticmethod
    def generate_expenses_report(db: Session, start_date: Optional[date] = None, end_date: Optional[date] = None) -> List[ExpenseReportItem]:
        results = report_repo.get_expenses_summary(db, start_date, end_date)
        return [
            ExpenseReportItem(
                category_name=row.category,
                total_amount=row.total or 0.0,
                expense_count=row.count or 0
            ) for row in results
        ]

    @staticmethod
    def generate_inventory_report(db: Session, low_stock_only: bool = False) -> List[InventoryReportItem]:
        results = report_repo.get_inventory_summary(db, low_stock_only)
        return [
            InventoryReportItem(
                product_code=row.product_code,
                name=row.name,
                category_name=row.category_name,
                brand_name=row.brand_name,
                current_stock=row.current_stock or 0.0,
                minimum_stock=row.minimum_stock or 0.0,
                stock_value=row.stock_value or 0.0
            ) for row in results
        ]

    @staticmethod
    def generate_customer_outstanding_report(db: Session) -> List[CustomerOutstandingItem]:
        results = report_repo.get_customer_outstanding(db)
        return [
            CustomerOutstandingItem(
                customer_code=row.customer_code,
                name=row.name,
                phone=row.phone,
                outstanding_balance=row.outstanding_balance or 0.0
            ) for row in results
        ]

    @staticmethod
    def generate_dealer_outstanding_report(db: Session) -> List[DealerOutstandingItem]:
        results = report_repo.get_dealer_outstanding(db)
        return [
            DealerOutstandingItem(
                dealer_code=row.dealer_code,
                name=row.name,
                phone=row.phone,
                outstanding_balance=row.outstanding_balance or 0.0
            ) for row in results
        ]
