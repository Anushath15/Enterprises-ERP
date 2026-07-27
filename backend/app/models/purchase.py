from sqlalchemy import String, Float, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import List, Optional
from app.database.base import BaseModel
from app.models.product import Product
from app.models.contact import Dealer
from app.models.sales import PaymentType, PaymentStatus

class PurchaseInvoice(BaseModel):
    __tablename__ = "purchase_invoices"

    purchase_number: Mapped[str] = mapped_column(String(50), unique=True, index=True) # PUR-000001
    
    dealer_id: Mapped[int] = mapped_column(ForeignKey("dealers.id"), index=True)
    
    subtotal: Mapped[float] = mapped_column(Float, default=0.0)
    discount: Mapped[float] = mapped_column(Float, default=0.0)
    tax_total: Mapped[float] = mapped_column(Float, default=0.0)
    total_amount: Mapped[float] = mapped_column(Float, default=0.0)
    
    payment_type: Mapped[PaymentType] = mapped_column(String(50), nullable=False)
    payment_status: Mapped[PaymentStatus] = mapped_column(String(50), nullable=False)
    
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    items: Mapped[List["PurchaseItem"]] = relationship("PurchaseItem", back_populates="invoice")
    dealer: Mapped["Dealer"] = relationship("Dealer")

class PurchaseItem(BaseModel):
    __tablename__ = "purchase_items"

    invoice_id: Mapped[int] = mapped_column(ForeignKey("purchase_invoices.id"), index=True)
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id"), index=True)
    
    quantity: Mapped[float] = mapped_column(Float, nullable=False)
    unit_price: Mapped[float] = mapped_column(Float, nullable=False)
    subtotal: Mapped[float] = mapped_column(Float, nullable=False)

    invoice: Mapped["PurchaseInvoice"] = relationship("PurchaseInvoice", back_populates="items")
    product: Mapped["Product"] = relationship("Product")
