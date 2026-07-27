from fastapi import APIRouter, Depends, Query, Path
from sqlalchemy.orm import Session
from typing import List, Optional
from app.api.dependencies import get_db
from app.schemas.common import StandardResponse, success_response, PaginationMeta
from app.schemas.purchase import PurchaseInvoiceCreate, PurchaseInvoiceResponse, PurchaseItemResponse
from app.services.purchase import PurchaseService
from app.repositories.purchase import purchase_repo, purchase_item_repo
from app.exceptions.handlers import BusinessException

router = APIRouter()

@router.post("", response_model=StandardResponse[PurchaseInvoiceResponse], status_code=201)
def create_purchase_invoice(invoice_in: PurchaseInvoiceCreate, db: Session = Depends(get_db)):
    invoice = PurchaseService.create_invoice(db, invoice_in)
    return success_response(data=invoice, message="Purchase invoice created successfully")

@router.get("", response_model=StandardResponse[List[PurchaseInvoiceResponse]])
def list_purchase_invoices(
    db: Session = Depends(get_db),
    page: int = Query(1, ge=1),
    page_size: int = Query(100, ge=1, le=1000),
    search: Optional[str] = None,
    dealer_id: Optional[int] = None
):
    skip = (page - 1) * page_size
    invoices, total = purchase_repo.search(db, query=search, dealer_id=dealer_id, skip=skip, limit=page_size)
    meta = PaginationMeta(page=page, page_size=page_size, total_items=total, total_pages=(total + page_size - 1) // page_size if total > 0 else 1)
    return success_response(data=invoices, meta=meta)

@router.get("/{id}", response_model=StandardResponse[PurchaseInvoiceResponse])
def get_purchase_invoice(id: int = Path(...), db: Session = Depends(get_db)):
    invoice = purchase_repo.get(db, id=id)
    if not invoice:
        raise BusinessException("Purchase invoice not found", status_code=404)
    return success_response(data=invoice)

@router.get("/{id}/items", response_model=StandardResponse[List[PurchaseItemResponse]])
def get_purchase_invoice_items(id: int = Path(...), db: Session = Depends(get_db)):
    invoice = purchase_repo.get(db, id=id)
    if not invoice:
        raise BusinessException("Purchase invoice not found", status_code=404)
    items = purchase_item_repo.get_by_invoice_id(db, invoice_id=id)
    return success_response(data=items)
