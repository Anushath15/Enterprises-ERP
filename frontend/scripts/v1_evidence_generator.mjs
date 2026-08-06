import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

const outDir = 'C:\\Users\\anush\\.gemini\\antigravity\\brain\\d1f66127-84a6-4379-ba82-95c0b1fbd533\\QA_Screenshots';
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

async function captureEvidence() {
  console.log("Starting Evidence Generator...");
  const browser = await puppeteer.launch({
    headless: "new",
    defaultViewport: { width: 1280, height: 800 }
  });
  
  const page = await browser.newPage();
  const targetUrl = 'file:///D:/Senthil%20Enterprises/BS%20Software/frontend/index.html';
  
  // 1. Dashboard
  await page.goto(targetUrl, { waitUntil: 'networkidle0' });
  await page.screenshot({ path: path.join(outDir, '01_Dashboard.png') });
  console.log("Captured Dashboard");
  
  // 2. POS Billing
  await page.evaluate(() => window.router.navigate('/pos'));
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(outDir, '02_POS.png') });
  console.log("Captured POS");
  
  // Interaction: Focus on customer search
  await page.focus('#customer-search');
  await page.screenshot({ path: path.join(outDir, '03_POS_Focus.png') });
  console.log("Captured POS Focus");
  
  // 3. Sales Register (Empty State)
  await page.evaluate(() => window.router.navigate('/sales'));
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(outDir, '04_Sales_Empty.png') });
  console.log("Captured Sales Empty");
  
  // 4. Inventory
  await page.evaluate(() => window.router.navigate('/inventory'));
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(outDir, '05_Inventory.png') });
  console.log("Captured Inventory");
  
  // 5. Reports
  await page.evaluate(() => window.router.navigate('/reports'));
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(outDir, '06_Reports.png') });
  console.log("Captured Reports");
  
  // 6. Generate Print PDF (A4 Portrait)
  await page.evaluate(() => window.router.navigate('/pos'));
  await new Promise(r => setTimeout(r, 1000));
  // Add an item to cart to print
  await page.evaluate(() => {
     if(window.OfflineDataProvider) {
         window.OfflineDataProvider.saveProduct({id: 'p1', name: 'Test Pipe', price: 100, taxRate: 18});
         const btn = document.querySelector(`[onclick="addToCart('p1')"]`);
         if(btn) btn.click();
     }
  });
  
  // Mock print
  await page.evaluate(() => {
     document.body.classList.add('printing');
  });
  await page.pdf({ path: path.join(outDir, '07_Print_A4.pdf'), format: 'A4' });
  console.log("Captured Print PDF");
  
  await browser.close();
  console.log("Evidence Generation Complete.");
}

captureEvidence().catch(console.error);
