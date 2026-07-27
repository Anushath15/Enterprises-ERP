from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import date

# --- Customer Schemas ---
class CustomerBase(BaseModel):
    name: str
    phone: str
    alternate_phone: Optional[str] = None
    gst_number: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    district: Optional[str] = None
    state: Optional[str] = None
    postal_code: Optional[str] = None
    credit_limit: float = 0.0
    notes: Optional[str] = None

class CustomerCreate(CustomerBase):
    pass

class CustomerUpdate(CustomerBase):
    name: Optional[str] = None
    phone: Optional[str] = None

class CustomerResponse(CustomerBase):
    id: int
    customer_code: str
    outstanding_balance: float
    last_purchase_date: Optional[date] = None
    is_active: bool
    
    model_config = ConfigDict(from_attributes=True)

# --- Dealer Schemas ---
class DealerBase(BaseModel):
    name: str
    contact_person: Optional[str] = None
    phone: str
    gst_number: Optional[str] = None
    address: Optional[str] = None
    payment_terms: Optional[str] = None
    notes: Optional[str] = None

class DealerCreate(DealerBase):
    pass

class DealerUpdate(DealerBase):
    name: Optional[str] = None
    phone: Optional[str] = None

class DealerResponse(DealerBase):
    id: int
    dealer_code: str
    outstanding_balance: float
    last_purchase_date: Optional[date] = None
    is_active: bool
    
    model_config = ConfigDict(from_attributes=True)
