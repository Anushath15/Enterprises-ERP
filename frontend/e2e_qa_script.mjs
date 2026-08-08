import puppeteer from 'puppeteer';
import fs from 'fs';

const BASE_URL = 'http://localhost:3000';
const errors = [];
const consoleLogs = [];

(async () => {
  console.log('Starting Puppeteer E2E QA Suite...');
  
  const browser = await puppeteer.launch({
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  page.on('pageerror', err => {
    errors.push({ type: 'PageError', message: err.toString() });
    console.error('PAGE ERROR:', err.toString());
  });

  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push({ type: 'ConsoleError', message: msg.text() });
      console.error('CONSOLE ERROR:', msg.text());
    } else {
      consoleLogs.push({ type: msg.type(), text: msg.text() });
    }
  });
  
  page.on('requestfailed', request => {
    const errorText = request.failure()?.errorText || 'Unknown';
    if (!request.url().includes('favicon.ico')) {
      errors.push({ type: 'RequestFailed', url: request.url(), error: errorText });
      console.error('REQUEST FAILED:', request.url(), errorText);
    }
  });

  try {
    // Wait for the server to be fully ready
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('Navigating to root...');
    await page.goto(BASE_URL, { waitUntil: 'networkidle0' });
    
    // Simulate login if present
    const loginForm = await page.$('#login-form');
    if (loginForm) {
      console.log('Logging in...');
      await page.type('#username', 'admin');
      await page.type('#password', 'admin123');
      await page.click('button[type="submit"]');
      await page.waitForNavigation({ waitUntil: 'networkidle0' });
    }

    const testRoutes = [
      '#/',
      '#/products',
      '#/categories',
      '#/customers',
      '#/dealers',
      '#/purchases',
      '#/pos',
      '#/inventory',
      '#/settings',
      '#/house-projects',
      '#/daily-closing',
      '#/database-maintenance',
      '#/export-center'
    ];

    for (const route of testRoutes) {
      console.log(`Testing route: ${route}`);
      await page.evaluate((r) => { window.location.hash = r; }, route);
      
      // Wait for any framework rendering
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Look for explicit 404 text in our app
      const bodyText = await page.evaluate(() => document.body.innerText);
      if (bodyText.includes('Page Not Found') || bodyText.includes('404')) {
        errors.push({ type: 'RouteError', message: `Route ${route} returned a 404 UI` });
      }

      // Check if drawer logic throws on ESC
      await page.keyboard.press('Escape');
    }

    console.log('E2E Navigation complete. Writing report...');

    fs.writeFileSync('e2e_qa_results.json', JSON.stringify({
      errors,
      consoleLogs: consoleLogs.length,
      success: errors.length === 0
    }, null, 2));
    
  } catch (err) {
    console.error('Test Suite Failed Exception:', err);
    errors.push({ type: 'FatalTestError', message: err.toString() });
  } finally {
    await browser.close();
    console.log('E2E Browser closed.');
  }
})();
