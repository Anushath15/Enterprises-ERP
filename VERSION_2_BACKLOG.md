# Senthil Enterprises ERP - Version 2.0 Backlog

**Status:** Planning Only
**Prerequisite:** Version 1.0 must complete a successful 1-2 week pilot run in the shop before any of these features are scheduled for development.

## 1. Hardware Integration
- [ ] **Barcode Scanner Integration**: Allow rapid POS checkout via standard USB/Bluetooth barcode scanners.
- [ ] **Thermal Printer Support**: Generate ESC/POS commands or optimized PDF layouts for 80mm thermal receipt printers.

## 2. Advanced Workflow Features
- [ ] **QR Invoice Generation**: Embed UPI payment links or digital invoice links on printed receipts.
- [ ] **WhatsApp Invoice Sharing**: Automate sending digital invoices directly to the customer's registered phone number via WhatsApp API.
- [ ] **Excel Import/Export**: Allow bulk upload of Products and export of Sales/Purchase ledgers to standard `.xlsx` formats for accountant integration.

## 3. Core Business Enhancements
- [ ] **Customer Payment History Improvements**: Implement detailed aging reports and partial payment tracking on a per-invoice basis rather than just an aggregate outstanding balance.
- [ ] **Dealer Ledger Enhancements**: Add support for credit notes, debit notes, and automated tax (GST) reconciliation.
- [ ] **Advanced Inventory Adjustments**: Add support for multi-warehouse mapping, batch tracking, and expiry date management.

## 4. Expansion & Cloud
- [ ] **Multi-Branch Support**: Segregate inventory and users by branch while maintaining a centralized HQ dashboard.
- [ ] **Cloud Synchronization**: Develop a background sync engine that safely pushes offline SQLite/LocalStorage data to a master AWS/GCP PostgreSQL database when the internet connection is restored.
- [ ] **Mobile Application**: Port the UI to React Native or Flutter for on-the-go stock checking by warehouse staff.
- [ ] **Supplier/Customer Portals**: Read-only web views allowing dealers or large B2B customers to check their ledger balance and place orders.

## 5. Intelligence
- [ ] **Business Analytics Enhancements**: Implement predictive re-ordering based on historical sales velocity.
- [ ] **AI-Powered Business Assistant**: Natural Language interface to ask the ERP complex queries (e.g., "Which products generated the most profit this week?").
