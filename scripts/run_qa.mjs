import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

const pagesToTest = [
  { route: '', name: 'Dashboard' },
  { route: 'pos', name: 'POS' },
  { route: 'sales', name: 'Sales' },
  { route: 'purchases', name: 'Purchases' },
  { route: 'inventory', name: 'Inventory' },
  { route: 'products', name: 'Products' },
  { route: 'categories', name: 'Categories' },
  { route: 'customers', name: 'Customers' },
  { route: 'dealers', name: 'Dealers' },
  { route: 'delivery', name: 'Delivery' },
  { route: 'sales-returns', name: 'Sales_Returns' },
  { route: 'purchase-returns', name: 'Purchase_Returns' },
  { route: 'expenses', name: 'Expenses' },
  { route: 'house-projects', name: 'House_Projects' },
  { route: 'warranty', name: 'Warranty' },
  { route: 'reports', name: 'Reports' },
  { route: 'daily-closing', name: 'Daily_Closing' },
  { route: 'credit-management', name: 'Credit_Management' },
  { route: 'stock-adjustments', name: 'Stock_Adjustment' },
  { route: 'onboarding-stock', name: 'Opening_Stock' },
  { route: 'onboarding-balances', name: 'Opening_Balance' },
  { route: 'staff', name: 'Staff' },
  { route: 'users', name: 'Users' },
  { route: 'settings', name: 'Settings' },
  { route: 'export-center', name: 'Export_Center' },
];

(async () => {
  console.log("Starting Automated Local QA...");
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  // Create Screenshots Directory
  const dir = path.join(process.cwd(), 'QA_Screenshots');
  if (!fs.existsSync(dir)){
      fs.mkdirSync(dir, { recursive: true });
  }

  let allPassed = true;
  let validationReport = '# RC3.2 Runtime Validation Report\n\nGenerated automatically via `npm run qa`.\n\n';
  let routeStatus = '# RC3.2 Route Status\n\n| Route | Loaded Successfully | Console Errors | Runtime Exceptions | Page Errors | Network Errors | Screenshot | Status |\n|---|---|---|---|---|---|---|---|\n';
  
  const viewports = [
    { width: 1920, height: 1080, name: '1920' },
    { width: 1600, height: 900, name: '1600' },
    { width: 1440, height: 900, name: '1440' },
    { width: 1366, height: 768, name: '1366' },
    { width: 1280, height: 720, name: '1280' },
    { width: 1024, height: 768, name: '1024' },
    { width: 768, height: 1024, name: '768' },
    { width: 480, height: 800, name: '480' },
    { width: 360, height: 640, name: '360' }
  ];

  for (const p of pagesToTest) {
    console.log(`\n--- Testing ${p.name} ---`);
    const errors = [];
    const url = `http://127.0.0.1:5173/#/${p.route}`;

    // Setup listeners
    const consoleErrors = [];
    const runtimeExceptions = [];
    const networkErrors = [];
    let loadedSuccessfully = true;

    const onPageError = err => {
      errors.push(`PageError: ${err.message}`);
      runtimeExceptions.push(err.message);
    };
    const onConsole = msg => {
      const text = msg.text();
      const mUrl = msg.location().url || '';
      if (msg.type() === 'error' && !text.includes('favicon') && !mUrl.includes('favicon') && !text.includes('chrome-extension')) {
        errors.push(`ConsoleError: ${text}`);
        consoleErrors.push(text);
      }
    };
    const onRequestFailed = req => {
      if (!req.url().includes('favicon')) {
        networkErrors.push(req.url());
      }
    };
    
    page.on('pageerror', onPageError);
    page.on('console', onConsole);
    page.on('requestfailed', onRequestFailed);

    try {
      // Test all viewports
      for (const vp of viewports) {
        await page.setViewport({ width: vp.width, height: vp.height });
        await page.goto(url, { waitUntil: 'networkidle2' });
        await new Promise(r => setTimeout(r, 800)); // wait for rendering
        

        const bodyContent = await page.evaluate(() => document.body.innerText.trim().length);
        if (bodyContent < 10) {
            errors.push("Blank Screen Detected");
            loadedSuccessfully = false;
        }

        const file = path.join(dir, `${p.name}_${vp.name}.png`);
        await page.screenshot({ path: file, fullPage: true });
      }

      const status = errors.length > 0 ? 'FAIL' : 'PASS';
      if (status === 'FAIL') allPassed = false;
      
      console.log(`${status} ${p.name}`);
      validationReport += `## ${p.name} - ${status}\n- **Errors:** ${errors.length ? errors.join(' | ') : 'None'}\n\n`;
      routeStatus += `| /${p.route} | ${loadedSuccessfully ? 'Yes' : 'No'} | ${consoleErrors.length} | ${runtimeExceptions.length} | ${errors.filter(e=>e.includes('PageError')).length} | ${networkErrors.length} | Generated (${viewports.length}) | **${status}** |\n`;

    } catch (e) {
      console.error(`Exception on ${p.name}:`, e.message);
      validationReport += `## ${p.name} - FAIL\n- **Exception:** ${e.message}\n\n`;
      routeStatus += `| /${p.route} | No | - | 1 | - | - | Failed | **FAIL** |\n`;
      allPassed = false;
    } finally {
      page.off('pageerror', onPageError);
      page.off('console', onConsole);
      page.off('requestfailed', onRequestFailed);
    }
  }

  fs.writeFileSync('RUNTIME_VALIDATION_REPORT.md', validationReport);
  fs.writeFileSync('ROUTE_STATUS.md', routeStatus);
  console.log('\nTesting Complete. See RUNTIME_VALIDATION_REPORT.md and ROUTE_STATUS.md');
  await browser.close();
  
  if (!allPassed) {
      console.log('QA Failed! Fix errors before continuing.');
      process.exit(1);
  }
})();
