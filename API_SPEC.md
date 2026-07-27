# API Specification (Draft)

This document describes the upcoming FastAPI REST API definitions that `ApiDataProvider` will consume.

## Base URL
`/api/v1`

## Response Envelope Standard
All endpoints will return a standardized envelope:
\`\`\`json
{
    "success": true,
    "message": "Operation successful",
    "data": {},
    "errors": null
}
\`\`\`

## Expected Endpoints
### Products
- `GET /products`
- `GET /products/{id}`
- `POST /products`
- `PUT /products/{id}`
- `DELETE /products/{id}`

### Customers
- `GET /api/v1/customers` (Paginated, Searchable)
- `POST /api/v1/customers`
- `GET /api/v1/customers/{id}`
- `PUT /api/v1/customers/{id}`
- `DELETE /api/v1/customers/{id}`

### Dealers
- `GET /api/v1/dealers` (Paginated, Searchable)
- `POST /api/v1/dealers`
- `GET /api/v1/dealers/{id}`
- `PUT /api/v1/dealers/{id}`
- `DELETE /api/v1/dealers/{id}`

### Sales / POS
- `GET /api/v1/sales` (Paginated, Searchable)
- `POST /api/v1/sales` (Creates invoice, deducts inventory, handles credit logic transactionally)
- `GET /api/v1/sales/{id}`
- `GET /api/v1/sales/{id}/items`

### Purchases
- `GET /api/v1/purchases` (Paginated, Searchable)
- `POST /api/v1/purchases` (Creates purchase, increases inventory, handles credit logic transactionally)
- `GET /api/v1/purchases/{id}`
- `GET /api/v1/purchases/{id}/items`

### Expenses
- `GET /api/v1/expenses/categories`
- `POST /api/v1/expenses/categories`
- `GET /api/v1/expenses`
- `POST /api/v1/expenses`
- `GET /api/v1/expenses/{id}`

### Daily Closing
- `GET /api/v1/daily-closing`
- `POST /api/v1/daily-closing`

### Dashboard
- `GET /api/v1/dashboard/summary`

### Reports
- `GET /api/v1/reports/sales` (Filters: start_date, end_date, customer_id)
- `GET /api/v1/reports/purchases` (Filters: start_date, end_date, dealer_id)
- `GET /api/v1/reports/expenses` (Filters: start_date, end_date)
- `GET /api/v1/reports/inventory` (Filters: low_stock_only)
- `GET /api/v1/reports/customers` (Outstanding balances)
- `GET /api/v1/reports/dealers` (Outstanding balances)

### Authentication
- `POST /api/v1/auth/login` (Returns StandardResponse wrapping token & user profile)
- `POST /api/v1/auth/logout` (Audit log record generated)
- `GET /api/v1/auth/me` (Profile and RBAC permissions)
- `POST /api/v1/auth/change-password` (Requires old password)
