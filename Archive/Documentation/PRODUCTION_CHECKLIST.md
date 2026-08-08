# Production Go-Live Checklist

This checklist must be fully executed before allowing live shop transactions into the ERP.

## 1. Infrastructure Readiness
- [ ] **Server Provisioned**: Ubuntu 22.04 LTS secured with SSH key access.
- [ ] **Database Running**: PostgreSQL 15 running on `localhost` (not exposed to public internet).
- [ ] **SSL / HTTPS**: Let's Encrypt certificate generated. Traffic is fully encrypted.
- [ ] **Firewall (UFW)**: Port 80 (HTTP) and 443 (HTTPS) open. Port 8000 and 5432 strictly blocked from external access.

## 2. Configuration & Security
- [ ] **Environment Variables**: `.env` is created and `SECRET_KEY` is a strong, cryptographically secure 64-character string.
- [ ] **CORS Settings**: `BACKEND_CORS_ORIGINS` is strictly locked to the exact domain (e.g., `https://erp.senthil.com`).
- [ ] **Default Admin**: `init_db.py` executed successfully. Default admin password immediately changed upon first login.
- [ ] **JWT Expiration**: Validated that `ACCESS_TOKEN_EXPIRE_MINUTES` is configured appropriately (e.g., 720 minutes / 12 hours).

## 3. Data Integrity & Backups
- [ ] **Cron Job Scheduled**: Nightly `pg_dump` scheduled at 1:00 AM via crontab.
- [ ] **Backup Verified**: A manual backup was successfully taken and restored into a test database.
- [ ] **Database Migrations**: `alembic upgrade head` executed. Schema is up to date.

## 4. Physical Shop Hardware Integration
- [ ] **Printers**: A4 / Thermal printers connected to the billing terminal. Print stylesheets (`@media print`) verified.
- [ ] **Barcode Scanners**: USB Barcode scanners tested on the POS search bar. Characters correctly pipe into the input field.
- [ ] **Browser Compatibility**: Shop terminals updated to the latest version of Chrome or Edge.

## 5. End-to-End Sanity Check (Dry Run)
- [ ] Perform 1 Test Purchase.
- [ ] Perform 1 Test Sale (Cash).
- [ ] Perform 1 Test Sale (Credit).
- [ ] Record 1 Expense.
- [ ] Check Daily Closing Expected Cash accuracy.
- [ ] **CRITICAL:** Purge the test data before opening the shop!

## 6. Maintenance & Support
- [ ] Contact details for the developer/sysadmin printed and taped near the billing terminal.
- [ ] Shop owner trained on how to read the `ErrID` if the system throws an unexpected error.
