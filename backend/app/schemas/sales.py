from pydantic import BaseModel, ConfigDict, Field
from typing import Optional, List
from datetime import datetime
from app.models.sales import PaymentType, PaymentStatus

class SalesItemBase(BaseModel):
    product_id: int
    quantity: float = Field(..., gt=0)
    unit_price: float = Field(..., ge=0)

class SalesItemCreate(SalesItemBase):
    pass

class SalesItemResponse(SalesItemBase):
    id: int
    subtotal: float
    model_config = ConfigDict(from_attributes=True)

class SalesInvoiceBase(BaseModel):
    customer_id: int
    payment_type: PaymentType
    discount: float = Field(default=0.0, ge=0)
    notes: Optional[str] = None

class SalesInvoiceCreate(SalesInvoiceBase):
    items: List[SalesItemCreate] = Field(..., min_length=1)

class SalesInvoiceResponse(SalesInvoiceBase):
    id: int
    invoice_number: str
    subtotal: float
    tax_total: float
    total_amount: float
    payment_status: PaymentStatus
    created_at: datetime
    items: List[SalesItemResponse]
    
    model_config = ConfigDict(from_attributes=True)
