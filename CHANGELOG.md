# Changelog

All notable changes to the Senthil Enterprises ERP project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
