# Developer Onboarding Guide

Welcome to the Senthil Enterprises ERP codebase! This document explains the architectural patterns used across the stack so you can safely contribute to Version 2.0 and beyond.

## 1. Architectural Philosophy
- **Separation of Concerns**: UI rendering is totally divorced from Data fetching. API routing is totally divorced from Database querying.
- **Offline-First Resilience**: If the internet drops, the shop must still be able to bill customers.

## 2. Frontend Conventions
The frontend is written in **Vanilla JS** (ES6 Modules) using TailwindCSS. There is no Webpack, Vite, or React overhead.

### DataProvider Abstraction
All UI components request data through an interface, not directly via `fetch()`.
```javascript
import { dataProvider } from '../config/env.js';

// The UI does not know if this is hitting LocalStorage or PostgreSQL
const products = await dataProvider.getProducts();
```
To add a new feature, you must implement it in **both** `OfflineDataProvider.js` and `ApiDataProvider.js` to ensure the dual-mode architecture survives.

## 3. Backend Conventions
The backend uses FastAPI and adheres strictly to the **Service-Repository Pattern**.

### Layer 1: Routers (`app/api/v1/`)
Routers only handle HTTP traffic, dependency injection (JWT auth), and Pydantic validation.
**Rule:** No `db.query()` logic is allowed in a router.

### Layer 2: Services (`app/services/`)
Services handle pure business logic. 
*Example: Checking if there is enough stock before allowing a sale to proceed.*

### Layer 3: Repositories (`app/repositories/`)
Repositories contain the raw SQLAlchemy queries. 
**Rule:** Repositories should not return HTTP errors. If a record isn't found, return `None`. The Service layer will raise the `BusinessException`.

## 4. Database Migrations
We use Alembic. If you add a new model to `app/models/`:
1. Ensure it inherits from `BaseModel` (which provides `id`, `created_at`, `updated_at`, `is_active`).
2. Import the model in `app/database/base.py`.
3. Run: `alembic revision --autogenerate -m "Add new table"`
4. Review the generated file in `alembic/versions/`.
5. Run: `alembic upgrade head`

## 5. Debugging
- All stack traces are intentionally hidden from API responses. Check the backend console output for the `ErrID: <uuid>` to find the exact line causing a 500 error.
