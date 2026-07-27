from sqlalchemy.orm import Session
from sqlalchemy import select, func, or_
from app.models.finance import Expense, ExpenseCategory, DailyClosing
from app.repositories.product import BaseRepository
from typing import Optional, List
from datetime import date

class ExpenseCategoryRepository(BaseRepository[ExpenseCategory]):
    def __init__(self):
        super().__init__(ExpenseCategory)

class ExpenseRepository(BaseRepository[Expense]):
    def __init__(self):
        super().__init__(Expense)

    def search(self, db: Session, query: Optional[str] = None, skip: int = 0, limit: int = 100):
        stmt = select(Expense).filter(Expense.is_active == True)
        if query:
            stmt = stmt.filter(Expense.expense_number.ilike(f"%{query}%"))
            
        total = db.scalar(select(func.count()).select_from(stmt.subquery()))
        results = db.execute(stmt.offset(skip).limit(limit)).scalars().all()
        return results, total

class DailyClosingRepository(BaseRepository[DailyClosing]):
    def __init__(self):
        super().__init__(DailyClosing)
        
    def get_by_date(self, db: Session, business_date: date) -> Optional[DailyClosing]:
        return db.execute(select(DailyClosing).filter(DailyClosing.business_date == business_date, DailyClosing.is_active == True)).scalar_one_or_none()
        
    def get_all_closings(self, db: Session, skip: int = 0, limit: int = 100):
        stmt = select(DailyClosing).filter(DailyClosing.is_active == True).order_by(DailyClosing.business_date.desc())
        total = db.scalar(select(func.count()).select_from(stmt.subquery()))
        results = db.execute(stmt.offset(skip).limit(limit)).scalars().all()
        return results, total

expense_category_repo = ExpenseCategoryRepository()
expense_repo = ExpenseRepository()
daily_closing_repo = DailyClosingRepository()
