from sqlalchemy import String, Float, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import Optional
from app.database.base import BaseModel
from app.models.product import Product

class MovementType(str):
    PURCHASE = "PURCHASE"
    SALE = "SALE"
    SALES_RETURN = "SALES_RETURN"
    PURCHASE_RETURN = "PURCHASE_RETURN"
    ADJUSTMENT = "ADJUSTMENT"
    INITIAL = "INITIAL"

class InventoryMovement(BaseModel):
    __tablename__ = "inventory_movements"

    product_id: Mapped[int] = mapped_column(ForeignKey("products.id"), index=True)
    movement_type: Mapped[str] = mapped_column(String(50), nullable=False)
    
    # E.g., SalesInvoice ID, PurchaseInvoice ID
    reference_id: Mapped[Optional[int]] = mapped_column(ForeignKey("sales_invoices.id"), nullable=True)
    
    quantity_change: Mapped[float] = mapped_column(Float, nullable=False) # Can be positive or negative
    resulting_stock: Mapped[float] = mapped_column(Float, nullable=False)
    
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    product: Mapped["Product"] = relationship("Product")

class AuditLog(BaseModel):
    __tablename__ = "audit_logs"

    action: Mapped[str] = mapped_column(String(100), nullable=False)
    entity_type: Mapped[str] = mapped_column(String(100), nullable=False)
    entity_id: Mapped[int] = mapped_column(ForeignKey("sales_invoices.id"), nullable=True) # polymorphic placeholder
    details: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
