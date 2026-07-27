from pydantic import BaseModel
from typing import Optional, List
from datetime import date

# Request Query Params are handled via FastAPI Depends/Query directly in router.
# Here we define Response structures.

class SalesReportItem(BaseModel):
    date: str
    total_sales: float
    total_tax: float
    total_discount: float
    invoice_count: int

class PurchasesReportItem(BaseModel):
    date: str
    total_purchases: float
    total_tax: float
    total_discount: float
    invoice_count: int

class ExpenseReportItem(BaseModel):
    category_name: str
    total_amount: float
    expense_count: int

class InventoryReportItem(BaseModel):
    product_code: str
    name: str
    category_name: Optional[str]
    brand_name: Optional[str]
    current_stock: float
    minimum_stock: float
    stock_value: float

class CustomerOutstandingItem(BaseModel):
    customer_code: str
    name: str
    phone: str
    outstanding_balance: float

class DealerOutstandingItem(BaseModel):
    dealer_code: str
    name: str
    phone: str
    outstanding_balance: float
