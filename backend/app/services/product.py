from sqlalchemy.orm import Session
from app.repositories.product import product_repo, category_repo, brand_repo, inventory_repo
from app.schemas.product import ProductCreate, ProductUpdate, CategoryCreate, BrandCreate
from app.utils.code_generator import generate_product_code
from app.exceptions.handlers import BusinessException

class ProductService:
    @staticmethod
    def create_category(db: Session, category_in: CategoryCreate):
        if category_repo.get_by_name(db, name=category_in.name):
            raise BusinessException("Category with this name already exists", status_code=409)
        category = category_repo.create(db, obj_in=category_in.model_dump())
        db.commit()
        db.refresh(category)
        return category

    @staticmethod
    def create_brand(db: Session, brand_in: BrandCreate):
        if brand_repo.get_by_name(db, name=brand_in.name):
            raise BusinessException("Brand with this name already exists", status_code=409)
        brand = brand_repo.create(db, obj_in=brand_in.model_dump())
        db.commit()
        db.refresh(brand)
        return brand

    @staticmethod
    def create_product(db: Session, product_in: ProductCreate):
        # Validation
        if product_in.barcode and product_repo.get_by_barcode(db, barcode=product_in.barcode):
            raise BusinessException("Product with this barcode already exists", status_code=409)
            
        if not category_repo.get(db, id=product_in.category_id):
            raise BusinessException("Invalid category", status_code=400)
            
        if not brand_repo.get(db, id=product_in.brand_id):
            raise BusinessException("Invalid brand", status_code=400)
            
        if product_in.selling_price < product_in.purchase_price:
            raise BusinessException("Selling price cannot be less than purchase price", status_code=400)

        # Separate stock from product dict
        product_dict = product_in.model_dump(exclude={"current_stock"})
        
        # Create product with temporary code to get ID
        product_dict["product_code"] = "TEMP"
        product = product_repo.create(db, obj_in=product_dict)
        
        # Set real business code
        product.product_code = generate_product_code(product.id)
        
        # Create inventory record
        inventory_repo.create(db, obj_in={"product_id": product.id, "current_stock": product_in.current_stock})
        
        db.commit()
        db.refresh(product)
        product.current_stock = product_in.current_stock
        return product

    @staticmethod
    def delete_product(db: Session, id: int):
        product = product_repo.get(db, id=id)
        if not product:
            raise BusinessException("Product not found", status_code=404)
        product_repo.soft_delete(db, product)
        db.commit()
        return True
