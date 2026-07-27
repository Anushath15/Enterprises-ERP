from sqlalchemy import String, Float, Text, Date
from sqlalchemy.orm import Mapped, mapped_column
from typing import Optional
from datetime import date
from app.database.base import BaseModel

class Customer(BaseModel):
    __tablename__ = "customers"

    customer_code: Mapped[str] = mapped_column(String(50), unique=True, index=True) # CUS-000001
    name: Mapped[str] = mapped_column(String(255), index=True)
    phone: Mapped[str] = mapped_column(String(20), unique=True, index=True)
    alternate_phone: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    gst_number: Mapped[Optional[str]] = mapped_column(String(50), unique=True, index=True, nullable=True)
    
    address: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    city: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    district: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    state: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    postal_code: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    
    credit_limit: Mapped[float] = mapped_column(Float, default=0.0)
    outstanding_balance: Mapped[float] = mapped_column(Float, default=0.0)
    
    last_purchase_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

class Dealer(BaseModel):
    __tablename__ = "dealers"

    dealer_code: Mapped[str] = mapped_column(String(50), unique=True, index=True) # DLR-000001
    name: Mapped[str] = mapped_column(String(255), index=True)
    contact_person: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    phone: Mapped[str] = mapped_column(String(20), unique=True, index=True)
    gst_number: Mapped[Optional[str]] = mapped_column(String(50), unique=True, index=True, nullable=True)
    
    address: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    payment_terms: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    
    outstanding_balance: Mapped[float] = mapped_column(Float, default=0.0)
    last_purchase_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
