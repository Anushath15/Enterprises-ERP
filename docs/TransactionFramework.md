# Transaction Framework

The Transaction Framework is a generic, reusable system designed to handle complex tabular data entry for invoices, purchases, returns, and POS modules.

## Components

1. **`TransactionPage(config)`**: The master component that renders the layout, instantiates the store, and orchestrates events.
2. **`EntityLookup`**: Renders the header inputs (e.g. Supplier/Customer selection, Reference No, Date).
3. **`TransactionSearch`**: The omni-search bar where users type to find and add products to the transaction.
4. **`TransactionTable`**: The core tabular grid that displays the line items.
5. **`TransactionRow`**: A single row in the table, responsible for inline editing, quantity updates, and deletion.
6. **`TransactionFooter`**: Handles Grand Total calculation, Payment Mode selection, and Save/Draft actions.

## Configuration Injection

Each business module injects a configuration object into the generic framework.

```javascript
export const SalesConfig = {
  moduleName: 'sales',
  entityType: 'customer',
  entityIdField: 'customerId',
  entityLabel: 'Customer',
  theme: {
    primary: 'text-blue-600',
    bg: 'bg-blue-600',
    border: 'border-blue-600'
  },
  
  // Custom Reducer (wraps the baseReducer)
  reducer: salesReducer,
  
  // Custom Domain Actions
  onSave: async (state) => {
    return SalesService.create(state);
  }
};
```
