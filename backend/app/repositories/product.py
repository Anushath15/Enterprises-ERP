from sqlalchemy.orm import Session
from sqlalchemy import select, func, or_
from app.models.product import Product, Category, Brand, Inventory
from typing import TypeVar, Generic, Type, Optional, List, Any

T = TypeVar("T")

class BaseRepository(Generic[T]):
    def __init__(self, model: Type[T]):
        self.model = model

    def get(self, db: Session, id: Any) -> Optional[T]:
        return db.execute(select(self.model).filter(self.model.id == id, self.model.is_active == True)).scalar_one_or_none()

    def get_all(self, db: Session, skip: int = 0, limit: int = 100) -> List[T]:
        return db.execute(select(self.model).filter(self.model.is_active == True).offset(skip).limit(limit)).scalars().all()

    def create(self, db: Session, obj_in: dict) -> T:
        db_obj = self.model(**obj_in)
        db.add(db_obj)
        db.flush()
        return db_obj

    def update(self, db: Session, db_obj: T, obj_in: dict) -> T:
        for field, value in obj_in.items():
            setattr(db_obj, field, value)
        db.add(db_obj)
        db.flush()
        return db_obj

    def soft_delete(self, db: Session, db_obj: T) -> T:
        db_obj.is_active = False
        db.add(db_obj)
        db.flush()
        return db_obj

class ProductRepository(BaseRepository[Product]):
    def __init__(self):
        super().__init__(Product)
        
    def get_by_barcode(self, db: Session, barcode: str) -> Optional[Product]:
        return db.execute(select(Product).filter(Product.barcode == barcode, Product.is_active == True)).scalar_one_or_none()

    def search(self, db: Session, query: Optional[str] = None, category_id: Optional[int] = None, brand_id: Optional[int] = None, skip: int = 0, limit: int = 100):
        stmt = select(Product).join(Inventory, Product.id == Inventory.product_id).filter(Product.is_active == True)
        
        if query:
            stmt = stmt.filter(or_(Product.name.ilike(f"%{query}%"), Product.product_code.ilike(f"%{query}%")))
        if category_id:
            stmt = stmt.filter(Product.category_id == category_id)
        if brand_id:
            stmt = stmt.filter(Product.brand_id == brand_id)
            
        total = db.scalar(select(func.count()).select_from(stmt.subquery()))
        
        stmt = stmt.offset(skip).limit(limit)
        results = db.execute(stmt).scalars().all()
        
        # In a real app we'd load the inventory mapping into the product model dynamically or use joinedload
        for p in results:
            p.current_stock = p.inventory.current_stock if p.inventory else 0.0
            
        return results, total

class CategoryRepository(BaseRepository[Category]):
    def __init__(self):
        super().__init__(Category)
        
    def get_by_name(self, db: Session, name: str) -> Optional[Category]:
        return db.execute(select(Category).filter(Category.name == name, Category.is_active == True)).scalar_one_or_none()

class BrandRepository(BaseRepository[Brand]):
    def __init__(self):
        super().__init__(Brand)

    def get_by_name(self, db: Session, name: str) -> Optional[Brand]:
        return db.execute(select(Brand).filter(Brand.name == name, Brand.is_active == True)).scalar_one_or_none()

class InventoryRepository(BaseRepository[Inventory]):
    def __init__(self):
        super().__init__(Inventory)
        
    def get_by_product_id(self, db: Session, product_id: int) -> Optional[Inventory]:
        return db.execute(select(Inventory).filter(Inventory.product_id == product_id)).scalar_one_or_none()

product_repo = ProductRepository()
category_repo = CategoryRepository()
brand_repo = BrandRepository()
inventory_repo = InventoryRepository()
