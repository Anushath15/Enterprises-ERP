# Database Entity-Relationship (ER) Diagram

The PostgreSQL database leverages SQLAlchemy ORM with a strict relational model. Soft deletion (`is_active` flag) and timestamping (`created_at`, `updated_at`) are applied universally via a declarative abstract base class.

## Mermaid ER Diagram

```mermaid
erDiagram
    users {
        int id PK
        string username UK
        string hashed_password
        string role
        boolean is_active
        datetime created_at
    }
    
    categories {
        int id PK
        string name UK
        boolean is_active
    }
    
    brands {
        int id PK
        string name UK
        boolean is_active
    }
    
    products {
        int id PK
        string sku UK
        string name
        int category_id FK
        int brand_id FK
        decimal purchase_price
        decimal selling_price
        decimal gst_rate
        int current_stock
        boolean is_active
    }
    
    customers {
        int id PK
        string code UK
        string name
        string phone
        decimal outstanding_balance
    }
    
    dealers {
        int id PK
        string code UK
        string name
        string phone
        decimal outstanding_balance
    }
    
    sales_invoices {
        int id PK
        string invoice_number UK
        int customer_id FK
        datetime invoice_date
        decimal subtotal
        decimal tax_total
        decimal discount
        decimal grand_total
        decimal amount_paid
        string payment_status
        string payment_method
    }
    
    sales_items {
        int id PK
        int invoice_id FK
        int product_id FK
        int quantity
        decimal unit_price
        decimal tax_amount
        decimal line_total
    }
    
    purchase_invoices {
        int id PK
        string invoice_number UK
        int dealer_id FK
        datetime invoice_date
        decimal grand_total
        decimal amount_paid
        string payment_status
    }
    
    purchase_items {
        int id PK
        int invoice_id FK
        int product_id FK
        int quantity
        decimal unit_cost
        decimal line_total
    }
    
    expenses {
        int id PK
        string voucher_number UK
        string category
        decimal amount
        datetime date
        string payment_method
    }
    
    daily_closings {
        int id PK
        date date UK
        decimal opening_balance
        decimal cash_sales
        decimal customer_payments
        decimal cash_purchases
        decimal dealer_payments
        decimal expenses
        decimal expected_cash
        decimal actual_cash
        decimal difference
        boolean is_closed
    }
    
    audit_logs {
        int id PK
        string action
        string entity_type
        int entity_id
        string details
        datetime created_at
    }

    products }o--|| categories : "belongs to"
    products }o--|| brands : "belongs to"
    
    sales_invoices }o--|| customers : "billed to"
    sales_invoices ||--o{ sales_items : "contains"
    sales_items }o--|| products : "refers to"
    
    purchase_invoices }o--|| dealers : "bought from"
    purchase_invoices ||--o{ purchase_items : "contains"
    purchase_items }o--|| products : "refers to"
```

## Architectural Notes
- **Transactions**: Sales and Purchases wrap multiple inserts (Invoice, Items, Inventory deduction, Ledger update) inside a single DB session to guarantee ACID compliance.
- **Constraints**: Deleting a `Customer` with linked `SalesInvoices` is prevented via Foreign Key constraints. Soft deletes must be used instead.
