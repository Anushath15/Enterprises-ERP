# Manual Acceptance Checklist (v1.0.0-rc1)

## Data Integrity
- [ ] Purchase increases stock
- [ ] Sale decreases stock
- [ ] Sales Return restores stock
- [ ] Purchase Return reduces stock
- [ ] Customer outstanding updates
- [ ] Dealer outstanding updates
- [ ] Expense updates reports
- [ ] Dashboard KPIs update

## UI
- [ ] Every page loads
- [ ] No console errors
- [ ] No broken icons
- [ ] No broken routing
- [ ] No duplicate rows
- [ ] No reloads
- [ ] No alert()
- [ ] No stale DOM

## Browser Compatibility
- [ ] Chrome
- [ ] Edge
- [ ] Firefox

## Persistence
- [ ] Refresh browser
- [ ] Close browser and Reopen
- [ ] Verify Products exist
- [ ] Verify Customers exist
- [ ] Verify Sales exist
- [ ] Verify Purchases exist
- [ ] Verify Settings exist

## Import / Export
- [ ] Excel import
- [ ] JSON backup
- [ ] JSON restore

## LocalStorage Recovery
- [ ] Fill LocalStorage nearly full (approx 5MB)
- [ ] Confirm graceful warning
- [ ] Confirm no corrupted data
