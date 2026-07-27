from sqlalchemy import String, Float, ForeignKey, Text, Date
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import Optional
import enum
from datetime import date
from app.database.base import BaseModel

class PaymentMethod(str, enum.Enum):
    CASH = "Cash"
    UPI = "UPI"
    BANK_TRANSFER = "Bank Transfer"
    CREDIT_CARD = "Credit Card"

class ClosingStatus(str, enum.Enum):
    BALANCED = "Balanced"
    SHORT = "Short"
    EXCESS = "Excess"

class ExpenseCategory(BaseModel):
    __tablename__ = "expense_categories"
    
    name: Mapped[str] = mapped_column(String(100), unique=True, index=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

class Expense(BaseModel):
    __tablename__ = "expenses"

    expense_number: Mapped[str] = mapped_column(String(50), unique=True, index=True) # EXP-000001
    category_id: Mapped[int] = mapped_column(ForeignKey("expense_categories.id"), index=True)
    amount: Mapped[float] = mapped_column(Float, nullable=False)
    payment_method: Mapped[PaymentMethod] = mapped_column(String(50), nullable=False)
    expense_date: Mapped[date] = mapped_column(Date, nullable=False, default=date.today)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    category: Mapped["ExpenseCategory"] = relationship("ExpenseCategory")

class DailyClosing(BaseModel):
    __tablename__ = "daily_closings"

    business_date: Mapped[date] = mapped_column(Date, unique=True, index=True, nullable=False)
    
    opening_cash: Mapped[float] = mapped_column(Float, default=0.0)
    cash_sales: Mapped[float] = mapped_column(Float, default=0.0)
    cash_collections: Mapped[float] = mapped_column(Float, default=0.0) # Placeholder
    cash_purchases: Mapped[float] = mapped_column(Float, default=0.0)
    cash_expenses: Mapped[float] = mapped_column(Float, default=0.0)
    cash_withdrawals: Mapped[float] = mapped_column(Float, default=0.0) # Placeholder
    cash_deposits: Mapped[float] = mapped_column(Float, default=0.0) # Placeholder
    
    expected_cash: Mapped[float] = mapped_column(Float, nullable=False)
    physical_cash: Mapped[float] = mapped_column(Float, nullable=False)
    difference: Mapped[float] = mapped_column(Float, nullable=False)
    
    status: Mapped[ClosingStatus] = mapped_column(String(50), nullable=False)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
