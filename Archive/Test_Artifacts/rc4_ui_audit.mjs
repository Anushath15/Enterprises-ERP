import puppeteer from 'puppeteer-core';

const delay = (ms) => new Promise(res => setTimeout(res, ms));

const ROUTES = [
  '#',
  '#/products',
  '#/categories',
  '#/inventory',
  '#/customers',
  '#/dealers',
  '#/sales',
  '#/purchases',
  '#/pos',
  '#/expenses',
  '#/warranty',
  '#/delivery',
  '#/credit',
  '#/closing',
  '#/db-maintenance',
  '#/export',
  '#/settings',
  '#/staff',
  '#/users'
];

const VIEWPORTS = [
  { name: 'Mobile', width: 360, height: 800 },
  { name: 'Tablet', width: 768, height: 1024 },
  { name: 'Desktop', width: 1366, height: 768 },
  { name: 'Large Desktop', width: 1920, height: 1080 }
];

async function run() {
  console.log('Starting RC4 Full UI/UX Audit...');
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  const errors = [];
  page.on('pageerror', err => {
    errors.push(`[Page Error] ${err.toString()}`);
  });
  page.on('console', msg => {
    if (msg.type() === 'error') {
       errors.push(`[Console Error] ${msg.text()}`);
    }
  });

  const overflowBugs = [];

  for (const viewport of VIEWPORTS) {
    console.log(`\n=== Testing Viewport: ${viewport.name} (${viewport.width}x${viewport.height}) ===`);
    await page.setViewport(viewport);
    
    for (const route of ROUTES) {
       console.log(`Auditing ${route}...`);
       await page.goto(`https://myapplication-2adb30a9.web.app/${route}`, { waitUntil: 'networkidle2' });
       await delay(1000);
       
       // Check for overflow
       const overflowElements = await page.evaluate(() => {
          const docWidth = document.documentElement.clientWidth;
          const elements = document.querySelectorAll('body *');
          let count = 0;
          for (let i = 0; i < elements.length; i++) {
             const rect = elements[i].getBoundingClientRect();
             if (rect.right > docWidth) {
                count++;
             }
          }
          return count;
       });
       
       if (overflowElements > 0) {
          overflowBugs.push(`Viewport ${viewport.name} - Route ${route} has ${overflowElements} overflowing elements!`);
       }
    }
  }
  
  console.log('\n=== AUDIT RESULTS ===');
  if (errors.length > 0) {
     console.log('❌ CONSOLE ERRORS FOUND:');
     errors.forEach(e => console.log(e));
  } else {
     console.log('✅ PASS: Zero console errors across all pages and viewports.');
  }
  
  if (overflowBugs.length > 0) {
     console.log('❌ OVERFLOW BUGS FOUND:');
     overflowBugs.forEach(b => console.log(b));
  } else {
     console.log('✅ PASS: Zero overflow/responsive bugs found.');
  }

  await browser.close();
}

run().catch(e => {
  console.error(e);
  process.exit(1);
});
