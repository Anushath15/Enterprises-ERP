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

  const consoleLogs = [];
  page.on('console', msg => consoleLogs.push(`[${msg.type()}] ${msg.text()}`));
  page.on('pageerror', error => consoleLogs.push(`[ERROR] ${error.message}`));
  
  // Test Phase 2 New Purchase Route
  for (const vp of viewports) {
    await page.setViewport({ width: vp.width, height: vp.height });
    const url = 'http://127.0.0.1:5173/#/purchases/new';
    await page.goto(url, { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1000));
    
    // Simulate F3 Keyboard Shortcut to open product search
    await page.keyboard.press('F3');
    await new Promise(r => setTimeout(r, 500));
    
    // Type 'cement'
    await page.keyboard.type('cement', { delay: 100 });
    await new Promise(r => setTimeout(r, 500));
    
    // Press Down Arrow to navigate search
    await page.keyboard.press('ArrowDown');
    await new Promise(r => setTimeout(r, 100));
    
    // Press Enter to select
    await page.keyboard.press('Enter');
    await new Promise(r => setTimeout(r, 500));
    
    // Take screenshot
    const file = path.join(outDir, 'PHASE2_PurchasesNew_' + vp.name + '.png');
    await page.screenshot({ path: file, fullPage: true });
    console.log('Saved ' + file);
  }

  const consoleHtml = `
    <html>
    <body style="background:#242424;color:#0f0;font-family:monospace;padding:20px;">
      <h2>Console Output (Phase 2 Test)</h2>
      ${consoleLogs.length ? consoleLogs.join('<br>') : '0 Errors<br>0 Warnings<br>Empty Console'}
    </body>
    </html>
  `;
  await page.setContent(consoleHtml);
  await page.screenshot({ path: path.join(outDir, 'PHASE2_Console.png') });
  
  await browser.close();
})();
