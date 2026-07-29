# Changelog

All notable changes to the Senthil Enterprises ERP project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0-rc3] - 2026-07-29

### Added
- **Profit Analysis**: Added a 7-day Gross and Net Profit tracker to the Dashboard.
- **Stock Adjustments**: Added manual stock addition/reduction tracking (`stock_adjustments.js`).
- **Product Categories**: Added dedicated module for category management.
- **Barcode Generation**: Implemented 1-click Code128 thermal label generation in product catalogs via `JsBarcode`.
- **Expanded Expenses**: Upgraded expense categorizations based on pilot testing (Electricity, Labour, Loading/Unloading, etc.).
- **POS Improvements**: Added per-item discount controls (Percentage & Flat Amount). Added split CGST/SGST display.
- **Dashboard Enhancements**: Added 1-click Low Stock purchasing. Added live clock and End-of-Day procedure enforcement on the Daily Closing module.
- **Multi-Unit Support**: Switched free-text units to strict dropdown selections for data consistency.
- **Schema Migrations**: Added automatic `migration_rc3.js` to safeguard customer data during version upgrades.

### Fixed
- Fixed bug causing cursor jumps when typing quantities in POS.
- Disentangled "Save" and "Print" actions in the POS screen.

## [1.0.0] - Production Release

### Added
- **Frontend SPA**: Vanilla JavaScript, TailwindCSS, routing, and modular components.
- **Dual-Mode Data Architecture**: `IDataProvider` implementation switching between `OfflineDataProvider` (LocalStorage) and `ApiDataProvider` (FastAPI).
- **Backend Foundation**: FastAPI REST server, SQLAlchemy ORM, and PostgreSQL integration.
- **Authentication**: JWT-based security with Bcrypt password hashing and role-based access control.
- **Product Module**: Hierarchical catalogs (SKU, Categories, Brands).
- **Inventory Engine**: Real-time stock calculation preventing negative inventory via DB transactions.
- **Contacts Module**: Unified directory for Customers and Dealers featuring dynamic credit ledger tracking.
- **Sales Engine**: POS checkout, stock deduction, and automated credit balance increments.
- **Purchase Engine**: Inbound stock handling and automated payable balance increments.
- **Expense Tracker**: Daily operational cost recording.
- **Financial Reconciliation**: Daily Closing calculator matching expected register cash to actual counts.
- **Reports Dashboard**: Aggregated financial and transactional KPIs.
- **Production Hardening**: Audit logging, unique `ErrID` stack-trace masking, login rate limiting, and CORS lockdown.
- **Documentation**: Exhaustive API specs, Architecture diagrams, Developer guides, and User Manuals.

### Breaking Changes
- N/A (Initial Release)

### Known Limitations
- Offline data generated in `API_MODE='offline'` currently does not synchronize with the PostgreSQL backend when the internet returns. (Planned for V2).
- Printing relies entirely on browser-level `CTRL+P` CSS media queries. No direct receipt-printer IP integration is present.
- Barcode scanning relies on piping text into the search bar. No dedicated serial integration.
