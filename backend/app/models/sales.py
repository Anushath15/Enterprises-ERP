from sqlalchemy import String, Float, ForeignKey, Text, Enum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import List, Optional
import enum
from app.database.base import BaseModel
from app.models.product import Product
from app.models.contact import Customer

class PaymentType(str, enum.Enum):
    CASH = "Cash"
    UPI = "UPI"
    CREDIT = "Credit"

class PaymentStatus(str, enum.Enum):
    PAID = "Paid"
    UNPAID = "Unpaid"
    PARTIAL = "Partial"

class SalesInvoice(BaseModel):
    __tablename__ = "sales_invoices"

    invoice_number: Mapped[str] = mapped_column(String(50), unique=True, index=True) # SAL-000001
    
    customer_id: Mapped[int] = mapped_column(ForeignKey("customers.id"), index=True)
    
    subtotal: Mapped[float] = mapped_column(Float, default=0.0)
    discount: Mapped[float] = mapped_column(Float, default=0.0)
    tax_total: Mapped[float] = mapped_column(Float, default=0.0)
    total_amount: Mapped[float] = mapped_column(Float, default=0.0)
    
    payment_type: Mapped[PaymentType] = mapped_column(String(50), nullable=False)
    payment_status: Mapped[PaymentStatus] = mapped_column(String(50), nullable=False)
    
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    items: Mapped[List["SalesItem"]] = relationship("SalesItem", back_populates="invoice")
    customer: Mapped["Customer"] = relationship("Customer")

class SalesItem(BaseModel):
    __tablename__ = "sales_items"

    invoice_id: Mapped[int] = mapped_column(ForeignKey("sales_invoices.id"), index=True)
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id"), index=True)
    
    quantity: Mapped[float] = mapped_column(Float, nullable=False)
    unit_price: Mapped[float] = mapped_column(Float, nullable=False)
    subtotal: Mapped[float] = mapped_column(Float, nullable=False)

    invoice: Mapped["SalesInvoice"] = relationship("SalesInvoice", back_populates="items")
    product: Mapped["Product"] = relationship("Product")
