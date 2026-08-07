# Senthil Enterprises ERP - Database Backup & Recovery Guide

## 1. Backup Strategy
The ERP runs on PostgreSQL. To guarantee business continuity, backups must be taken reliably.

- **Daily Backups**: Automated nightly backups are strongly recommended.
- **Weekly Backups**: Store a full copy off-site (e.g. AWS S3, Google Drive).

## 2. PostgreSQL Backup Command
To perform a logical backup of the `senthil_erp` database without stopping the application, run:

```bash
pg_dump -U username -h localhost -F c -d senthil_erp -f /path/to/backups/senthil_erp_$(date +%Y%m%d).backup
```
*Note: The `-F c` flag creates a custom format archive optimized for `pg_restore`.*

## 3. Restore Command
> [!CAUTION]
> Restoring a database will overwrite current data. Do not restore unless reacting to a critical data loss event or configuring a new server.

To restore a backup into a fresh database:
```bash
# First, create an empty database
createdb -U username -h localhost senthil_erp

# Restore the archive
pg_restore -U username -h localhost -d senthil_erp -1 /path/to/backups/senthil_erp_YYYYMMDD.backup
```

## 4. Recovery Verification Checklist
After a restore operation, complete the following to verify integrity:
- [ ] Connect to the backend and check `GET /health/database` (Returns `status: OK`).
- [ ] Log in as the Admin.
- [ ] Ensure the Dashboard displays expected financial totals.
- [ ] Verify the latest POS Invoice is present in the Sales register.
