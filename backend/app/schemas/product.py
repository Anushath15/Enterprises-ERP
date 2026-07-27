from pydantic import BaseModel, ConfigDict, Field
from typing import Optional, List
from datetime import datetime

class CategoryBase(BaseModel):
    name: str
    description: Optional[str] = None

class CategoryCreate(CategoryBase):
    pass

class CategoryUpdate(CategoryBase):
    name: Optional[str] = None

class CategoryResponse(CategoryBase):
    id: int
    is_active: bool
    model_config = ConfigDict(from_attributes=True)

class BrandBase(BaseModel):
    name: str
    description: Optional[str] = None

class BrandCreate(BrandBase):
    pass

class BrandUpdate(BrandBase):
    name: Optional[str] = None

class BrandResponse(BrandBase):
    id: int
    is_active: bool
    model_config = ConfigDict(from_attributes=True)

class ProductBase(BaseModel):
    name: str
    description: Optional[str] = None
    barcode: Optional[str] = None
    hsn_code: Optional[str] = None
    gst_percentage: float = 18.0
    purchase_price: float = 0.0
    selling_price: float = 0.0
    retail_price: float = 0.0
    contractor_price: float = 0.0
    project_price: float = 0.0
    unit_measure: str = "pcs"
    minimum_stock: float = 0.0
    category_id: int
    brand_id: int

class ProductCreate(ProductBase):
    current_stock: float = 0.0

class ProductUpdate(ProductBase):
    name: Optional[str] = None
    category_id: Optional[int] = None
    brand_id: Optional[int] = None

class ProductResponse(ProductBase):
    id: int
    product_code: str
    is_active: bool
    current_stock: float
    category: Optional[CategoryResponse] = None
    brand: Optional[BrandResponse] = None
    
    model_config = ConfigDict(from_attributes=True)
