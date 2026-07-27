from fastapi import APIRouter, Depends, Query, Path
from sqlalchemy.orm import Session
from typing import List, Optional
from app.api.dependencies import get_db
from app.schemas.common import StandardResponse, success_response, PaginationMeta
from app.schemas.finance import ExpenseCreate, ExpenseResponse, ExpenseCategoryCreate, ExpenseCategoryResponse
from app.services.finance import FinanceService
from app.repositories.finance import expense_repo, expense_category_repo
from app.exceptions.handlers import BusinessException

router = APIRouter()

@router.post("/categories", response_model=StandardResponse[ExpenseCategoryResponse], status_code=201)
def create_category(category_in: ExpenseCategoryCreate, db: Session = Depends(get_db)):
    cat = expense_category_repo.create(db, obj_in=category_in.model_dump())
    db.commit()
    db.refresh(cat)
    return success_response(data=cat)

@router.get("/categories", response_model=StandardResponse[List[ExpenseCategoryResponse]])
def list_categories(db: Session = Depends(get_db)):
    cats = expense_category_repo.get_all(db)
    return success_response(data=cats)

@router.post("", response_model=StandardResponse[ExpenseResponse], status_code=201)
def create_expense(expense_in: ExpenseCreate, db: Session = Depends(get_db)):
    expense = FinanceService.create_expense(db, expense_in)
    return success_response(data=expense, message="Expense created successfully")

@router.get("", response_model=StandardResponse[List[ExpenseResponse]])
def list_expenses(
    db: Session = Depends(get_db),
    page: int = Query(1, ge=1),
    page_size: int = Query(100, ge=1, le=1000),
    search: Optional[str] = None
):
    skip = (page - 1) * page_size
    expenses, total = expense_repo.search(db, query=search, skip=skip, limit=page_size)
    meta = PaginationMeta(page=page, page_size=page_size, total_items=total, total_pages=(total + page_size - 1) // page_size if total > 0 else 1)
    return success_response(data=expenses, meta=meta)

@router.get("/{id}", response_model=StandardResponse[ExpenseResponse])
def get_expense(id: int = Path(...), db: Session = Depends(get_db)):
    expense = expense_repo.get(db, id=id)
    if not expense:
        raise BusinessException("Expense not found", status_code=404)
    return success_response(data=expense)
