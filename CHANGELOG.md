# Changelog

## [Phase 7.9] - Current
- Performed Backend Integration Readiness Verification.
- Executed static analysis confirming 100% compliance with the `StandardResponse` API contract.
- Verified absence of debug logging and hardcoded credentials.
- Backend architecture declared feature-complete and integration-ready.

## [Phase 7.8]
- Implemented robust JWT-based Authentication & RBAC Authorization layer.
- Added `User` models, `AuthService`, and dedicated `/auth` endpoints.
- Encapsulated JWT token issuing, bcrypt password hashing, and dependency injection into `app/security`.
- Secured all existing business endpoints seamlessly without modifying existing service logic.

## [Phase 7.7]
- Implemented Reports & Analytics APIs.
- Extracted purely read-only aggregation queries into `ReportRepository` to prevent transaction mutation.
- Built explicit reports for Sales, Purchases, Expenses, Inventory, and Outstanding Balances.
- Added strict query param validation for Date Filters.

## [Phase 7.6]
- Implemented Expenses and Daily Closing APIs mapping strict financial workflows.
- Extracted Dashboard summary aggregations from real transactional boundaries.
- Introduced `ExpenseCategory`, `Expense`, and `DailyClosing` SQLAlchemy models to finalize the ERP ledger system.
- Hardcoded prevention of duplicate daily closings.

## [Phase 7.5]
- Fully implemented the Purchase Transaction Engine.
- Built strict transactional wrappers around Purchase creation, Stock additions, and Dealer balance updates.
- Integrated `InventoryMovement` creation automatically on purchases.

## [Phase 7.4]
- Fully implemented the Sales Transaction Engine.
- Built strict transactional wrappers around Invoice creation, Stock reduction, and Customer credit balance updates.
- Introduced `InventoryMovement` (Stock Ledger) and `AuditLog` models for full accounting history.

## [Phase 7.3]
- Fully implemented Customer and Dealer FastAPI modules (Models, Schemas, Services, Repositories).
- Centralized validation rules to prevent duplicate phone numbers and GST entries.
- Locked `outstanding_balance` to prevent manual overrides from standard CRUD updates.
- Extended pagination and search to contact ledgers.

## [Phase 7.2]
- Initialized FastAPI backend environment with strictly typed Pydantic models.
- Set up domain-driven `app` structure.
- Implemented Products, Categories, Brands, and Inventory ledger logic in SQLAlchemy.

## [Phase 6.5]
- Fully wired Add/Edit/Delete flows for Products, Customers, Sales (POS), Purchases, and Expenses.
- Centralized transactional logic into DataService for inventory mapping and customer balance mapping.
- Introduced `DataProvider` abstraction (`OfflineDataProvider`, `ApiDataProvider`) allowing transparent toggle between local storage mock data and future FastAPI implementation.
- Finalized frontend documentation.

## [Phase 5]
- Migrated all remaining screens from static HTML files into SPA controllers.
- Completed full 22 screen navigation architecture.
- Modularized component usage across POS, Dashboard, and Lists.

## [Phase 4]
- Refactored frontend to support Vanilla JS SPA architecture.
- Abstracted UI buttons and cards into reusable JS functions.
- Introduced `app.js` and `router.js` for client-side routing.
