from sqlalchemy.orm import Session
from sqlalchemy import select, func, or_
from app.models.contact import Customer, Dealer
from app.repositories.product import BaseRepository
from typing import Optional

class CustomerRepository(BaseRepository[Customer]):
    def __init__(self):
        super().__init__(Customer)
        
    def get_by_phone(self, db: Session, phone: str) -> Optional[Customer]:
        return db.execute(select(Customer).filter(Customer.phone == phone, Customer.is_active == True)).scalar_one_or_none()
        
    def get_by_gst(self, db: Session, gst_number: str) -> Optional[Customer]:
        return db.execute(select(Customer).filter(Customer.gst_number == gst_number, Customer.is_active == True)).scalar_one_or_none()

    def search(self, db: Session, query: Optional[str] = None, outstanding_only: bool = False, skip: int = 0, limit: int = 100):
        stmt = select(Customer).filter(Customer.is_active == True)
        
        if query:
            stmt = stmt.filter(or_(
                Customer.name.ilike(f"%{query}%"), 
                Customer.customer_code.ilike(f"%{query}%"),
                Customer.phone.ilike(f"%{query}%")
            ))
        if outstanding_only:
            stmt = stmt.filter(Customer.outstanding_balance > 0)
            
        total = db.scalar(select(func.count()).select_from(stmt.subquery()))
        results = db.execute(stmt.offset(skip).limit(limit)).scalars().all()
        return results, total

class DealerRepository(BaseRepository[Dealer]):
    def __init__(self):
        super().__init__(Dealer)
        
    def get_by_phone(self, db: Session, phone: str) -> Optional[Dealer]:
        return db.execute(select(Dealer).filter(Dealer.phone == phone, Dealer.is_active == True)).scalar_one_or_none()
        
    def get_by_gst(self, db: Session, gst_number: str) -> Optional[Dealer]:
        return db.execute(select(Dealer).filter(Dealer.gst_number == gst_number, Dealer.is_active == True)).scalar_one_or_none()

    def search(self, db: Session, query: Optional[str] = None, outstanding_only: bool = False, skip: int = 0, limit: int = 100):
        stmt = select(Dealer).filter(Dealer.is_active == True)
        
        if query:
            stmt = stmt.filter(or_(
                Dealer.name.ilike(f"%{query}%"), 
                Dealer.dealer_code.ilike(f"%{query}%"),
                Dealer.phone.ilike(f"%{query}%")
            ))
        if outstanding_only:
            stmt = stmt.filter(Dealer.outstanding_balance > 0)
            
        total = db.scalar(select(func.count()).select_from(stmt.subquery()))
        results = db.execute(stmt.offset(skip).limit(limit)).scalars().all()
        return results, total

customer_repo = CustomerRepository()
dealer_repo = DealerRepository()
