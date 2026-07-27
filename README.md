# Senthil Enterprises ERP

A modern, offline-first, Single Page Application (SPA) designed to manage the retail operations of Senthil Enterprises.

## Project Status: 🚀 Backend Architecture Complete (Pre-Integration)

The backend has successfully reached feature completion and integration readiness. All foundational modules (Products, Sales, Purchases, Expenses, Daily Closing, Reports, and Authentication) have been engineered, secured via JWT RBAC, and unit-tested. 

The project is currently transitioning into **Phase 8: Frontend-Backend Integration**, where the existing `OfflineDataProvider` will be incrementally replaced by the live `ApiDataProvider`.

## Technologies Used
* **HTML5**: Semantic layout and core structure.
* **Vanilla JavaScript (ES6+)**: Core business logic and component controllers.
* **TailwindCSS via CDN**: Utility-first styling with custom branding colors.
* **Heroicons**: SVGs for iconography.

## Getting Started
To run the ERP locally:
1. Simply open `/frontend/index.html` in any modern web browser (Edge, Chrome).
2. No local server is required for the offline-first mode, though a standard static file server (e.g., `npx http-server ./frontend`) can be used.

## Architecture
See [FRONTEND_ARCHITECTURE.md](FRONTEND_ARCHITECTURE.md) for detailed structural information.
