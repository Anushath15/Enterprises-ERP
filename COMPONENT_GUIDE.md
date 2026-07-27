# Component Guide

Senthil Enterprises ERP uses a functional component pattern. Components are pure functions that accept a props object and return an HTML template string.

## UI Components (`frontend/components/ui/`)

### `buttons.js`
- **`PrimaryButton(props)`**: Returns a solid primary-colored button with optional SVG icons.
- **`SecondaryButton(props)`**: Returns an outlined or neutral colored button.

### `cards.js`
- **`KPICard({ title, value, iconSvg, color })`**: Standardized dashboard metric cards.

## Business Components (`frontend/components/business/`)

### `productCard.js`
- **`ProductCard({ product })`**: Renders a grid-friendly product display card showing image placeholder, category, name, SKU, price, and stock levels.

## Slide-over Drawers (Pattern)
The application standardizes complex data entry (Add Product, New Purchase Order, Record Expense) using side-panel Drawers.

**Implementation Signature**:
1. HTML includes an `#overlay` and an `#aside.drawer` with `translate-x-full` classes.
2. Controller `onMount` binds a global `window.addEventListener('openXYZDrawer', ...)` to remove `translate-x-full` and show the overlay.
3. Close events add the classes back.
