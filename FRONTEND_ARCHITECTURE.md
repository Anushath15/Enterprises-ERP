# Frontend Architecture

The Senthil Enterprises ERP frontend is a custom-built Vanilla JavaScript Single Page Application (SPA). It completely decouples the user interface from the backend data layer.

## Core Design Principles

1. **SPA Routing**: The `app.js` and `router/router.js` handles client-side routing by dynamically loading page controllers from the `pages/` directory and injecting their HTML into the `main-content` DOM node.
2. **Component-Based UI**: Reusable UI elements (buttons, cards, forms) are exported as template literal functions from the `components/` directory.
3. **Provider Abstraction (IDataProvider)**: 
   The application logic never speaks directly to an API or LocalStorage. It only communicates with `DataProvider`.
   - `OfflineDataProvider`: Serializes models into `localStorage`.
   - `ApiDataProvider`: (Future) Contacts FastAPI endpoints.
   - `config/env.js`: Controls which provider is actively serving the frontend.
4. **Event-Driven**: Controllers use Custom DOM Events (`window.dispatchEvent`) to handle cross-component interactions (like opening slide-over drawers).

## Folder Structure

```
frontend/
├── index.html           # Main entry point and layout shell
├── app.js               # Application initialization and router setup
├── assets/              # Global CSS (index.css)
├── components/          # Reusable UI functions (ui/buttons.js, business/productCard.js)
├── config/              # env.js (API mode settings)
├── data/                # seedData.js (Default initialization data)
├── pages/               # Controllers for each route (pos.js, products.js)
├── router/              # SPA Routing engine
└── services/            # dataProvider.js, offlineDataProvider.js, apiDataProvider.js
```

## Offline Workflow
If the application loads with an empty `localStorage`, the `OfflineDataProvider` will automatically seed default data (mock products, customers, dealers, etc.) via `seedData.js`. Subsequent transactions (like `saveSalesInvoice`) will directly mutate the stored JSON, updating inventories and customer balances persistantly.
