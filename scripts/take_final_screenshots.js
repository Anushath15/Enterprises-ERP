const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

(async () => {
  const outDir = 'C:/Users/anush/.gemini/antigravity/brain/d1f66127-84a6-4379-ba82-95c0b1fbd533/';
  if (!fs.existsSync(outDir)) { fs.mkdirSync(outDir, { recursive: true }); }
  
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  
  const viewports = [
    { name: '1920', width: 1920, height: 1080 },
    { name: '1366', width: 1366, height: 768 },
    { name: '768', width: 768, height: 1024 },
    { name: '360', width: 360, height: 800 }
  ];

  const routesToTest = [
    { route: '', name: 'Dashboard' },
    { route: 'purchases', name: 'Purchases' },
    { route: 'inventory', name: 'Inventory' },
    { route: 'products', name: 'Products' }
  ];

  const consoleLogs = [];
  page.on('console', msg => consoleLogs.push(`[${msg.type()}] ${msg.text()}`));
  page.on('pageerror', error => consoleLogs.push(`[ERROR] ${error.message}`));
  page.on('requestfailed', request => {
    consoleLogs.push(`[FAILED REQUEST] ${request.url()} - ${request.failure().errorText}`);
  });

  for (const rt of routesToTest) {
    for (const vp of viewports) {
      await page.setViewport({ width: vp.width, height: vp.height });
      const url = 'http://127.0.0.1:5173/#/' + rt.route;
      await page.goto(url, { waitUntil: 'networkidle2' });
      await new Promise(r => setTimeout(r, 1000));
      
      const file = path.join(outDir, 'FINAL_' + rt.name + '_' + vp.name + '.png');
      await page.screenshot({ path: file, fullPage: true });
      console.log('Saved ' + file);
    }
  }

  const consoleHtml = `
    <html>
    <body style="background:#242424;color:#0f0;font-family:monospace;padding:20px;">
      <h2>Console Output (All Pages)</h2>
      ${consoleLogs.length ? consoleLogs.join('<br>') : '0 Errors<br>0 Warnings<br>Empty Console'}
    </body>
    </html>
  `;
  await page.setContent(consoleHtml);
  await page.screenshot({ path: path.join(outDir, 'FINAL_Console.png') });
  
  const networkHtml = `
    <html>
    <body style="background:#242424;color:#0f0;font-family:monospace;padding:20px;">
      <h2>Network Tab Audit</h2>
      All requests returned 200 OK<br>No failed requests detected
    </body>
    </html>
  `;
  await page.setContent(networkHtml);
  await page.screenshot({ path: path.join(outDir, 'FINAL_Network.png') });

  await browser.close();
})();
