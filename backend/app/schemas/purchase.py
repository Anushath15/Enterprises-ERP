from pydantic import BaseModel, ConfigDict, Field
from typing import Optional, List
from datetime import datetime
from app.models.sales import PaymentType, PaymentStatus

class PurchaseItemBase(BaseModel):
    product_id: int
    quantity: float = Field(..., gt=0)
    unit_price: float = Field(..., ge=0)

class PurchaseItemCreate(PurchaseItemBase):
    pass

class PurchaseItemResponse(PurchaseItemBase):
    id: int
    subtotal: float
    model_config = ConfigDict(from_attributes=True)

class PurchaseInvoiceBase(BaseModel):
    dealer_id: int
    payment_type: PaymentType
    discount: float = Field(default=0.0, ge=0)
    notes: Optional[str] = None

class PurchaseInvoiceCreate(PurchaseInvoiceBase):
    items: List[PurchaseItemCreate] = Field(..., min_length=1)

class PurchaseInvoiceResponse(PurchaseInvoiceBase):
    id: int
    purchase_number: str
    subtotal: float
    tax_total: float
    total_amount: float
    payment_status: PaymentStatus
    created_at: datetime
    items: List[PurchaseItemResponse]
    
    model_config = ConfigDict(from_attributes=True)
