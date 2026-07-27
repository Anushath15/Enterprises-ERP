from pydantic import BaseModel, ConfigDict, Field
from typing import Optional, List
from datetime import date
from app.models.finance import PaymentMethod, ClosingStatus

class ExpenseCategoryBase(BaseModel):
    name: str
    description: Optional[str] = None

class ExpenseCategoryCreate(ExpenseCategoryBase):
    pass

class ExpenseCategoryResponse(ExpenseCategoryBase):
    id: int
    is_active: bool
    model_config = ConfigDict(from_attributes=True)

class ExpenseBase(BaseModel):
    category_id: int
    amount: float = Field(..., gt=0)
    payment_method: PaymentMethod
    expense_date: date
    notes: Optional[str] = None

class ExpenseCreate(ExpenseBase):
    pass

class ExpenseResponse(ExpenseBase):
    id: int
    expense_number: str
    is_active: bool
    model_config = ConfigDict(from_attributes=True)

class DailyClosingBase(BaseModel):
    business_date: date
    physical_cash: float = Field(..., ge=0)
    notes: Optional[str] = None

class DailyClosingCreate(DailyClosingBase):
    pass

class DailyClosingResponse(DailyClosingBase):
    id: int
    opening_cash: float
    cash_sales: float
    cash_collections: float
    cash_purchases: float
    cash_expenses: float
    cash_withdrawals: float
    cash_deposits: float
    expected_cash: float
    difference: float
    status: ClosingStatus
    is_active: bool
    model_config = ConfigDict(from_attributes=True)

class DashboardSummaryResponse(BaseModel):
    total_sales_today: float
    total_purchases_today: float
    total_expenses_today: float
    total_customers: int
    total_dealers: int
    low_stock_products: int
