# System Architecture

The Senthil Enterprises ERP relies on a modular, dual-mode architecture that completely decouples the frontend business logic from the storage layer.

## Overall System Architecture

```mermaid
graph TD
    Client[Browser / Client] --> SPA[Single Page Application]
    
    subgraph Frontend [Vanilla JS Frontend]
        SPA --> Router[Core Router]
        Router --> Controllers[Page Controllers]
        Controllers --> DataProvider((IDataProvider Interface))
        
        DataProvider -.->|API_MODE = 'offline'| OfflineProvider[OfflineDataProvider]
        OfflineProvider --> LocalStorage[(Local Storage)]
        
        DataProvider -.->|API_MODE = 'online'| APIProvider[ApiDataProvider]
    end
    
    APIProvider -->|HTTP / REST| API[FastAPI Gateway]
    
    subgraph Backend [FastAPI Backend]
        API --> AuthGuard[JWT Security & CORS]
        AuthGuard --> Routers[API Routers v1]
        Routers --> Services[Service Layer / Business Logic]
        Services --> Repositories[Repository Layer / CRUD]
        Repositories --> ORM[SQLAlchemy ORM]
    end
    
    ORM --> DB[(PostgreSQL Database)]
```

## Request Lifecycle (Backend)

1. **Request**: HTTP POST to `/api/v1/sales/`
2. **Middleware**: CORS validated.
3. **Security Guard**: `Depends(get_current_active_user)` verifies JWT.
4. **Router Validation**: Pydantic validates `InvoiceCreate` schema.
5. **Service Layer**: `SalesService.create_invoice()` evaluates business rules (e.g., check stock levels).
6. **Repository Layer**: `sales_repo.create()` and `inventory_repo.update()` execute within a single DB transaction.
7. **Commit/Rollback**: Transaction committed. If error occurs, rolled back safely.
8. **Response**: Standardized `StandardResponse` JSON format returned.
