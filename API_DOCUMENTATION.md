# API Documentation

This document outlines the REST API contract for Senthil Enterprises ERP. All endpoints (except `/auth/login` and `/health`) require a valid JWT passed in the `Authorization: Bearer <token>` header.

## Standard Response Format
All endpoints return a predictable JSON envelope:
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... },
  "errors": null
}
```

---

## 1. Authentication
### `POST /api/v1/auth/login`
- **Purpose**: Authenticates a user and issues a JWT.
- **Auth Required**: No.
- **Request Body**: `{"username": "admin", "password": "password123"}`
- **Response**: `{"access_token": "eyJ...", "token_type": "bearer"}`

### `GET /api/v1/auth/me`
- **Purpose**: Returns current logged-in user profile and permissions.

---

## 2. Products & Inventory
### `GET /api/v1/products/`
- **Purpose**: Retrieve catalog. Supports pagination (`?skip=0&limit=100`).
### `POST /api/v1/products/`
- **Purpose**: Create a new product.
- **Request Body**: `{"sku": "PRD-01", "name": "Pipe", "category_id": 1, "brand_id": 1, "purchase_price": 100, "selling_price": 150, "gst_rate": 18, "current_stock": 50}`

---

## 3. Contacts
### `GET /api/v1/contacts/customers`
- **Purpose**: Retrieve customer directory with live outstanding balances.
### `GET /api/v1/contacts/dealers`
- **Purpose**: Retrieve dealer directory with live payable balances.

---

## 4. Sales Engine
### `POST /api/v1/sales/`
- **Purpose**: Records a sale, deducts inventory, updates customer credit ledger.
- **Request Body**: 
```json
{
  "customer_id": 1,
  "items": [
    {"product_id": 5, "quantity": 2, "unit_price": 150}
  ],
  "discount": 0,
  "amount_paid": 300,
  "payment_method": "CASH"
}
```
- **Validation Rules**: Total quantity cannot exceed `current_stock`. Otherwise returns `400 Insufficient Stock`.

---

## 5. Purchase Engine
### `POST /api/v1/purchases/`
- **Purpose**: Records inbound stock, increments inventory, updates dealer payable ledger.

---

## 6. Financials
### `POST /api/v1/expenses/`
- **Purpose**: Record an operational expense.
### `GET /api/v1/daily-closing/today`
- **Purpose**: Calculate live expected cash-in-hand based on today's transactions.

---

## 7. Operational Health
### `GET /api/v1/health/`
- **Purpose**: Process health check.
### `GET /api/v1/health/database`
- **Purpose**: Validates PostgreSQL connection pool.
