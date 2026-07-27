from app.core.config import settings

def generate_business_code(prefix: str, numeric_id: int, padding: int = 6) -> str:
    """
    Generates a standard business code.
    Example: 'PRD', 152 -> 'PRD-000152'
    """
    padded_id = str(numeric_id).zfill(padding)
    return f"{prefix}-{padded_id}"

def generate_product_code(product_id: int) -> str:
    return generate_business_code(settings.PRODUCT_PREFIX, product_id)

def generate_customer_code(customer_id: int) -> str:
    return generate_business_code(settings.CUSTOMER_PREFIX, customer_id)

def generate_dealer_code(dealer_id: int) -> str:
    return generate_business_code(settings.DEALER_PREFIX, dealer_id)

def generate_sales_invoice_number(invoice_id: int) -> str:
    return generate_business_code(settings.SALES_PREFIX, invoice_id)

def generate_purchase_invoice_number(invoice_id: int) -> str:
    return generate_business_code(settings.PURCHASE_PREFIX, invoice_id)

def generate_expense_number(expense_id: int) -> str:
    return generate_business_code(settings.EXPENSE_PREFIX, expense_id)
