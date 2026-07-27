from sqlalchemy import String, Float, Integer, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import List, Optional
from app.database.base import BaseModel

class Category(BaseModel):
    __tablename__ = "categories"

    name: Mapped[str] = mapped_column(String(100), unique=True, index=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    products: Mapped[List["Product"]] = relationship("Product", back_populates="category")

class Brand(BaseModel):
    __tablename__ = "brands"

    name: Mapped[str] = mapped_column(String(100), unique=True, index=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    products: Mapped[List["Product"]] = relationship("Product", back_populates="brand")

class Product(BaseModel):
    __tablename__ = "products"

    product_code: Mapped[str] = mapped_column(String(50), unique=True, index=True) # E.g., PRD-000152
    name: Mapped[str] = mapped_column(String(255), index=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    barcode: Mapped[Optional[str]] = mapped_column(String(100), unique=True, index=True, nullable=True)
    
    # Financials
    hsn_code: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    gst_percentage: Mapped[float] = mapped_column(Float, default=18.0)
    purchase_price: Mapped[float] = mapped_column(Float, default=0.0)
    selling_price: Mapped[float] = mapped_column(Float, default=0.0)
    retail_price: Mapped[float] = mapped_column(Float, default=0.0)
    contractor_price: Mapped[float] = mapped_column(Float, default=0.0)
    project_price: Mapped[float] = mapped_column(Float, default=0.0)
    
    # Inventory metadata
    unit_measure: Mapped[str] = mapped_column(String(20), default="pcs")
    minimum_stock: Mapped[float] = mapped_column(Float, default=0.0)

    # Relationships
    category_id: Mapped[int] = mapped_column(ForeignKey("categories.id"))
    brand_id: Mapped[int] = mapped_column(ForeignKey("brands.id"))
    
    category: Mapped["Category"] = relationship("Category", back_populates="products")
    brand: Mapped["Brand"] = relationship("Brand", back_populates="products")
    inventory: Mapped["Inventory"] = relationship("Inventory", back_populates="product", uselist=False)

class Inventory(BaseModel):
    __tablename__ = "inventory"

    product_id: Mapped[int] = mapped_column(ForeignKey("products.id"), unique=True)
    current_stock: Mapped[float] = mapped_column(Float, default=0.0)

    product: Mapped["Product"] = relationship("Product", back_populates="inventory")
