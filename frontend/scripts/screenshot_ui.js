const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const OUT_DIR = 'C:\\Users\\anush\\.gemini\\antigravity\\brain\\d1f66127-84a6-4379-ba82-95c0b1fbd533';

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
  
  const routes = [
    { name: 'Dashboard', url: '#/' },
    { name: 'POS', url: '#/pos' },
    { name: 'Sales', url: '#/sales' },
    { name: 'Inventory', url: '#/inventory' },
    { name: 'Reports', url: '#/reports' }
  ];

  for (const r of routes) {
    await page.evaluate((url) => { window.location.hash = url; }, r.url);
    await new Promise(res => setTimeout(res, 1000)); // wait for render
    const filePath = path.join(OUT_DIR, `V1_UI_${r.name}.png`);
    await page.screenshot({ path: filePath, fullPage: true });
    console.log(`Saved screenshot for ${r.name}`);
  }
  
  await browser.close();
})();
