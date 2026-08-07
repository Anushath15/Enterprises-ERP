# Senthil Enterprises ERP - Version 1.0 Release Notes

**Status:** Released
**Development Status:** Maintenance Mode
**Release Date:** July 2026

## Project Overview
The Senthil Enterprises ERP (Version 1.0) is a fully integrated, offline-first business management system custom-built for retail and wholesale hardware operations. The primary objective of V1.0 was to establish a stable, secure, and maintainable foundation capable of managing Products, Customers, Dealers, Sales, Purchases, and Financial ledgers with absolute transactional safety.

## Technology Stack
- **Frontend**: Vanilla JavaScript (ES6+), HTML5, CSS3.
- **Frontend Architecture**: Component-based SPA (Single Page Application) with custom hash-based routing.
- **Backend**: FastAPI (Python 3.12+).
- **Database**: PostgreSQL 16 (accessed via SQLAlchemy 2.0 & Psycopg v3).
- **Security**: JWT-based Authentication, Bcrypt Password Hashing, Role-Based Access Control (RBAC).

## Architecture Summary
The ERP utilizes a dual-mode data architecture:
- **Offline Mode**: Operates entirely within the browser's `LocalStorage` via the `OfflineDataProvider`. Ensures zero downtime during internet outages.
- **Online Mode**: Communicates securely with the FastAPI backend via the `ApiDataProvider` for persistent, multi-user concurrency.
- Switch between modes seamlessly by toggling `API_MODE` in `frontend/config/env.js`.

## Implemented Modules
1. **Authentication & RBAC**: Secure login with Admin, Manager, and Sales roles.
2. **Products**: Complete SKU and pricing management with dynamic stock levels.
3. **Contacts (Customers & Dealers)**: Centralized management including real-time Outstanding Balance tracking.
4. **Sales Transaction Engine (POS)**: Multi-item cart checkout, automatic stock reduction, and automatic customer ledger updates. Enforces strict insufficient stock barriers.
5. **Purchase Transaction Engine**: Inbound inventory processing, stock increments, and dealer payable ledger updates.
6. **Expenses**: Daily operational cost tracking.
7. **Daily Closing**: Automated physical cash vs system cash reconciliation.
8. **Reports & Analytics**: Read-only data aggregation preventing desynchronization.

## API & Database Summary
- **API**: Fully RESTful interface strictly returning a standardized `StandardResponse` model (`{success, message, data, errors, meta}`).
- **Database**: 7 core relational tables (Users, Products, Customers, Dealers, Sales Invoices, Purchase Invoices, Expenses) with enforced Foreign Keys and Soft Deletes.
- **Migrations**: Fully managed by Alembic.

## Deployment & Recovery
- **Deployment**: Refer to `DEPLOYMENT_GUIDE.md` for Nginx + Uvicorn/Gunicorn production setup instructions.
- **Backup Strategy**: It is recommended to configure `pg_dump` on a nightly cron job backing up to a secure off-site location (e.g., AWS S3).
- **Environment**: Ensure `.env` is populated securely based on the provided `.env.example` template.

## Known Limitations (V1.0)
- **Offline Sync Delay**: Transactions logged in Offline Mode do not automatically synchronize to the PostgreSQL backend when the connection is restored. They currently require manual reconciliation.
- **Hardware Integration**: Thermal printers and barcode scanners are not yet natively integrated via raw drivers (relies on browser defaults).

## Future Roadmap
Planning for Version 2.0 will commence *only* after Version 1.0 completes a successful 1-2 week pilot run in the actual shop alongside the legacy cash registers. Planned enhancements include barcode scanning, thermal printing, and multi-branch support. Detailed in `VERSION_2_BACKLOG.md`.

## Version History
- **v1.0.0**: Initial Production Release. Architecture Frozen.
