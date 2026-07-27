from sqlalchemy.orm import Session
from sqlalchemy import select, func, or_
from app.models.sales import SalesInvoice, SalesItem
from app.models.audit import InventoryMovement, AuditLog
from app.repositories.product import BaseRepository
from typing import Optional, List

class SalesInvoiceRepository(BaseRepository[SalesInvoice]):
    def __init__(self):
        super().__init__(SalesInvoice)

    def search(self, db: Session, query: Optional[str] = None, customer_id: Optional[int] = None, skip: int = 0, limit: int = 100):
        stmt = select(SalesInvoice).filter(SalesInvoice.is_active == True)
        
        if query:
            stmt = stmt.filter(SalesInvoice.invoice_number.ilike(f"%{query}%"))
        if customer_id:
            stmt = stmt.filter(SalesInvoice.customer_id == customer_id)
            
        total = db.scalar(select(func.count()).select_from(stmt.subquery()))
        results = db.execute(stmt.offset(skip).limit(limit)).scalars().all()
        return results, total

class SalesItemRepository(BaseRepository[SalesItem]):
    def __init__(self):
        super().__init__(SalesItem)
        
    def get_by_invoice_id(self, db: Session, invoice_id: int) -> List[SalesItem]:
        return db.execute(select(SalesItem).filter(SalesItem.invoice_id == invoice_id)).scalars().all()

class InventoryMovementRepository(BaseRepository[InventoryMovement]):
    def __init__(self):
        super().__init__(InventoryMovement)

class AuditLogRepository(BaseRepository[AuditLog]):
    def __init__(self):
        super().__init__(AuditLog)

sales_repo = SalesInvoiceRepository()
sales_item_repo = SalesItemRepository()
movement_repo = InventoryMovementRepository()
audit_repo = AuditLogRepository()
