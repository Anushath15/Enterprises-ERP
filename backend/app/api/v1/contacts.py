from fastapi import APIRouter, Depends, Query, Path
from sqlalchemy.orm import Session
from typing import List, Optional
from app.api.dependencies import get_db
from app.schemas.common import StandardResponse, success_response, PaginationMeta
from app.schemas.contact import CustomerCreate, CustomerUpdate, CustomerResponse, DealerCreate, DealerUpdate, DealerResponse
from app.services.contact import ContactService
from app.repositories.contact import customer_repo, dealer_repo
from app.exceptions.handlers import BusinessException

router = APIRouter()

# --- Customers ---
@router.post("/customers", response_model=StandardResponse[CustomerResponse], status_code=201)
def create_customer(customer_in: CustomerCreate, db: Session = Depends(get_db)):
    customer = ContactService.create_customer(db, customer_in)
    return success_response(data=customer, message="Customer created successfully")

@router.get("/customers", response_model=StandardResponse[List[CustomerResponse]])
def list_customers(
    db: Session = Depends(get_db),
    page: int = Query(1, ge=1),
    page_size: int = Query(100, ge=1, le=1000),
    search: Optional[str] = None,
    outstanding_only: bool = False
):
    skip = (page - 1) * page_size
    customers, total = customer_repo.search(db, query=search, outstanding_only=outstanding_only, skip=skip, limit=page_size)
    meta = PaginationMeta(page=page, page_size=page_size, total_items=total, total_pages=(total + page_size - 1) // page_size if total > 0 else 1)
    return success_response(data=customers, meta=meta)

@router.get("/customers/{id}", response_model=StandardResponse[CustomerResponse])
def get_customer(id: int = Path(...), db: Session = Depends(get_db)):
    customer = customer_repo.get(db, id=id)
    if not customer:
        raise BusinessException("Customer not found", status_code=404)
    return success_response(data=customer)

@router.put("/customers/{id}", response_model=StandardResponse[CustomerResponse])
def update_customer(customer_in: CustomerUpdate, id: int = Path(...), db: Session = Depends(get_db)):
    customer = ContactService.update_customer(db, id, customer_in)
    return success_response(data=customer)

@router.delete("/customers/{id}", response_model=StandardResponse[bool])
def delete_customer(id: int = Path(...), db: Session = Depends(get_db)):
    customer = customer_repo.get(db, id=id)
    if not customer:
        raise BusinessException("Customer not found", status_code=404)
    customer_repo.soft_delete(db, customer)
    db.commit()
    return success_response(data=True, message="Customer deleted successfully")

# --- Dealers ---
@router.post("/dealers", response_model=StandardResponse[DealerResponse], status_code=201)
def create_dealer(dealer_in: DealerCreate, db: Session = Depends(get_db)):
    dealer = ContactService.create_dealer(db, dealer_in)
    return success_response(data=dealer, message="Dealer created successfully")

@router.get("/dealers", response_model=StandardResponse[List[DealerResponse]])
def list_dealers(
    db: Session = Depends(get_db),
    page: int = Query(1, ge=1),
    page_size: int = Query(100, ge=1, le=1000),
    search: Optional[str] = None,
    outstanding_only: bool = False
):
    skip = (page - 1) * page_size
    dealers, total = dealer_repo.search(db, query=search, outstanding_only=outstanding_only, skip=skip, limit=page_size)
    meta = PaginationMeta(page=page, page_size=page_size, total_items=total, total_pages=(total + page_size - 1) // page_size if total > 0 else 1)
    return success_response(data=dealers, meta=meta)

@router.get("/dealers/{id}", response_model=StandardResponse[DealerResponse])
def get_dealer(id: int = Path(...), db: Session = Depends(get_db)):
    dealer = dealer_repo.get(db, id=id)
    if not dealer:
        raise BusinessException("Dealer not found", status_code=404)
    return success_response(data=dealer)

@router.put("/dealers/{id}", response_model=StandardResponse[DealerResponse])
def update_dealer(dealer_in: DealerUpdate, id: int = Path(...), db: Session = Depends(get_db)):
    dealer = ContactService.update_dealer(db, id, dealer_in)
    return success_response(data=dealer)

@router.delete("/dealers/{id}", response_model=StandardResponse[bool])
def delete_dealer(id: int = Path(...), db: Session = Depends(get_db)):
    dealer = dealer_repo.get(db, id=id)
    if not dealer:
        raise BusinessException("Dealer not found", status_code=404)
    dealer_repo.soft_delete(db, dealer)
    db.commit()
    return success_response(data=True, message="Dealer deleted successfully")
