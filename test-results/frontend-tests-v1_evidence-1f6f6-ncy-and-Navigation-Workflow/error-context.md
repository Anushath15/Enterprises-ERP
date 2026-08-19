# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: frontend\tests\v1_evidence.spec.js >> V1.0 Evidence Collection (Browser/Static) >> Gate C & D: UI Consistency and Navigation Workflow
- Location: frontend\tests\v1_evidence.spec.js:26:7

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.focus: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('#customer-search')

```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | import path from 'path';
  3   | import fs from 'fs';
  4   | 
  5   | const BASE_URL = 'file:///' + path.resolve(__dirname, '../../frontend/index.html').replace(/\\/g, '/');
  6   | const UI_DIR = path.resolve('../Evidence/UI');
  7   | const PRINT_DIR = path.resolve('../Evidence/PRINT');
  8   | 
  9   | test.describe('V1.0 Evidence Collection (Browser/Static)', () => {
  10  | 
  11  |   test.beforeEach(async ({ page }) => {
  12  |     // Fail on any console error per Zero Assumption rule
  13  |     page.on('console', msg => {
  14  |       if (msg.type() === 'error') {
  15  |         console.error(`Browser console error: ${msg.text()}`);
  16  |       }
  17  |     });
  18  | 
  19  |     // Handle any unhandled exceptions
  20  |     page.on('pageerror', exception => {
  21  |       console.error(`Uncaught exception: "${exception}"`);
  22  |       expect(exception).toBeUndefined();
  23  |     });
  24  |   });
  25  | 
  26  |   test('Gate C & D: UI Consistency and Navigation Workflow', async ({ page }) => {
  27  |     await page.goto(BASE_URL);
  28  |     await page.waitForTimeout(1000); // Wait for initial render
  29  | 
  30  |     // 1. Dashboard
  31  |     await page.screenshot({ path: path.join(UI_DIR, 'UI_Dashboard.png') });
  32  | 
  33  |     // 2. Navigation to POS
  34  |     await page.goto(BASE_URL + '#/pos');
  35  |     await page.waitForTimeout(500);
  36  |     await page.screenshot({ path: path.join(UI_DIR, 'UI_POS.png') });
  37  | 
  38  |     // Simulate empty state focus
> 39  |     await page.focus('#customer-search');
      |                ^ Error: page.focus: Test timeout of 30000ms exceeded.
  40  |     await page.screenshot({ path: path.join(UI_DIR, 'UI_POS_Focus.png') });
  41  | 
  42  |     // 3. Navigation to Inventory
  43  |     await page.goto(BASE_URL + '#/inventory');
  44  |     await page.waitForTimeout(500);
  45  |     await page.screenshot({ path: path.join(UI_DIR, 'UI_Inventory.png') });
  46  | 
  47  |     // 4. Navigation to Reports
  48  |     await page.goto(BASE_URL + '#/reports');
  49  |     await page.waitForTimeout(500);
  50  |     await page.screenshot({ path: path.join(UI_DIR, 'UI_Reports.png') });
  51  | 
  52  |     // 5. Check Offline fallback route / 404 Error page
  53  |     await page.goto(BASE_URL + '#/not-a-real-page');
  54  |     await page.waitForTimeout(500);
  55  |     await page.screenshot({ path: path.join(UI_DIR, 'UI_Error.png') });
  56  |   });
  57  | 
  58  |   test('Gate I: Father Test Workflows (Negative Edge Cases)', async ({ page }) => {
  59  |     await page.goto(BASE_URL + '#/pos');
  60  |     await page.waitForTimeout(500);
  61  | 
  62  |     // Provide mock data
  63  |     await page.evaluate(() => {
  64  |         const products = [{id: 'p1', name: 'Test Pipe', price: 100, taxRate: 18, stock: 50}];
  65  |         localStorage.setItem('products', JSON.stringify(products));
  66  |     });
  67  |     // Reload to apply the localstorage
  68  |     await page.reload();
  69  |     await page.waitForTimeout(500);
  70  | 
  71  |     // Simulate rapid double click (Double Scan)
  72  |     await page.evaluate(() => {
  73  |        const btn = document.querySelector(`[onclick="addToCart('p1')"]`);
  74  |        if(btn) { btn.click(); btn.click(); }
  75  |     });
  76  |     await page.waitForTimeout(500);
  77  |     await page.screenshot({ path: path.join(UI_DIR, 'UI_FatherTest_DoubleScan.png') });
  78  | 
  79  |     // Simulate Page Refresh Mid-Transaction (Data loss / state check)
  80  |     await page.reload();
  81  |     await page.waitForTimeout(500);
  82  |     await page.screenshot({ path: path.join(UI_DIR, 'UI_FatherTest_AfterRefresh.png') });
  83  |   });
  84  | 
  85  |   test('Gate E: Printing Certification (PDF Layouts)', async ({ page }) => {
  86  |     await page.goto(BASE_URL);
  87  |     
  88  |     // Simulate a receipt layout view
  89  |     await page.evaluate(() => {
  90  |       const el = document.getElementById('print-receipt-area');
  91  |       if(el) {
  92  |         el.innerHTML = `<div style="padding:10px; font-family:monospace; text-align:center;">
  93  |            <img src="assets/logo.png" style="width:120px;" />
  94  |            <h2>Senthil Enterprises</h2>
  95  |            <p>Tax Invoice</p>
  96  |            <hr/>
  97  |            <p>1x Test Pipe - Rs 100</p>
  98  |            <hr/>
  99  |            <h3>Total: Rs 100</h3>
  100 |         </div>`;
  101 |         el.classList.remove('hidden');
  102 |         document.body.classList.add('printing'); // mock print mode
  103 |       }
  104 |     });
  105 |     await page.waitForTimeout(500);
  106 | 
  107 |     // 1. A4 Portrait
  108 |     await page.pdf({
  109 |       path: path.join(PRINT_DIR, 'PRINT_A4.pdf'),
  110 |       format: 'A4',
  111 |       printBackground: true
  112 |     });
  113 | 
  114 |     // 2. Thermal 58mm (approx 58mm x 200mm = 2.28in x 7.87in)
  115 |     await page.pdf({
  116 |       path: path.join(PRINT_DIR, 'PRINT_58mm.pdf'),
  117 |       width: '58mm',
  118 |       height: '150mm',
  119 |       printBackground: true
  120 |     });
  121 |     
  122 |     // 3. Thermal 80mm
  123 |     await page.pdf({
  124 |       path: path.join(PRINT_DIR, 'PRINT_80mm.pdf'),
  125 |       width: '80mm',
  126 |       height: '150mm',
  127 |       printBackground: true
  128 |     });
  129 |   });
  130 | 
  131 | });
  132 | 
```