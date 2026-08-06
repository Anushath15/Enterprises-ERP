# Senthil Enterprises ERP — Complete Project Analysis & Data Collection

**Date:** 2026-08-04
**Repository:** `D:\Senthil Enterprises\BS Software` (branch `release/rc3`, commit `de7cef28`, 6 commits ahead of `origin/release/rc3`)
**Live URL:** `https://myapplication-2adb30a9.web.app` (Firebase static hosting)
**Audit verdict carried forward:** **42/100 — NOT READY FOR PRODUCTION** (see `PHASE1_BUG_REPORT.md`)

---

## 1. EXECUTIVE OVERVIEW

This is an **offline-first, vanilla-JavaScript single-page application** for a retail hardware/electrical/plumbing shop (Senthil Enterprises). It runs entirely on `localStorage` (~23 `erp_*` collection keys, ~755 seeded products) with a fully-built but **undeployed** FastAPI + PostgreSQL backend (14 tables, 6 Alembic migrations) sitting alongside but disconnected (`config.API_MODE='offline'`).

The project arc spans **RC1 (Jul 27) → RC2 with phase-1 bug fixes (Jul 29) → RC3 with phased feature work (Jul 29-30) → RC3.3 hardening (Aug 1) → v1.0 production hardening (Aug 2)** — including RBAC, input validation, backup/restore, export, and DB maintenance. The most recent audit (`PHASE1_BUG_REPORT.md`, 2026-08-03) found **13 open bugs** including 3 Critical accounting/data-shape defects after fixing a false-green auth-seeding flaw in the earlier "100/100" audit.

---

## 2. FRONTEND ARCHITECTURE

**Stack:** Vanilla ES Modules, no bundler. Loaded directly via `<script type="module">` from `frontend/index.html:46`. Tailwind via CDN runtime (`index.html:9`), Lucide icons via CDN (`:24`), SheetJS (`:22`), JsBarcode (`:26`), Google Fonts Inter (`:16-18`).

**Entry:** `frontend/app.js:145` — `DOMContentLoaded` → `App.init()` runs:
1. `MigrationRC3.run()` (RC2→RC3 schema backfill)
2. `DataProvider.init()` (offline provider first-boot seeding)
3. `BackupService.init()` (daily auto-backup)
4. `renderShell()` (AppLayout into `#app-root`)
5. `new Router('page-root')`

**Router:** `frontend/router/router.js` (163 lines) — hash-based (`hashchange` + `load`), lazy ES module imports per route, **race protection** via `_renderSeq` monotonic token, enforces `render()` + `onMount(rootElement)` + optional returned `cleanup()` lifecycle contract. Auth guard (`router.js:42-56`) checks `AuthService.hasValidSession()` and `AuthService.hasRole(roles)`.

**Routes:** 35 routes registered in `config/routes.js:6-252` — 33 auth-required (with role gates: `admin` / `manager` / `user`), 2 public (`/login`, `/404`). Default route `/` = Dashboard. Sidebar (`app.js:41-66`) shows 24 entries; hidden routes: `/purchases/new`, `/sales/new`, wizards, `/profile`, `/about`, `/help`, error pages.

**Config:**
- `config/env.js` (12 lines): `API_MODE: 'offline'`, `API_BASE_URL: 'http://localhost:8000/api/v1'`. The provider choice happens at module-eval: `config.API_MODE === 'online' ? ApiDataProvider : OfflineDataProvider` (`services/dataProvider.js:9-11`).
- `config/routes.js` (257 lines): centralized route registry.
- `utils/settingsSchema.js`: de facto feature-flag/app config under `erp_settings` key — shop info, invoice settings, inventory flags (`allowNegativeStock: false`, `autoUpdateStock: true`), backup (`autoBackupEnabled: true`), appearance, currency `INR ₹`, timezone `Asia/Kolkata`.

**State & Hooks:** `frontend/state/` and `frontend/hooks/` directories exist but are **completely empty** (verified `Get-ChildItem -Recurse -Force` = 0 files). State actually lives in: `authService.js` (auth/session events), `localStorageService.js` (JSON persistence), `settingsService.js` (`erp_settings`), `components/transaction/reducers/` (per-transaction local reducer pattern — closest to Redux). Cross-page messaging via `window` CustomEvents: `auth:changed`, `auth:logout`, `openCustomerDrawer`, `openCreditDrawer`, `openDeliveryDrawer`, `draftPurchase`.

**Utilities (7 files in `utils/`):** `debounce.js`, `escapeHtml.js` (9 lines, escapes `& < > " '`), `exportUtils.js` (243 lines, CSV/Excel column registry + en-IN formatters), `maintenanceUtils.js` (503 lines, pure health-check/repair planners), `password.js` (WebCrypto salted SHA-256, **ships `DEFAULT_PASSWORD='admin123'` at :10**), `settingsSchema.js` (224 lines), `validate.js` (form validators + GSTIN/PHONE/PIN/PAN regex).

---

## 3. DATA & SERVICE LAYER

**21 service files across 5 subdirs** (top-level, `domain/`, `storage/`, `network/`, `api/`+`auth/` empty stubs). **No middleware subsystem** (`services/middleware/` does not exist).

### Service inventory

| File | Lines | Purpose | Primary localStorage keys |
|---|---|---|---|
| `dataProvider.js` | 12 | Provider switch (offline/api by `API_MODE`) | none (delegates) |
| `offlineDataProvider.js` | 784 | Central offline business layer | 23 `erp_*` keys (see below) |
| `apiDataProvider.js` | 161 | FastAPI REST wrapper (stubs for returns/projects/staff = `[]`) | none |
| `authService.js` | 96 | Session, role normalization (admin/manager/user), JWT-style TTL | `auth_token`, `auth_user`, `auth_expires_at` (non-`erp_`) |
| `backupService.js` | 292 | Daily auto + manual backup; FNV-1a checksum; round-trip validate | `erp_last_backup`, `erp_last_auto_backup`; 22-key `BUSINESS_COLLECTIONS` whitelist |
| `restoreService.js` | 242 | Atomic restore with rollback | all `BUSINESS_COLLECTIONS` + 2 timestamps |
| `draftManager.js` | 103 | Gmail-style form autosave | `erp_drafts` |
| `exportService.js` | 200 | CSV/Excel/PDF (lazy CDN PDF) | reads 7 collections |
| `maintenanceService.js` | 268 | Stats, health-check, atomic repair, ERASE reset | `erp_maintenance_history` |
| `migration_rc3.js` | 127 | RC2→RC3 schema upgrade | `erp_db_version`, products, categories, invoices |
| `notificationService.js` | 28 | Toast proxy over `window.showToast` | none |
| `settingsService.js` | 98 | `erp_settings` CRUD + validate + theme/font | `erp_settings` |
| `storage/localStorageService.js` | 50 | JSON localStorage wrapper (try/catch → null/false) | transparent |
| `domain/salesService.js` | 42 | Build sales invoice from view-state | delegates to `DataProvider.saveSalesInvoice` |
| `domain/purchaseService.js` | 26 | Build purchase invoice | delegates |
| `domain/inventoryService.js` | 53 | In-memory stock reservation | delegates to `erp_products` |
| `domain/invoiceService.js` | 26 | Transaction-id generator by type | `erp_system_state` sequences |
| `domain/{product,customer,supplier}Service.js` | 14-19 each | Search/find helpers | delegates |
| `network/apiClient.js` | 108 | JWT fetch wrapper; 401 → `auth:logout` | `auth_token`, `auth_user` |

### Master table of `erp_*` localStorage collection keys

| # | Key | Purpose | Backed up? | Seeded? |
|---|---|---|---|---|
| 1 | `erp_system_state` | ID counters, sequences | ✅ REQUIRED | ✅ |
| 2 | `erp_settings` | Shop config, GSTIN, tax | ✅ REQUIRED (object) | ✅ |
| 3 | `erp_products` | Product master (stock on row) | ✅ REQUIRED | ✅ (755 records via `data/products.js`) |
| 4 | `erp_customers` | Customer ledger + `outstanding` | ✅ REQUIRED | ✅ (`[]`) |
| 5 | `erp_dealers` | Supplier/dealer ledger + `outstanding` | ✅ REQUIRED | ✅ (`[]`) |
| 6 | `erp_sales_invoices` | Sales invoice header + items | ✅ REQUIRED | ✅ (`[]`) |
| 7 | `erp_sales_returns` | Sales returns | ✅ | ✅ (`[]`) |
| 8 | `erp_purchases` | Purchase invoice header + items | ✅ REQUIRED | ✅ (`[]`) |
| 9 | `erp_purchase_returns` | Purchase returns | ✅ | ✅ (`[]`) |
| 10 | `erp_deliveries` | Delivery records | ✅ | ✅ (`[]`) |
| 11 | `erp_expenses` | Expense entries | ✅ REQUIRED | ✅ (`[]`) |
| 12 | `erp_stock_adjustments` | Inventory movement log | ✅ | lazy (migration) |
| 13 | `erp_daily_closings` | Latest daily closing | ✅ REQUIRED | lazy |
| 14 | `erp_daily_closing_history` | Closing history | ✅ | lazy (migration) |
| 15 | `erp_product_price_history` | Price audit trail | ✅ | lazy (migration) |
| 16 | `erp_categories` | Product categories | ✅ | lazy (migration) |
| 17 | `erp_expense_categories` | Expense categories | ✅ | lazy (defaults in-memory) |
| 18 | `erp_users` | User accounts (bcrypt hashes) | ✅ | ✅ (1 admin) |
| 19 | `erp_settings_history` | Settings audit log | ✅ | ✅ (`[]`) |
| 20 | `erp_house_projects` | Construction projects (active) | ✅ | lazy |
| 21 | `erp_warranties` | Warranty claims | ✅ | lazy |
| 22 | `erp_staff` | Staff directory | ✅ | ✅ (1 owner) |
| 23 | **`erp_credit_payments`** | Customer credit payments | **❌ NOT BACKED UP** | lazy |

**Auxiliary keys (not backed up by design):** `erp_notifications`, `erp_drafts`, `erp_db_version`, `erp_last_backup`, `erp_last_auto_backup`, `erp_last_restore`, `erp_maintenance_history`, `erp_opening_cash`, `erp_last_closed_date`. Legacy/dead: `erp_purchase_invoices` (seeded but never read), `erp_projects` (excluded from backup as "legacy").

### Seed data

- `frontend/data/seedData.js` (45 lines): initializes ~17 keys on first boot when `erp_system_state` absent. Seeds 1 owner (`EMP-001 Senthil Kumar`), 1 admin (`USR-01`), 755 products, empty customer/dealer/invoice arrays, `erp_settings` defaults.
- `frontend/data/products.js` (16,612 lines, ~400KB): `MasterProducts` array — 755 hardware/electrical/plumbing products (`PRD-SE000001`..`PRD-SE000755`).

### Backup/Restore fidelity gaps (verified)

1. **`erp_credit_payments`** — actively written by `offlineDataProvider.saveCreditPayment` (`:370,381`) but **completely missing from `backupService.BUSINESS_COLLECTIONS`** (`backupService.js:34-57`). Restore silently drops the entire customer credit-payment tail.
2. **`erp_projects` vs `erp_house_projects`** — provider exposes full CRUD on `erp_projects` (`offlineDataProvider.js:610-616`) using the same `PRJ` ID prefix as `erp_house_projects` (`:552`), but `erp_projects` is excluded from backup (`backupService.js:32`) while `erp_house_projects` IS backed up (`:54`). Active writes to `erp_projects` are lost on restore.

---

## 4. PAGES (40 files)

40 page files in `frontend/pages/` (root + `pages/purchases/` + `pages/sales/` subfolders). Each exports `render()` (async, returns HTML string) and optional `onMount(rootElement)` returning a `cleanup()` function captured by the router.

**Critical calculation pages:**

| Page | Route | KPIs computed | Key bug |
|---|---|---|---|
| `dashboard.js` | `/` | Today's sales, 7-day profit, receivables, payables, low/dead stock | **AUD-11** "Today's Collection" uses `amountPaid \|\| totalAmount` (unpaid = fully collected); **AUD-12** profit `p.id === item.id` fails for engine items |
| `pos.js` | `/pos` | None (billing) | Saves correct top-level totals (`totalAmount`, `cgstTotal`, `sgstTotal`, `paymentMode`, `amountPaid`, `paymentStatus`) |
| `sales.js` | `/sales` | Total invoices, revenue, today's sales, credit pending | Reads `inv.totalAmount \|\| inv.total` → **0 for engine invoices (AUD-01)** |
| `sales/new.js` (transaction engine) | `/sales/new` | None | **AUD-01/06**: saves `{id, customerId, date, items, summary, paymentMode:undefined, status:'Completed'}` — NO top-level totals |
| `purchases.js` + `purchases/index.js` | `/purchases` | None (list) | `index.js:18-32` overrides "New PO" button → `#/purchases/new` |
| `purchases/new.js` (transaction engine) | `/purchases/new` | None | **AUD-01/06**: same shape divergence as sales |
| `daily_closing.js` | `/daily-closing` | cashSales/UPI/card/credit, expectedCash | **AUD-02**: cumulative all-time sums (no date filter); **AUD-03**: no closing record persisted; **AUD-04**: repeatable close, fake lock banner; `supplierPaymentsCash=0` hardcoded (`:34`) |
| `reports.js` | `/reports` | Revenue, purchases, expenses, GST, profit, top products, stock health | **AUD-04**: date filter is a no-op (`:150-157`); reads `i.taxTotal \|\| i.taxAmount` → 0 for engine invoices |
| `credit_management.js` | `/credit-management` | Outstanding, # customers, **Overdue ₹0 (hardcoded)**, **Collections Today ₹0 (hardcoded)** | **AUD-08**: KPIs hardcoded (`:76-77`, `:44-45`); Export Report button no handler |
| `inventory.js` | `/inventory` | Stock value, low/dead stock | — |
| `expenses.js` | `/expenses` | Today's total, largest category | — |

### Billing-path invoice shape divergence (CRITICAL — AUD-01/P1B-06)

| Field | POS (`pages/pos.js:616-645`) | Engine (`services/domain/salesService.js:8-24`) |
|---|---|---|
| `totalAmount` | ✅ flat top-level | **❌ missing** (money in `summary`) |
| `taxTotal`, `cgstTotal`, `sgstTotal` | ✅ flat top-level | **❌ missing** |
| `subtotal`, `discount`, `taxableAmount` | ✅ flat top-level | **❌ missing** |
| `paymentMode`, `paymentStatus`, `amountPaid`, `status` | ✅ set explicitly | **❌ missing** (`paymentMode` reads `state.header.paymentMode` which is never set → undefined; `status:'Completed'` hardcoded) |
| `items[]` | flat: `{productId, name, qty, price, taxRate, discountPercent, discountAmount, total}` | raw `state.items` using configured `priceField` (`sellingPrice`) — NO `price` field, NO `total` field |
| `summary` | ❌ not present | `{subtotal, discountAmount, taxAmount, roundOff, grandTotal, discount}` — never read by any consumer |

**Impact:** Dashboard, Sales register, Daily Closing, Reports all read `inv.totalAmount || inv.total` and `inv.taxTotal || inv.taxAmount` → **every `/sales/new`-created invoice shows ₹0 revenue, ₹0 GST everywhere.**

---

## 5. COMPONENTS (38 files)

### Transaction engine (`components/transaction/` — 21 files)

The most sophisticated subsystem — a Redux-lite transaction engine composed of:

- **`TransactionPage.js`** — orchestrator factory: builds store with config reducer + middleware chain (`CalculatorMiddleware`, `SaveMiddleware`, `AutosaveMiddleware`, `InventoryMiddleware`, `HistoryMiddleware`) and composes `EntitySelector`/`Search`/`Table`/`Footer`.
- **`TransactionState.js`** — `createTransactionStore(rootReducer, initialState, middlewares)` with `getState/subscribe/dispatch/replaceState/undo/redo`.
- **`TransactionActions.js`** — action-type constants.
- **`reducers/{base,item,entity,metadata,payment}Reducer.js`** — combined sub-reducers.
- **`TransactionCalculator.js`** — pure `calculateDocument` / `calculateLine` (subtotal, discountAmount, taxAmount, roundOff, grandTotal; doc-level discount reduces both tax and subtotal proportionately).
- **`TransactionSearch.js`**, `TransactionTable.js`, `TransactionRow.js`, `TransactionFooter.js`, `TransactionKeyboard.js`, `EntitySelector.js`.
- **`ValidationEngine.js`** — `Required`, `Positive`, `MinItems` rule builders + `runValidations`.
- **`InventoryMiddleware.js`** — reserves/releases stock via `InventoryService.reservedStock`.

**Critical action-constant mismatch (AUD-05/P1B-09):**
- `TransactionActions.ITEM_DELETE = 'ITEM_DELETE'`
- `reducers/itemReducer.js` handles BOTH `'ITEM_REMOVE'` (literal string, filters by `payload.id`) AND `TransactionActions.ITEM_DELETE` (filters by `payload.index`).
- `TransactionRow.js:64-68` dispatches `TransactionActions.ITEM_DELETE` with `{id: itemId}` only — no `index`.
- Reducer enters `ITEM_DELETE` case, calls `state.filter((_, idx) => idx !== action.payload.index)` where `payload.index` is **undefined** → `idx !== undefined` always true → **nothing is removed.**
- `InventoryMiddleware.js:73` releases reserved stock only on `'ITEM_REMOVE'` action which is never dispatched → **phantom stock holds.**

### UI components (`components/ui/` — 7 files)
`buttons.js` (PrimaryButton, IconButton, etc.), `cards.js` (Card, KPICard, MinimalStatCard), `designSystem.js` (AppLayout, SidebarManager, TopNavbar, Container, Section, KPIGrid, etc.), `forms.js`, `overlays.js` (Modal), `status.js` (Badge, ProgressBar), `tables.js` (Table, TableCell).

### Business/feedback/layout/navigation/charts/shared components
- `components/business/` — `cartItem.js`, `productCard.js` (presentational)
- `components/feedback/` — `feedback.js` (EmptyState, SkeletonCard, Toast shells)
- `components/layout/` — `layout.js` (legacy Sidebar/Navbar/Breadcrumb, superseded by designSystem)
- `components/navigation/` — `navigation.js` (Pagination, Tabs)
- `components/charts/` — `charts.js` (CSSBarChart)
- `components/shared/` — `ProductSearch.js` (**DEAD/BROKEN** — imports non-existent `./PurchaseState.js` and `./utils.js`; orphan `document.addEventListener('click')` at `:126` with no cleanup)

---

## 6. SECURITY

### XSS surfaces (verified)

`escapeHtml` (`utils/escapeHtml.js`, 9 lines) is consistently applied in pages with product/customer name interpolation: `pages/pos.js`, `pages/dashboard.js`, `pages/customers.js`, `pages/sales.js`, `pages/reports.js`, `pages/credit_management.js`, `pages/notifications.js:38-47`.

**Remaining XSS vectors:**
1. **`app.js:156-190`** — `window.showToast(message, type)` uses `textContent` for the message span (`:175`) — **toast text is safe**. (Phase-1 report P1B-10 claimed `innerHTML`; verified the actual implementation uses `textContent` — a prior fix appears to have remediated this.)
2. **`components/transaction/renderers/CellRenderers.js:12,18,23`** — `BarcodeCell`, `TextCell`, `UnitCell` interpolate `${val}` / `item[col.key]` raw into HTML without `escapeHtml`. Product `name`/`barcode`/`sku`/`unit` containing `<script>` would execute. **Highest accessible XSS surface.**
3. **`components/ui/{cards,status,tables,buttons,forms,layout,navigation,feedback,charts}`** — interpolate props without escaping. Currently low-risk (trusted callers pass computed numbers) but contract-unsafe.

### Auth

- **Offline mode:** `OfflineDataProvider.login` (`offlineDataProvider.js:79-101`) finds user in `erp_users`, blocks `Suspended`, validates via `verifyPassword` (WebCrypto salted SHA-256, `utils/password.js`). Mints synthetic token `offline-${Date.now().toString(36)}-${Math.random()...}` (not cryptographically signed).
- **Online mode:** JWT HS256 via `python-jose`, 24h TTL (`backend/.env:11`), `sub`=username only (roles not in token).
- **Session storage (offline):** `auth_token`, `auth_user`, `auth_expires_at` (non-`erp_` keys). TTL: 7d (remember) / 8h (`authService.js:28-29`).
- **Role normalization:** `authService.js:14-26` collapses labels (`'Administrator (Full Access)'` → `'admin'`, `'Sales User (Billing only)'` → `'user'`).
- **Bootstrap credential:** `utils/password.js:10` ships `DEFAULT_PASSWORD='admin123'` in plaintext for first-time login. Mirrored in backend migration `006_auth_schema.py:46`.
- **Backend RBAC:** Three roles (`Admin`, `Manager`, `Sales`) with `PERMISSION_MATRIX` (`backend/app/security/permissions.py:9-32`), but `RequirePermissions` dependency (`current_user.py:54-66`) is **never used** in any router — only authentication is enforced, not authorization.
- **CORS (backend):** Hardcoded `["http://localhost:5500", "127.0.0.1:5500", "localhost:3000"]` (`core/config.py:32`).

---

## 7. BACKEND (FastAPI + PostgreSQL — BUILT, NEVER DEPLOYED)

**Stack:** FastAPI 0.111, Uvicorn 0.30, SQLAlchemy 2.0 (new `Mapped[...]` declarative), Alembic 1.13, psycopg3-binary, pydantic 2.7, python-jose JWT, passlib bcrypt. Python 3.11 (confirmed by `cpython-311` pyc cache).

**Architecture (clean-style):** `main.py` → routers (11) → services (8) → repositories (7) → models (7) / schemas (9). Entry: `backend/app/main.py:8` creates `FastAPI(...)`, mounts all v1 routers under `/api/v1` (`main.py:53`).

### API surface (~43 endpoints under `/api/v1`)

**Public:** `health` (3: `/`, `/version`, `/database`), `auth` (4: `POST /auth/login`, `POST /auth/logout`, `GET /auth/me`, `POST /auth/change-password`).

**Protected (all require JWT):** `categories` (5), `brands` (5), `products` (5), `customers` (5), `dealers` (5), `sales` (4: POST, GET list, GET by id, GET items), `purchases` (4), `expenses` (4: categories + expenses), `daily-closing` (2), `dashboard` (1: `/dashboard/summary`), `reports` (6: sales, purchases, expenses, inventory, customers, dealers).

### Data models (14 tables via 6 Alembic migrations, head `006_auth_schema`)

`User`, `Category`, `Brand`, `Product` (no `current_stock` — that's on `Inventory`), `Inventory`, `Customer`, `Dealer`, `SalesInvoice`, `SalesItem`, `PurchaseInvoice`, `PurchaseItem`, `ExpenseCategory`, `Expense`, `DailyClosing`, `InventoryMovement`, `AuditLog`.

### Backend bugs

1. **`backend/app/repositories/report.py:80-86`** — queries `Product.current_stock` and `Product.minimum_stock` for inventory report and dashboard low-stock count. `Product` model has no `current_stock` column (it's on `Inventory` table). SQLAlchemy will raise `AttributeError` / SQL column-doesn't-exist against PostgreSQL.
2. **`backend/app/services/finance.py:139`** — dashboard summary uses `Product.current_stock <= Product.minimum_stock` — same bug.
3. **FK constraint bug** — `InventoryMovement.reference_id` is FK to `sales_invoices.id` (`models/audit.py:22`), but `PurchaseService` sets `reference_id=invoice.id` of a `PurchaseInvoice` (`services/purchase.py:90`) → FK violation on PostgreSQL.
4. **`AuditLog.entity_id`** — model declares `ForeignKey("sales_invoices.id")` (`models/audit.py:36`) but migration `003` does not. Mismatch between metadata-create (tests) and migration-applied (production) schemas.
5. **RBAC gap** — `RequirePermissions` dependency defined but never used in any router; only authentication enforced, not authorization.

### Backend secrets (committed in plaintext)

- `backend/.env:5` — `DATABASE_URL=postgresql://postgres:senthil123@127.0.0.1:5432/senthil_erp`
- `backend/.env:9` — JWT key `your-super-secret-key-goes-here` (the `config.py:38-40` guard only checks a different placeholder, so this passes silently)
- `backend/test_conn.py:4`, `setup_pg.py:19` — also contain the DB password.
- Migration `006_auth_schema.py:46` — bootstrap admin `admin123` (bcrypt-hashed).

### Deployment status

- **No Dockerfile, no docker-compose, no Procfile, no pyproject.toml, no nginx.conf, no systemd unit, no CI workflow.**
- `DEPLOYMENT_GUIDE.md` prescribes Ubuntu 22.04 + Gunicorn (`-w 4`) + Uvicorn worker + Nginx + Let's Encrypt — but none of these scripts are committed.
- Backend runs only as local `uvicorn app.main:app --reload` against the local PostgreSQL cluster (`pgsql/data/` contains a live PG 17.2 cluster).
- **Frontend deployment:** Firebase static hosting only (`firebase.json` → `public: frontend`, SPA rewrite to `/index.html`). No backend functions, no Firestore rules.
- `main` branch is frozen at commit `7b41f25a` (Jul 29, "chore: add firebase hosting configuration") — never received the v1.0 hardening commits (those are on `release/rc3`, 6 commits ahead, unpushed).

---

## 8. LISTENER HYGIENE & MEMORY

Every navigable page returns a `cleanup()` function (the router invokes it at `router.js:104-108` before the next render). Two standard styles:

1. **`addListener` collector:** page defines `__listeners = []` + `addListener(el, evt, handler)` push helper; cleanup iterates and `removeEventListener`s. Used by `reports.js`, `purchases.js`, `dealers.js`, `expenses.js`, `wizard_*.js`, `pos.js`.
2. **Monkey-patch style:** page overrides `rootElement.addEventListener` + `window.addEventListener` + `document.addEventListener` with tracking shims, restores originals in cleanup. Used by `settings.js`, `categories.js`, `login.js`, `dashboard.js`, `house_projects.js`, `credit_management.js`, `delivery.js`, `staff.js`, `users.js`, `warranty.js`, `stock_adjustments.js`, `sales_return.js`, `daily_closing.js`, `export_center.js`.

**Phase 6 measured leak (verified):** `scripts/test_event_audit.mjs` instruments `EventTarget.prototype.addEventListener` and navigates 10 routes → **net +84 listeners** (117 added, 33 removed). The leak primarily comes from pages attaching `window`/`document`/custom-event listeners where some paths don't arrange their custom-event listeners to be captured by the tracking shim, or from the `ProductSearch.js:126` orphan `document.click` (broken file).

---

## 9. TEST & QA HARNESS

### Root-level JS test scripts

| File | Purpose | Auth seed? |
|---|---|---|
| `run_qa.mjs` (root, 102 lines) | Puppeteer sweep 19 routes at `:5500` (wrong port), screenshots → `TEST_RESULTS.md` | **No** (false-green) |
| `scripts/run_qa.mjs` (140 lines) | Current QA: 26 routes × 9 viewports → `RUNTIME_VALIDATION_REPORT.md`. `npm run qa`. | **No** (false-green) |
| `verify_ui.js`, `verify_page.mjs` | DOM scan + icon count, single-route screenshot. | No |
| `verify_business_logic.js` | Phase 3 E2E: Purchase→Sale→Return credit math over DataProvider. | Pure data layer (no UI) |
| `stress_test.js` | Phase 4 perf: 2000 sales + 2000 purchases + 1000 returns. | No |
| `check.mjs` (gitignored) | Syntax-only: dynamic-import all transaction/purchases files to catch errors. | n/a |

### `scripts/` phase-6 harness (12+ files, all using corrected `loginApp()`)

`_harness.mjs` (118 lines) — shared: `BASE=http://127.0.0.1:5173`, `MAIN_ROUTES` (29 routes), `loginApp()` (seeds `auth_token`/`auth_user`/`auth_expires_at` as JSON.stringify — the fix), `launchBrowser()` (with `--enable-precise-memory-info --js-flags=--expose-gc`), `heap()`, `setOffline()` via CDP.

Test files: `test_workflow.mjs` (14/14 backup/restore round-trip), `test_event_audit.mjs` (listener leak — FAIL +84), `test_report.mjs` (generates `phase6_report.md`), `test_security.mjs`, `test_leaks.mjs`, `test_offline.mjs`, `test_settings.mjs`, `test_maintenance_center.mjs`, `test_export_center.mjs`, `test_recovery.mjs`, `test_performance.mjs`, `test_memory_leak.mjs`, `test_duplicate_events.mjs` (+2).

### Auth-seeding three schemas (the false-green root cause)

1. **Wrong (bare string, the 100/100 culprits):** original `run_qa.mjs` (both root and `scripts/`) seed nothing → router redirects to `/#/login` → "pass" rows were screenshots of the login wall.
2. **Wrong key (`erp_auth_token`):** `frontend/phase2b_suite.js:41`, `scripts/run_phase2b.mjs:50`, `scripts/run_validation.mjs:44`, `test_memory_leak.mjs:15`.
3. **Correct (Phase 6, post-fix):** `scripts/_harness.mjs:loginApp` at `:27-44` writes `localStorage.setItem('auth_token', JSON.stringify(token))` etc. — and a comment explaining the false-green history.

### Backend tests (7 unit + 1 integration)

`backend/tests/test_{auth,products,contacts,sales,purchases,finance,reports}.py` use in-memory SQLite + `Base.metadata.create_all()`. **`test_reports.py:95-102` will fail** on inventory report (`Product.current_stock` bug). `backend/tests/integration/test_business_workflows.py` uses wrong paths (`/api/v1/contacts/dealers/`) and wrong field names (`sku`/`outstanding`/`qty`/`total_price`/`payment_status='Credit'/'Paid Full'`) → **not runnable against the real app**.

---

## 10. GIT HISTORY & WORKTREES

### Arc of the project (oldest → newest)

```
07-27  ec27528e chore: Version 1.0 Final Release
07-28  10dbc651 Initial Release Candidate (v1.0.0-rc1)
07-28  ae62da4d docs: add comprehensive 25-chapter documentation book
07-29  a127c676 fix(phase1): resolve 5 critical bugs for pilot deployment
07-29  6872bbc1 feat(pilot): prepare v1.0.0-rc2 with tally import & wizards
07-29  ec3f9127 docs(qa): update QA screenshots & test results for rc2
07-29  7b41f25a chore: add firebase hosting configuration       <- main branch frozen here
07-29  aa91a8cc feat(db): implement rc3 schema migrations & data provider
07-30  60ba829e RC3 Phase 2: POS & Purchasing Upgrades
07-30  71595027 RC3 Phase 3: Products & Categories
07-30  70de862f RC3 Phase 4: Barcode Printing & Unit Support
07-30  846aa9fd RC3 Phase 7: Expenses & Daily Closing
07-30  18c1bc3e RC3 Phase 8: Profit Analysis & Dashboard
07-30  b407a869 RC3 Phase 10: Complete Regression & Documentation
07-30  fcffcbbf feat(RC3.1): Implement shop owner pilot feedback
08-01  d402f157 fix(RC3.3): Harden frontend against XSS & listener leaks
08-01  11b9d351 chore: ignore QA artifacts & untrack firebase hosting cache
08-02  d561c9f7 fix(v1.0): harden router and data providers against XSS, tampering & lifecycle
08-02  c95a59d3 feat(v1.0): add authentication and role-based access control
08-02  e23e0e16 feat(v1.0): add input validation across all forms
08-02  7135d74a Phase 1-2: Automatic Backup + Production Restore system (v1.0)
08-02  7b21d369 feat: Production Export Center (CSV/Excel/PDF) v1.0
08-02  de7cef28 feat: Production Database Maintenance Center v1.0   <- HEAD release/rc3
```

### Branches & worktrees

| Worktree path | Branch | HEAD | Remote? |
|---|---|---|---|
| `D:\Senthil Enterprises\BS Software` (main checkout, current) | `release/rc3` | `de7cef28` (Aug 2) | `origin/release/rc3` (6 behind) |
| `..\.worktrees\set-up-this-project-in-my-system` | `agents/set-up-this-project-in-my-system` | `7b41f25a` (Jul 29) | **local only** |
| `..\.worktrees\...\continue-hardening-the-erp-frontend-and-validate` (nested) | `agents/continue-hardening-the-erp-frontend-and-validate` | `7b41f25a` (Jul 29) | **local only** |
| — | `main` | `7b41f25a` (Jul 29) | `origin/main` |
| — | `agents/erp-architecture-complete-audit` | `1e8be37e` | `origin/agents/...` (1 ahead) |

**Two stale agent worktrees pinned to Jul 29 (5 days behind), both local-only (no remote backup).**

---

## 11. DOCS INVENTORY (34 markdown files)

**30 root .md** + 4 in `docs/` + 1 nested `frontend/pages/purchases/README.md`. Most important:

- `README.md` (148 lines) — project overview, badges `v1.0.0-rc3`, dual-mode arch, setup.
- `FINAL_PRODUCTION_AUDIT.md` (54 lines) — **claims 100/100 APPROVED on 2026-07-29** — proven false green (no auth seed).
- `PHASE1_BUG_REPORT.md` (61 lines) — **42/100 NOT READY, 13 open bugs P1B-01..13** (gitignored, scratch).
- `ENTERPRISES_ERP_DOCUMENTATION_BOOK.md` (634 lines) — 25-chapter documentation book.
- `CHANGELOG.md` (55 lines) — `[1.0.0-rc3.1] - 2026-07-30`, `[1.0.0] - Production Release`.
- `VERSION_1_RELEASE.md` (51 lines), `VERSION_2_BACKLOG.md` (32 lines — barcode, thermal printer, WhatsApp, Excel I/O, multi-branch, cloud sync).
- `SYSTEM_ARCHITECTURE.md`, `FRONTEND_ARCHITECTURE.md`, `DATA_MODEL.md`, `DATABASE_ER_DIAGRAM.md`, `SEQUENCE_DIAGRAMS.md`, `API_DOCUMENTATION.md`, `API_SPEC.md`, `DEVELOPER_GUIDE.md`, `DEPLOYMENT_GUIDE.md`, `USER_MANUAL.md`, `BACKUP_GUIDE.md`, `COMPONENT_GUIDE.md`, `INTEGRATION_GUIDE.md`, `CONTRIBUTING.md`, `QA_CHECKLIST.md` (6 sections PENDING), `PRODUCTION_CHECKLIST.md` (zero boxes checked), `BUG_LOG.md` (empty table), `UAT_BUG_REPORT_TEMPLATE.md`.
- `docs/Architecture.md`, `docs/FolderStructure.md`, `docs/StateFlow.md`, `docs/TransactionFramework.md`.

---

## 12. PACKAGE.JSON CONFIG

```jsonc
{
  "name": "bs-software",
  "version": "1.0.0-rc1",                  // drift (README says rc3, CHANGELOG says rc3.1)
  "main": "index.js",                      // non-existent (real entry: frontend/app.js)
  "scripts": { "dev": "live-server frontend --port=5173", "qa": "node scripts/run_qa.mjs" },
  "license": "ISC",                        // README says MIT
  "type": "commonjs",                       // root .js use CJS; .mjs use ESM
  "dependencies":    { "puppeteer": "^25.4.0", "xlsx": "^0.18.5" },
  "devDependencies": { "live-server": "^1.2.2" }
}
```

No `test`, no `start`, no `lint`, no `engines`, no `.nvmrc`. Anomalies: version drift, license drift, `main` non-existent.

---

## 13. FIREBASE / HOSTING

`.firebaserc` — project `myapplication-2adb30a9` (default).
`firebase.json` — `public: frontend`, SPA rewrite to `/index.html`, ignore firebase.json + dot-folders + node_modules. No functions, no Firestore rules, no Storage config — pure static hosting.

**Live URL:** `https://myapplication-2adb30a9.web.app` (per `FINAL_PRODUCTION_AUDIT.md:3`).

**Ignore list is thin** — does NOT exclude `frontend/data/seedData.js`, `frontend/scripts/debug_overlay.js`, `frontend/scripts/generate_dummy_data.js`, `frontend/phase2b_suite.js`, or `frontend/scratch/*.html` (7 tracked scratch HTML files) — all ship to the live URL.

---

## 14. ARTIFACT HYGIENE (verified against git)

| Artifact | Size | Tracked? | Ignored at .gitignore: |
|---|---|---|---|
| `node_modules/` | 41 MB | No | `:2` |
| `venv/` (root) | 12 MB | No | implicit |
| `backend/venv/` | — | No | `:15` |
| `pgsql/` | 867 MB (live PG 17.2 cluster, `trust` auth) | No | `:33` |
| `pg.zip` | 297 MB | No | `:34` |
| `out.js` (esbuild bundle, 18,745 lines) | 576 KB | No | `:58` |
| `debug.html` | 69 KB | No | `:55` |
| `check.mjs`, `find_forms.js`, `scratch_test*.js` | small | No | `:54,57` + untracked |
| `*_REPORT.md`, `ROUTE_STATUS.md`, `TASK_TRACKER.md` | small | No | `:51-53` |
| `PHASE1_BUG_REPORT.md` | 7 KB | No (gitignored scratch) | `:51` |
| `IMPORT_REPORT.md` | 0.8 KB | **Tracked** (committed before gitignore wildcard) | — |
| `FINAL_PRODUCTION_AUDIT.md`, `TEST_RESULTS.md`, `PRODUCTION_CHECKLIST.md`, `QA_CHECKLIST.md`, `BUG_LOG.md` | small | Tracked | — |

Two stray root files: `!DOCTYPE.html` (1.96 MB), `scratch_test_reports_stripped.js` (14.6 KB — a stripped `pages/reports.js` proving the date-filter no-op at line 252-256).

`pgsql/data/pg_hba.conf` uses **`trust` everywhere** (`:117` local, `:119-121` TCP) — no password auth. The `senthil123` password set by `setup_pg.py:19` is bypassed for local connections.

---

## 15. CONSOLIDATED ISSUE REGISTER (audit cross-reference)

| ID | Severity | Area | One-line |
|---|---|---|---|
| AUD-01 / P1B-06 | **Critical** | Transaction engine | Engine invoices persist only `summary` — no top-level `totalAmount`/`taxTotal`/`cgstTotal`/`amountPaid` → all KPIs/reports read ₹0 |
| AUD-02 / P1B-02 | **Critical** | Daily Closing | Cumulative all-time sums (no date filter) → cash book wrong from day 2 |
| AUD-03 / P1B-03 | **Critical** | Daily Closing | No closing record persisted (`submitDailyClosing` never called); repeatable close; fake lock |
| AUD-04 / P1B-04 | Medium | Reports | Date filter (Today/7d/30d) is a no-op (`reports.js:150-157`) |
| AUD-05 / P1B-09 | **High** | Transaction engine | `ITEM_DELETE` reducer filters by `payload.index` (undefined) → row delete silently fails; `InventoryMiddleware` releases on `'ITEM_REMOVE'` (never dispatched) → phantom stock |
| AUD-06 / P1B-10 | **High** | Security | CellRenderers (`BarcodeCell`/`TextCell`/`UnitCell`) interpolate raw values — stored XSS via product/barcode names |
| AUD-07 / P1B-01 | **High** | Memory | Listener leak +84 net over 10 navigations |
| AUD-08 / P1B-05 | Medium | Credit Management | Overdue/Collections Today/Due Amount/Due Date all hardcoded ₹0/- |
| AUD-09 | Medium | Backup/Restore | `erp_credit_payments` not in backup whitelist — restore drops credit-payment history |
| AUD-10 | Medium | Backup/Restore | `erp_projects` vs `erp_house_projects` key mismatch — active writes lost on restore |
| AUD-11 / P1B-07 | Medium | Dashboard | "Today's Collection" `amountPaid \|\| totalAmount` treats unpaid as fully collected |
| AUD-12 / P1B-07 | Medium | Dashboard | Profit lookup `p.id === item.id` fails for engine items (`item.id` is composite) |
| AUD-13 | **High** | Backend | `report.py:80-86` queries `Product.current_stock` (column on `Inventory`) → SQL error |
| AUD-14 | **High** | Backend | `InventoryMovement.reference_id` FK to `sales_invoices.id` but `PurchaseService` inserts PurchaseInvoice id → FK violation |
| AUD-15 | **High** | Backend | RBAC: `RequirePermissions` defined but never used — only auth enforced, not authorization |
| AUD-16 | **Critical** | Secrets | DB password (`senthil123`), JWT key (`your-super-secret-key-goes-here`), admin password (`admin123`) all committed in plaintext |
| AUD-17 / P1B-12 | Low | Daily Closing | Negative actual cash accepted; unguarded `JSON.parse` on `erp_settings` |
| AUD-18 / P1B-13 | Low | Production | `debug_overlay.js` shipped in `index.html:13` unconditionally; `TransactionKeyboard.js` log spam (debated) |
| AUD-19 | Medium | Tests | Backend integration test uses wrong paths/field names — not runnable |
| AUD-20 | Medium | Tooling | `run_qa.mjs` (both) doesn't seed auth → false greens; `phase2b` uses wrong key `erp_auth_token` |
| AUD-21 | Low | Dead code | `components/shared/ProductSearch.js` broken imports + orphan `document.click` listener |
| AUD-22 | Low | Drift | `package.json` says `1.0.0-rc1`/`ISC` (README says `rc3`/`MIT`); `main` branch frozen at Jul 29 |
| AUD-23 | Medium | Backend tests | `test_reports.py:95-102` will fail on inventory report (`Product.current_stock` bug) |

---

## 16. PRODUCTION READINESS SCORE & VERDICT

**Score: 42/100**

**Verdict: NOT READY FOR PRODUCTION.**

Rationale: 3 Critical accounting/data-shape defects (engine invoices invisible to all reports, daily-closing cumulative math + no persisted record, plaintext secrets with fake lock), 4 Critical/High backend defects (RBAC gap, FK violations, report `current_stock` bug, secrets-in-code), 2 High memory/security issues (listener leak, XSS in CellRenderers), plus multiple Medium correctness defects in Dashboard, Reports, Credit Management, and Backup/Restore fidelity gaps.

**Critical blockers (must fix before production):**
1. AUD-01 — engine-vs-legacy invoice shape incompatibility (reports/KPIs/GST read zeros).
2. AUD-02/03/04 — daily-closing math + no record + repeatable close + fake lock.
3. AUD-05 — silent line-delete failure + phantom stock holds.
4. AUD-06 — stored XSS in CellRenderers.
5. AUD-07 — unbounded listener leak (long-day sessions freeze).
6. AUD-13/14/15 — backend report bug, FK violation, RBAC not enforced.
7. AUD-16 — plaintext secrets (DB password, JWT key, admin password).

---

*This report is the consolidation of five parallel very-thorough explore-agent sweeps over frontend architecture, data/service layer, pages & components, backend & database, and docs/scripts/config — all verified at line level. No files were modified during this analysis.*
