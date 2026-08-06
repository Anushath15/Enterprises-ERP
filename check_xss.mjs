import puppeteer from 'puppeteer-core';

const delay = (ms) => new Promise(res => setTimeout(res, ms));

async function run() {
  console.log('Checking for XSS in Products...');
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  let xssFound = false;
  page.on('dialog', async dialog => {
    console.log(`[ALERT/DIALOG DETECTED]: ${dialog.message()}`);
    xssFound = true;
    await dialog.accept();
  });
  
  await page.setViewport({ width: 1280, height: 800 });
  await page.goto('https://myapplication-2adb30a9.web.app/#/products', { waitUntil: 'networkidle2' });
  await delay(2000);
  
  if (xssFound) {
     console.log('❌ XSS VULNERABILITY FOUND!');
  } else {
     console.log('✅ PASS: No XSS triggered on Product rendering.');
  }

  await browser.close();
}

run().catch(e => {
  console.error(e);
  process.exit(1);
});
