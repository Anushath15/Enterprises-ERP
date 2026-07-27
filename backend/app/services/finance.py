from sqlalchemy.orm import Session
from sqlalchemy import select, func
from datetime import date
from app.schemas.finance import ExpenseCreate, DailyClosingCreate, DashboardSummaryResponse
from app.repositories.finance import expense_repo, expense_category_repo, daily_closing_repo
from app.repositories.sales import audit_repo
from app.models.finance import ClosingStatus, PaymentMethod
from app.models.sales import SalesInvoice, PaymentType
from app.models.purchase import PurchaseInvoice
from app.models.product import Product
from app.models.contact import Customer, Dealer
from app.utils.code_generator import generate_expense_number
from app.exceptions.handlers import BusinessException

class FinanceService:
    @staticmethod
    def create_expense(db: Session, expense_in: ExpenseCreate):
        try:
            category = expense_category_repo.get(db, id=expense_in.category_id)
            if not category:
                raise BusinessException("Invalid expense category", status_code=400)
                
            expense_dict = expense_in.model_dump()
            expense_dict["expense_number"] = "TEMP"
            
            expense = expense_repo.create(db, obj_in=expense_dict)
            db.flush()
            expense.expense_number = generate_expense_number(expense.id)
            
            audit_repo.create(db, obj_in={
                "action": "CREATE_EXPENSE",
                "entity_type": "Expense",
                "entity_id": expense.id,
                "details": f"Created expense {expense.expense_number} for {expense.amount}"
            })
            
            db.commit()
            db.refresh(expense)
            return expense
        except Exception as e:
            db.rollback()
            raise e

    @staticmethod
    def calculate_daily_closing(db: Session, business_date: date, physical_cash: float):
        try:
            # 1. Prevent Duplicates
            existing = daily_closing_repo.get_by_date(db, business_date=business_date)
            if existing:
                raise BusinessException(f"Daily closing already exists for {business_date}", status_code=409)

            # 2. Gather Transaction Totals for the date
            # SQLite / Postgres date casting wrapper trick using func.date or similar logic. 
            # Because created_at is a DateTime, casting depends on the engine. For cross-compatibility,
            # we can filter using bounds: >= date and < date + 1 day
            from datetime import timedelta
            start_dt = business_date
            end_dt = business_date + timedelta(days=1)
            
            # Cash Sales
            cash_sales = db.scalar(
                select(func.sum(SalesInvoice.total_amount))
                .filter(SalesInvoice.payment_type == PaymentType.CASH, SalesInvoice.is_active == True, SalesInvoice.created_at >= start_dt, SalesInvoice.created_at < end_dt)
            ) or 0.0
            
            # Cash Purchases
            cash_purchases = db.scalar(
                select(func.sum(PurchaseInvoice.total_amount))
                .filter(PurchaseInvoice.payment_type == PaymentType.CASH, PurchaseInvoice.is_active == True, PurchaseInvoice.created_at >= start_dt, PurchaseInvoice.created_at < end_dt)
            ) or 0.0
            
            # Cash Expenses
            cash_expenses = db.scalar(
                select(func.sum(Expense.amount))
                .filter(Expense.payment_method == PaymentMethod.CASH, Expense.is_active == True, Expense.expense_date == business_date)
            ) or 0.0
            
            # For this MVP, opening cash is 0 or derived from previous day's physical cash.
            # Let's get yesterday's physical cash if exists
            prev_closing = db.scalar(
                select(DailyClosing.physical_cash)
                .filter(DailyClosing.business_date < business_date)
                .order_by(DailyClosing.business_date.desc())
                .limit(1)
            )
            opening_cash = prev_closing or 0.0
            
            expected_cash = opening_cash + cash_sales - cash_purchases - cash_expenses
            difference = physical_cash - expected_cash
            
            if difference == 0:
                status = ClosingStatus.BALANCED
            elif difference < 0:
                status = ClosingStatus.SHORT
            else:
                status = ClosingStatus.EXCESS
                
            closing = daily_closing_repo.create(db, obj_in={
                "business_date": business_date,
                "opening_cash": opening_cash,
                "cash_sales": cash_sales,
                "cash_purchases": cash_purchases,
                "cash_expenses": cash_expenses,
                "expected_cash": expected_cash,
                "physical_cash": physical_cash,
                "difference": difference,
                "status": status,
                "notes": f"System matched difference: {difference}"
            })
            
            audit_repo.create(db, obj_in={
                "action": "CREATE_DAILY_CLOSING",
                "entity_type": "DailyClosing",
                "entity_id": closing.id,
                "details": f"Closed {business_date} with status {status.value}"
            })
            
            db.commit()
            db.refresh(closing)
            return closing
        except Exception as e:
            db.rollback()
            raise e

    @staticmethod
    def get_dashboard_summary(db: Session) -> dict:
        today = date.today()
        from datetime import timedelta
        start_dt = today
        end_dt = today + timedelta(days=1)
        
        total_sales = db.scalar(select(func.sum(SalesInvoice.total_amount)).filter(SalesInvoice.is_active == True, SalesInvoice.created_at >= start_dt, SalesInvoice.created_at < end_dt)) or 0.0
        total_purchases = db.scalar(select(func.sum(PurchaseInvoice.total_amount)).filter(PurchaseInvoice.is_active == True, PurchaseInvoice.created_at >= start_dt, PurchaseInvoice.created_at < end_dt)) or 0.0
        total_expenses = db.scalar(select(func.sum(Expense.amount)).filter(Expense.is_active == True, Expense.expense_date == today)) or 0.0
        
        total_customers = db.scalar(select(func.count(Customer.id)).filter(Customer.is_active == True)) or 0
        total_dealers = db.scalar(select(func.count(Dealer.id)).filter(Dealer.is_active == True)) or 0
        
        low_stock_products = db.scalar(select(func.count(Product.id)).filter(Product.is_active == True, Product.current_stock <= Product.minimum_stock)) or 0
        
        return {
            "total_sales_today": total_sales,
            "total_purchases_today": total_purchases,
            "total_expenses_today": total_expenses,
            "total_customers": total_customers,
            "total_dealers": total_dealers,
            "low_stock_products": low_stock_products
        }
