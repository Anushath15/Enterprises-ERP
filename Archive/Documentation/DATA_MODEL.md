# Data Model

The core business entities utilized by the frontend applications. In `offline` mode, these are stored in `localStorage` with `erp_` prefixes.

## Primary Entities

1. **Product (`erp_products`)**:
   - `id`: string (PRD-XXX)
   - `name`: string
   - `category`: string
   - `price`: number
   - `stock`: number
   - `isActive`: boolean

2. **Customer (`customers`)**:
   - `id`: Integer PK
   - `customer_code`: String (CUS-XXX)
   - `name`, `phone`, `alternate_phone`, `gst_number`
   - `address`, `city`, `district`, `state`, `postal_code`
   - `credit_limit`, `outstanding_balance`
   - `last_purchase_date`
   - Audit fields (`created_at`, `is_active`, etc.)

3. **Dealer (`dealers`)**:
   - `id`: Integer PK
   - `dealer_code`: String (DLR-XXX)
   - `name`, `contact_person`, `phone`, `gst_number`
   - `address`, `payment_terms`
   - `outstanding_balance`
   - Audit fields (`created_at`, `is_active`, etc.)

4. **Sales Invoice (`sales_invoices`)**:
   - `id`: Integer PK
   - `invoice_number`: String (SAL-XXX)
   - `customer_id`: Integer FK
   - `subtotal`, `discount`, `tax_total`, `total_amount`: Float
   - `payment_type`: String (Cash, UPI, Credit)
   - `payment_status`: String (Paid, Unpaid, Partial)

5. **Sales Items (`sales_items`)**:
   - `id`: Integer PK
   - `invoice_id`: Integer FK
   - `product_id`: Integer FK
   - `quantity`, `unit_price`, `subtotal`: Float

6. **Purchase Invoice (`purchase_invoices`)**:
   - `id`: Integer PK
   - `purchase_number`: String (PUR-XXX)
   - `dealer_id`: Integer FK
   - `subtotal`, `discount`, `tax_total`, `total_amount`: Float
   - `payment_type`: String (Cash, UPI, Credit)
   - `payment_status`: String (Paid, Unpaid, Partial)

7. **Purchase Items (`purchase_items`)**:
   - `id`: Integer PK
   - `invoice_id`: Integer FK
   - `product_id`: Integer FK
   - `quantity`, `unit_price`, `subtotal`: Float

8. **Inventory Movement (`inventory_movements`)**:
   - `id`: Integer PK
   - `product_id`: Integer FK
   - `movement_type`: String (SALE, PURCHASE, etc)
   - `quantity_change`, `resulting_stock`: Float
   
9. **Audit Log (`audit_logs`)**:
   - Tracking systemic operations and transactional history.
   
10. **Expense Category (`expense_categories`)**:
    - `id`: Integer PK
    - `name`: String
    
11. **Expense (`expenses`)**:
    - `id`: Integer PK
    - `expense_number`: String (EXP-XXX)
    - `category_id`: Integer FK
    - `amount`: Float
    - `payment_method`: String (Cash, UPI, Bank)
    
12. **Daily Closing (`daily_closings`)**:
    - `id`: Integer PK
    - `business_date`: Date
    - `opening_cash`, `expected_cash`, `physical_cash`, `difference`: Float
    - `status`: String (Balanced, Short, Excess)

13. **Users (`users`)**:
    - `id`: Integer PK
    - `username`: String UK
    - `hashed_password`: String
    - `role`: String (Admin, Manager, Sales)
    - `is_active`: Boolean
