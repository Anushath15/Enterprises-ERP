# Architecture

Senthil Enterprises ERP is built on a **Configuration-Driven Architecture**.

## Philosophy
The core philosophy is that "Sales", "Purchases", "Returns", and "Adjustments" are all variants of a single concept: **The Transaction**.

Instead of copying and pasting UI code, we maintain one `TransactionPage.js` and inject behaviors into it via a declarative configuration object (`SalesConfig`, `PurchaseConfig`, etc.).

## The 4 Pillars

1. **Transaction Framework**: The universal UI and state engine for all document-based workflows.
2. **Domain Services**: `CustomerService`, `InventoryService`, `SalesService`, etc. encapsulate business logic so the UI never touches raw data or storage providers directly.
3. **Data Provider Multiplexer**: The `DataProvider` abstracts `localStorage` (offline) and `fetch` (API) away from Domain Services.
4. **Middleware Pipeline**: A custom Redux-lite implementation allows injecting custom business rules (like `InventoryMiddleware`) before data hits the generic reducers.
