from sqlalchemy.orm import Session
from sqlalchemy import select, func, or_
from app.models.purchase import PurchaseInvoice, PurchaseItem
from app.repositories.product import BaseRepository
from typing import Optional, List

class PurchaseInvoiceRepository(BaseRepository[PurchaseInvoice]):
    def __init__(self):
        super().__init__(PurchaseInvoice)

    def search(self, db: Session, query: Optional[str] = None, dealer_id: Optional[int] = None, skip: int = 0, limit: int = 100):
        stmt = select(PurchaseInvoice).filter(PurchaseInvoice.is_active == True)
        
        if query:
            stmt = stmt.filter(PurchaseInvoice.purchase_number.ilike(f"%{query}%"))
        if dealer_id:
            stmt = stmt.filter(PurchaseInvoice.dealer_id == dealer_id)
            
        total = db.scalar(select(func.count()).select_from(stmt.subquery()))
        results = db.execute(stmt.offset(skip).limit(limit)).scalars().all()
        return results, total

class PurchaseItemRepository(BaseRepository[PurchaseItem]):
    def __init__(self):
        super().__init__(PurchaseItem)
        
    def get_by_invoice_id(self, db: Session, invoice_id: int) -> List[PurchaseItem]:
        return db.execute(select(PurchaseItem).filter(PurchaseItem.invoice_id == invoice_id)).scalars().all()

purchase_repo = PurchaseInvoiceRepository()
purchase_item_repo = PurchaseItemRepository()
