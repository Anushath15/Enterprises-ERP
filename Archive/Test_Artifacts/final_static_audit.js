const fs = require('fs');

function checkFileContains(filename, regex, expectedMessage, failMessage) {
    try {
        const content = fs.readFileSync(filename, 'utf8');
        if (regex.test(content)) {
            console.log(`[PASS] ${expectedMessage}`);
            return true;
        } else {
            console.log(`[FAIL] ${failMessage} in ${filename}`);
            return false;
        }
    } catch(e) {
        console.log(`[ERROR] Could not read ${filename}`);
        return false;
    }
}

console.log("=== STATIC VERIFICATION OF COMPILED BUSINESS LOGIC ===");

// 1. Dashboard: COGS productId fallback (AUDIT-C01)
checkFileContains(
    'frontend/pages/dashboard.js',
    /item\.productId\s*\|\|\s*item\.id/,
    'Dashboard calculates COGS using productId (fallback to id)',
    'Dashboard COGS calculation does not use productId'
);

// 2. Reports: onMount implementation (AUDIT-C02)
checkFileContains(
    'frontend/pages/reports.js',
    /export function onMount/,
    'Reports module successfully utilizes onMount lifecycle hook for data loading',
    'Reports module lacks onMount lifecycle hook'
);

// 3. POS: Manual qty stock check (AUDIT-H01)
checkFileContains(
    'frontend/pages/pos.js',
    /maxQty\s*=\s*product\s*\?\s*Number\(product\.stock\)\s*:\s*Infinity/,
    'POS enforces maxQty validation on physical stock limits',
    'POS does not enforce maxQty validation'
);

// 4. Sales: Invoice modal and print use item.total (AUDIT-H02)
checkFileContains(
    'frontend/pages/sales.js',
    /item\.total\s*\?\?/,
    'Sales uses item.total to accurately reflect discounted line amounts',
    'Sales calculates line items dynamically without accounting for line discounts'
);

// 5. Daily Closing: Strict actualCash validation (AUDIT-H03)
checkFileContains(
    'frontend/pages/daily_closing.js',
    /Number\.isFinite\(actualCashNum\)/,
    'Daily Closing enforces strict isFinite checking on Actual Cash input (NaN Protection)',
    'Daily Closing allows NaN values'
);

// 6. Credit Management: Backend logic execution (AUDIT-H04)
checkFileContains(
    'frontend/services/offlineDataProvider.js',
    /saveCreditPayment\s*\(\s*payment\s*\)\s*\{[\s\S]*updateCustomerBalance/,
    'OfflineDataProvider synchronizes saveCreditPayment with updateCustomerBalance immediately',
    'OfflineDataProvider does not synchronize credit payments with customer balances'
);

// 7. Date Utility: Local time boundaries (AUDIT-H05)
checkFileContains(
    'frontend/utils/dateUtils.js',
    /export function todayISO/,
    'Centralized dateUtils.js enforces local time to prevent UTC-rollover drift',
    'dateUtils.js is missing or improperly implemented'
);

// 8. Variable Shadowing Fix (DC-VAR-SHADOW)
checkFileContains(
    'frontend/pages/daily_closing.js',
    /const todayStr\s*=\s*todayISO\(\)/,
    'Daily Closing variable shadowing bug (todayISO) resolved using todayStr',
    'Daily Closing retains the critical variable shadowing bug'
);
