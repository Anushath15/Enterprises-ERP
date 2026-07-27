# Senthil Enterprises ERP - Integration Guide

## Dual Mode Architecture

The ERP frontend is designed to run in two distinct modes without altering the UI or page controllers:

### 1. Offline Mode (Development & Fallback)
- **Data Source**: LocalStorage API.
- **Provider**: `OfflineDataProvider`.
- **Latency**: 0ms.
- **Usage**: Used for initial prototyping, offline fallback, and scenarios where a backend is unavailable.

### 2. Online Mode (Production)
- **Data Source**: PostgreSQL via FastAPI Backend.
- **Provider**: `ApiDataProvider`.
- **Latency**: Network dependent (Asynchronous).
- **Usage**: The primary production mode ensuring centralized data consistency and multi-user concurrency.

## Switching Modes

You can toggle between Offline and Online modes by modifying a single variable in `frontend/config/env.js`:

```javascript
export const config = {
  // Set to 'online' to connect to FastAPI
  // Set to 'offline' to use LocalStorage
  API_MODE: 'online',
  
  API_BASE_URL: 'http://localhost:8000/api/v1'
};
```

## The DataProvider Abstraction

All page controllers (e.g. `products.js`, `pos.js`) route their requests through a central `DataProvider` factory (`frontend/services/dataProvider.js`). This factory automatically exports either `OfflineDataProvider` or `ApiDataProvider` based on the `API_MODE` configuration.

```mermaid
flowchart TD
    A[Page Controller] -->|await DataProvider.getProducts()| B{API_MODE}
    B -->|'online'| C[ApiDataProvider]
    B -->|'offline'| D[OfflineDataProvider]
    C -->|Fetch| E[FastAPI Backend]
    D -->|Read/Write| F[LocalStorage]
```

## Centralized API Client

When operating in Online mode, the `ApiDataProvider` delegates all HTTP requests to `apiClient.js`.

The `ApiClient` is responsible for:
1. **JWT Injection**: Automatically attaching `Authorization: Bearer <token>`.
2. **StandardResponse Unwrapping**: Stripping the `{ success, message, data }` envelope and returning only the `data` payload to the provider.
3. **Error Handling**: Centrally catching `401 Unauthorized`, `403 Forbidden`, and `400 Bad Request` exceptions and firing UI events.
