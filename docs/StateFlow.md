# State Flow

The application manages state using a custom "Redux-lite" pattern, ensuring predictable data flows and easy debugging.

## The Middleware Pipeline

When a user interacts with the UI (e.g. scanning a barcode, clicking a button), an Action is dispatched.

1. **Action Dispatch**: `store.dispatch({ type: TransactionActions.ITEM_ADD, payload: product })`
2. **TransactionHistory**: Logs the action and state changes to the console.
3. **InventoryMiddleware**: Intercepts `ITEM_ADD` or `ITEM_UPDATE`. Validates stock availability. If stock is insufficient, it modifies the payload or throws an error (which the UI catches).
4. **CalculatorMiddleware**: Runs calculations after reducers have updated the state. Computes subtotal, tax, discounts, and grand totals.
5. **AutosaveMiddleware**: Debounces state changes and automatically saves to `localStorage` drafts.
6. **SaveMiddleware**: Intercepts `REQUEST_SAVE`. Triggers the `onSave` Domain action and clears the draft.

## Reducers

State is updated purely by standard reducers grouped logically:
- `header`: Managed by `entityReducer`.
- `items`: Managed by `itemReducer`.
- `summary`: Managed by `CalculatorMiddleware` directly.
- `payment`: Managed by `paymentReducer`.
- `metadata`: Managed by `metadataReducer`.

## Domain Services Interaction

When `REQUEST_SAVE` is triggered:
1. `TransactionPage` intercepts it via `SaveMiddleware`.
2. Calls `config.onSave(state)`.
3. `SalesConfig` routes this to `SalesService.create(state)`.
4. `SalesService` creates business logic entities (e.g., subtracting final inventory via `InventoryService`).
5. `SalesService` pushes the final DTO to `DataProvider.create('sales', data)`.
6. `DataProvider` saves it to `OfflineDataProvider` or `ApiDataProvider` based on environment configuration.
