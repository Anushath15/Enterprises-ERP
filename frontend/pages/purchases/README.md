# Purchases Module Architecture

This folder contains the RC3.3 redesign of the Purchases module. It is the reference implementation for all complex transactional modules.

## Folder Structure
- `index.js`: Main entry point (Lists purchases).
- `new.js`: Full-page form controller (`#/purchases/new`).
- **Core Logic**:
  - `PurchaseState.js`: Single source of truth. Dispatches events.
  - `PurchaseCalculator.js`: Financial math (GST, Line Total).
  - `PurchaseValidation.js`: Field, Row, Purchase validation.
  - `PurchaseAutosave.js`: Dirty-state 15s debounce autosave.
  - `PurchaseKeyboard.js`: Shortcut matrix.
- **UI Components**:
  - `PurchaseHeader.js`, `SupplierSection.js`, `ProductSearch.js`, `PurchaseTable.js`, `PurchaseRow.js`, `PurchaseSummary.js`, `PurchaseFooter.js`.

## Data Lifecycle
Load -> Edit -> Calculate -> State Changed -> Fire Event -> Autosave (if dirty) -> Save -> Validate

## Component Rules
- `render()` returns HTML string.
- `bindEvents()` attaches listeners to DOM.
- No business logic inside components. State mutations strictly via `PurchaseState`.

## Keyboard Shortcuts
- `F2`: Supplier, `F3`: Product Search, `Alt+N`: New Row, `Alt+Delete`: Delete Row, `Ctrl+S`: Save, `Esc`: Cancel.
- `Enter`: Next cell, `Shift+Enter`: Prev cell.
