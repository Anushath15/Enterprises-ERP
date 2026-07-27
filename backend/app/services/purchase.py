from sqlalchemy.orm import Session
from app.schemas.purchase import PurchaseInvoiceCreate
from app.repositories.purchase import purchase_repo, purchase_item_repo
from app.repositories.product import product_repo, inventory_repo
from app.repositories.contact import dealer_repo
from app.repositories.sales import movement_repo, audit_repo
from app.models.sales import PaymentType, PaymentStatus
from app.models.audit import MovementType
from app.utils.code_generator import generate_purchase_invoice_number
from app.exceptions.handlers import BusinessException

class PurchaseService:
    @staticmethod
    def create_invoice(db: Session, invoice_in: PurchaseInvoiceCreate):
        try:
            # 1. Validate Dealer
            dealer = dealer_repo.get(db, id=invoice_in.dealer_id)
            if not dealer:
                raise BusinessException("Invalid or inactive dealer", status_code=400)
                
            # 2 & 3. Validate Products and Setup Stock Increases
            subtotal = 0.0
            tax_total = 0.0
            items_to_create = []
            inventory_updates = []
            
            for item_in in invoice_in.items:
                product = product_repo.get(db, id=item_in.product_id)
                if not product:
                    raise BusinessException(f"Invalid or inactive product ID {item_in.product_id}", status_code=400)
                
                inventory = inventory_repo.get_by_product_id(db, product_id=product.id)
                if not inventory:
                    raise BusinessException(f"Inventory ledger missing for product {product.name}", status_code=500)
                    
                item_subtotal = item_in.quantity * item_in.unit_price
                item_tax = (item_subtotal * product.gst_percentage) / 100.0
                
                subtotal += item_subtotal
                tax_total += item_tax
                
                items_to_create.append({
                    "product_id": product.id,
                    "quantity": item_in.quantity,
                    "unit_price": item_in.unit_price,
                    "subtotal": item_subtotal
                })
                
                inventory_updates.append({
                    "inventory": inventory,
                    "addition": item_in.quantity,
                    "new_stock": inventory.current_stock + item_in.quantity
                })

            # 4. Calculate Totals
            total_amount = subtotal + tax_total - invoice_in.discount
            if total_amount < 0:
                raise BusinessException("Total amount cannot be negative", status_code=400)
                
            payment_status = PaymentStatus.UNPAID if invoice_in.payment_type == PaymentType.CREDIT else PaymentStatus.PAID

            # 5 & 6. Create Purchase Invoice
            invoice_dict = invoice_in.model_dump(exclude={"items"})
            invoice_dict.update({
                "purchase_number": "TEMP",
                "subtotal": subtotal,
                "tax_total": tax_total,
                "total_amount": total_amount,
                "payment_status": payment_status
            })
            
            invoice = purchase_repo.create(db, obj_in=invoice_dict)
            db.flush() # Get invoice ID
            invoice.purchase_number = generate_purchase_invoice_number(invoice.id)

            # 7. Create Purchase Items
            for item_data in items_to_create:
                item_data["invoice_id"] = invoice.id
                purchase_item_repo.create(db, obj_in=item_data)

            # 8 & 9. Increase Inventory & Create Movements
            for update in inventory_updates:
                inv = update["inventory"]
                inv.current_stock = update["new_stock"]
                db.add(inv)
                
                movement_repo.create(db, obj_in={
                    "product_id": inv.product_id,
                    "movement_type": MovementType.PURCHASE,
                    "reference_id": invoice.id,
                    "quantity_change": update["addition"], # Positive change for purchase
                    "resulting_stock": update["new_stock"],
                    "notes": f"Purchase via Invoice {invoice.purchase_number}"
                })

            # 10. Update Dealer Balance
            if invoice_in.payment_type == PaymentType.CREDIT:
                dealer.outstanding_balance += total_amount
                db.add(dealer)

            # 11. Create Audit Log
            audit_repo.create(db, obj_in={
                "action": "CREATE_PURCHASE_INVOICE",
                "entity_type": "PurchaseInvoice",
                "entity_id": invoice.id,
                "details": f"Created purchase invoice {invoice.purchase_number} for {total_amount}"
            })

            # 12. Commit Transaction
            db.commit()
            db.refresh(invoice)
            return invoice

        except Exception as e:
            db.rollback()
            raise e
