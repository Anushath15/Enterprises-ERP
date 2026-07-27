from sqlalchemy.orm import Session
from app.repositories.contact import customer_repo, dealer_repo
from app.schemas.contact import CustomerCreate, CustomerUpdate, DealerCreate, DealerUpdate
from app.utils.code_generator import generate_customer_code, generate_dealer_code
from app.exceptions.handlers import BusinessException

class ContactService:
    @staticmethod
    def create_customer(db: Session, customer_in: CustomerCreate):
        if customer_repo.get_by_phone(db, phone=customer_in.phone):
            raise BusinessException("Customer with this phone number already exists", status_code=409)
            
        if customer_in.gst_number and customer_repo.get_by_gst(db, gst_number=customer_in.gst_number):
            raise BusinessException("Customer with this GST number already exists", status_code=409)
            
        if customer_in.credit_limit < 0:
            raise BusinessException("Credit limit cannot be negative", status_code=400)

        # Create with temp code
        customer_dict = customer_in.model_dump()
        customer_dict["customer_code"] = "TEMP"
        customer = customer_repo.create(db, obj_in=customer_dict)
        
        # Set real code
        customer.customer_code = generate_customer_code(customer.id)
        db.commit()
        db.refresh(customer)
        return customer
        
    @staticmethod
    def update_customer(db: Session, id: int, customer_in: CustomerUpdate):
        customer = customer_repo.get(db, id=id)
        if not customer:
            raise BusinessException("Customer not found", status_code=404)
            
        if customer_in.phone and customer_in.phone != customer.phone:
            if customer_repo.get_by_phone(db, phone=customer_in.phone):
                raise BusinessException("Another customer is using this phone number", status_code=409)
                
        customer = customer_repo.update(db, db_obj=customer, obj_in=customer_in.model_dump(exclude_unset=True))
        db.commit()
        db.refresh(customer)
        return customer

    @staticmethod
    def create_dealer(db: Session, dealer_in: DealerCreate):
        if dealer_repo.get_by_phone(db, phone=dealer_in.phone):
            raise BusinessException("Dealer with this phone number already exists", status_code=409)
            
        if dealer_in.gst_number and dealer_repo.get_by_gst(db, gst_number=dealer_in.gst_number):
            raise BusinessException("Dealer with this GST number already exists", status_code=409)

        dealer_dict = dealer_in.model_dump()
        dealer_dict["dealer_code"] = "TEMP"
        dealer = dealer_repo.create(db, obj_in=dealer_dict)
        
        dealer.dealer_code = generate_dealer_code(dealer.id)
        db.commit()
        db.refresh(dealer)
        return dealer

    @staticmethod
    def update_dealer(db: Session, id: int, dealer_in: DealerUpdate):
        dealer = dealer_repo.get(db, id=id)
        if not dealer:
            raise BusinessException("Dealer not found", status_code=404)
            
        if dealer_in.phone and dealer_in.phone != dealer.phone:
            if dealer_repo.get_by_phone(db, phone=dealer_in.phone):
                raise BusinessException("Another dealer is using this phone number", status_code=409)
                
        dealer = dealer_repo.update(db, db_obj=dealer, obj_in=dealer_in.model_dump(exclude_unset=True))
        db.commit()
        db.refresh(dealer)
        return dealer
