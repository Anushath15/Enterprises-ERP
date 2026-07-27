from fastapi import APIRouter, Depends, Query, Path
from sqlalchemy.orm import Session
from typing import List, Optional
from app.api.dependencies import get_db
from app.schemas.common import StandardResponse, success_response, PaginationMeta
from app.schemas.product import ProductCreate, ProductUpdate, ProductResponse, CategoryCreate, CategoryResponse, BrandCreate, BrandResponse
from app.services.product import ProductService
from app.repositories.product import product_repo, category_repo, brand_repo
from app.exceptions.handlers import BusinessException

router = APIRouter()

# --- Categories ---
@router.post("/categories", response_model=StandardResponse[CategoryResponse], status_code=201)
def create_category(category_in: CategoryCreate, db: Session = Depends(get_db)):
    category = ProductService.create_category(db, category_in)
    return success_response(data=category, message="Category created successfully")

@router.get("/categories", response_model=StandardResponse[List[CategoryResponse]])
def list_categories(db: Session = Depends(get_db)):
    categories = category_repo.get_all(db)
    return success_response(data=categories)

@router.get("/categories/{id}", response_model=StandardResponse[CategoryResponse])
def get_category(id: int = Path(...), db: Session = Depends(get_db)):
    category = category_repo.get(db, id=id)
    if not category:
        raise BusinessException("Category not found", status_code=404)
    return success_response(data=category)

@router.put("/categories/{id}", response_model=StandardResponse[CategoryResponse])
def update_category(category_in: CategoryCreate, id: int = Path(...), db: Session = Depends(get_db)):
    category = category_repo.get(db, id=id)
    if not category:
        raise BusinessException("Category not found", status_code=404)
    category = category_repo.update(db, db_obj=category, obj_in=category_in.model_dump())
    db.commit()
    db.refresh(category)
    return success_response(data=category)

@router.delete("/categories/{id}", response_model=StandardResponse[bool])
def delete_category(id: int = Path(...), db: Session = Depends(get_db)):
    category = category_repo.get(db, id=id)
    if not category:
        raise BusinessException("Category not found", status_code=404)
    category_repo.soft_delete(db, category)
    db.commit()
    return success_response(data=True)

# --- Brands ---
@router.post("/brands", response_model=StandardResponse[BrandResponse], status_code=201)
def create_brand(brand_in: BrandCreate, db: Session = Depends(get_db)):
    brand = ProductService.create_brand(db, brand_in)
    return success_response(data=brand, message="Brand created successfully")

@router.get("/brands", response_model=StandardResponse[List[BrandResponse]])
def list_brands(db: Session = Depends(get_db)):
    brands = brand_repo.get_all(db)
    return success_response(data=brands)

@router.get("/brands/{id}", response_model=StandardResponse[BrandResponse])
def get_brand(id: int = Path(...), db: Session = Depends(get_db)):
    brand = brand_repo.get(db, id=id)
    if not brand:
        raise BusinessException("Brand not found", status_code=404)
    return success_response(data=brand)

@router.put("/brands/{id}", response_model=StandardResponse[BrandResponse])
def update_brand(brand_in: BrandCreate, id: int = Path(...), db: Session = Depends(get_db)):
    brand = brand_repo.get(db, id=id)
    if not brand:
        raise BusinessException("Brand not found", status_code=404)
    brand = brand_repo.update(db, db_obj=brand, obj_in=brand_in.model_dump())
    db.commit()
    db.refresh(brand)
    return success_response(data=brand)

@router.delete("/brands/{id}", response_model=StandardResponse[bool])
def delete_brand(id: int = Path(...), db: Session = Depends(get_db)):
    brand = brand_repo.get(db, id=id)
    if not brand:
        raise BusinessException("Brand not found", status_code=404)
    brand_repo.soft_delete(db, brand)
    db.commit()
    return success_response(data=True)

# --- Products ---
@router.post("/products", response_model=StandardResponse[ProductResponse], status_code=201)
def create_product(product_in: ProductCreate, db: Session = Depends(get_db)):
    product = ProductService.create_product(db, product_in)
    return success_response(data=product, message="Product created successfully")

@router.get("/products", response_model=StandardResponse[List[ProductResponse]])
def list_products(
    db: Session = Depends(get_db),
    page: int = Query(1, ge=1),
    page_size: int = Query(100, ge=1, le=1000),
    search: Optional[str] = None,
    category_id: Optional[int] = None,
    brand_id: Optional[int] = None
):
    skip = (page - 1) * page_size
    products, total = product_repo.search(db, query=search, category_id=category_id, brand_id=brand_id, skip=skip, limit=page_size)
    
    meta = PaginationMeta(
        page=page,
        page_size=page_size,
        total_items=total,
        total_pages=(total + page_size - 1) // page_size if total > 0 else 1
    )
    return success_response(data=products, meta=meta)

@router.get("/products/{id}", response_model=StandardResponse[ProductResponse])
def get_product(id: int = Path(...), db: Session = Depends(get_db)):
    product = product_repo.get(db, id=id)
    if not product:
        raise BusinessException("Product not found", status_code=404)
    product.current_stock = product.inventory.current_stock if product.inventory else 0.0
    return success_response(data=product)

@router.put("/products/{id}", response_model=StandardResponse[ProductResponse])
def update_product(product_in: ProductUpdate, id: int = Path(...), db: Session = Depends(get_db)):
    # Simple direct update wrapper (advanced logic belongs in Service)
    product = product_repo.get(db, id=id)
    if not product:
        raise BusinessException("Product not found", status_code=404)
    product = product_repo.update(db, db_obj=product, obj_in=product_in.model_dump(exclude_unset=True))
    db.commit()
    db.refresh(product)
    product.current_stock = product.inventory.current_stock if product.inventory else 0.0
    return success_response(data=product)

@router.delete("/products/{id}", response_model=StandardResponse[bool])
def delete_product(id: int = Path(...), db: Session = Depends(get_db)):
    ProductService.delete_product(db, id=id)
    return success_response(data=True, message="Product deleted successfully")
