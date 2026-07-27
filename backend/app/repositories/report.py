from sqlalchemy.orm import Session
from sqlalchemy import select, func, and_
from typing import Optional, Dict, Any
from datetime import date

from app.models.sales import SalesInvoice
from app.models.purchase import PurchaseInvoice
from app.models.finance import Expense, ExpenseCategory
from app.models.product import Product, Category, Brand
from app.models.contact import Customer, Dealer

class ReportRepository:
    
    @staticmethod
    def get_sales_summary(db: Session, start_date: Optional[date], end_date: Optional[date], customer_id: Optional[int]):
        stmt = select(
            func.date(SalesInvoice.created_at).label("dt"),
            func.sum(SalesInvoice.total_amount).label("total"),
            func.sum(SalesInvoice.tax_total).label("tax"),
            func.sum(SalesInvoice.discount).label("discount"),
            func.count(SalesInvoice.id).label("count")
        ).filter(SalesInvoice.is_active == True)
        
        if start_date:
            stmt = stmt.filter(func.date(SalesInvoice.created_at) >= start_date)
        if end_date:
            stmt = stmt.filter(func.date(SalesInvoice.created_at) <= end_date)
        if customer_id:
            stmt = stmt.filter(SalesInvoice.customer_id == customer_id)
            
        stmt = stmt.group_by(func.date(SalesInvoice.created_at)).order_by(func.date(SalesInvoice.created_at).desc())
        
        return db.execute(stmt).all()

    @staticmethod
    def get_purchases_summary(db: Session, start_date: Optional[date], end_date: Optional[date], dealer_id: Optional[int]):
        stmt = select(
            func.date(PurchaseInvoice.created_at).label("dt"),
            func.sum(PurchaseInvoice.total_amount).label("total"),
            func.sum(PurchaseInvoice.tax_total).label("tax"),
            func.sum(PurchaseInvoice.discount).label("discount"),
            func.count(PurchaseInvoice.id).label("count")
        ).filter(PurchaseInvoice.is_active == True)
        
        if start_date:
            stmt = stmt.filter(func.date(PurchaseInvoice.created_at) >= start_date)
        if end_date:
            stmt = stmt.filter(func.date(PurchaseInvoice.created_at) <= end_date)
        if dealer_id:
            stmt = stmt.filter(PurchaseInvoice.dealer_id == dealer_id)
            
        stmt = stmt.group_by(func.date(PurchaseInvoice.created_at)).order_by(func.date(PurchaseInvoice.created_at).desc())
        
        return db.execute(stmt).all()

    @staticmethod
    def get_expenses_summary(db: Session, start_date: Optional[date], end_date: Optional[date]):
        stmt = select(
            ExpenseCategory.name.label("category"),
            func.sum(Expense.amount).label("total"),
            func.count(Expense.id).label("count")
        ).join(ExpenseCategory).filter(Expense.is_active == True)
        
        if start_date:
            stmt = stmt.filter(Expense.expense_date >= start_date)
        if end_date:
            stmt = stmt.filter(Expense.expense_date <= end_date)
            
        stmt = stmt.group_by(ExpenseCategory.name).order_by(func.sum(Expense.amount).desc())
        
        return db.execute(stmt).all()

    @staticmethod
    def get_inventory_summary(db: Session, low_stock_only: bool = False):
        stmt = select(
            Product.product_code,
            Product.name,
            Category.name.label("category_name"),
            Brand.name.label("brand_name"),
            Product.current_stock,
            Product.minimum_stock,
            (Product.current_stock * Product.purchase_price).label("stock_value")
        ).outerjoin(Category).outerjoin(Brand).filter(Product.is_active == True)
        
        if low_stock_only:
            stmt = stmt.filter(Product.current_stock <= Product.minimum_stock)
            
        stmt = stmt.order_by(Product.name.asc())
        
        return db.execute(stmt).all()

    @staticmethod
    def get_customer_outstanding(db: Session):
        stmt = select(
            Customer.customer_code,
            Customer.name,
            Customer.phone,
            Customer.outstanding_balance
        ).filter(Customer.is_active == True, Customer.outstanding_balance > 0).order_by(Customer.outstanding_balance.desc())
        return db.execute(stmt).all()

    @staticmethod
    def get_dealer_outstanding(db: Session):
        stmt = select(
            Dealer.dealer_code,
            Dealer.name,
            Dealer.phone,
            Dealer.outstanding_balance
        ).filter(Dealer.is_active == True, Dealer.outstanding_balance > 0).order_by(Dealer.outstanding_balance.desc())
        return db.execute(stmt).all()

report_repo = ReportRepository()
