import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

const route = process.argv[2] || '';
const filename = process.argv[3] || 'screenshot.png';

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  // Set viewport to a standard desktop size
  await page.setViewport({ width: 1440, height: 900 });

  const errors = [];

  page.on('pageerror', err => {
    errors.push(`PageError: ${err.message}`);
  });

  page.on('console', msg => {
    const text = msg.text();
    const url = msg.location().url || '';
    if (msg.type() === 'error' && !text.includes('favicon') && !url.includes('favicon') && !text.includes('chrome-extension')) {
      errors.push(`ConsoleError: ${text} at ${url}`);
    }
  });

  try {
    const url = `http://localhost:5500/#/${route}`;
    console.log(`Navigating to ${url}...`);
    await page.goto(url, { waitUntil: 'networkidle2' });
    
    // Wait an extra second for any transitions or late renders (like lucide icons)
    await new Promise(r => setTimeout(r, 1000));
    
    // Ensure icons rendered
    const icons = await page.$$eval('svg.lucide', els => els.length);
    console.log(`Found ${icons} lucide icons on ${route || 'dashboard'}`);

    const dir = path.join(process.cwd(), 'QA_Screenshots');
    if (!fs.existsSync(dir)){
        fs.mkdirSync(dir);
    }

    const filepath = path.join(dir, filename);
    await page.screenshot({ path: filepath, fullPage: true });
    console.log(`Saved screenshot to ${filepath}`);

    if (errors.length > 0) {
      console.error('FAILED. Console Errors Found:');
      console.error(errors);
      process.exit(1);
    } else {
      console.log('SUCCESS. Page loaded without console errors.');
    }

  } catch (error) {
    console.error('Test script crashed:', error);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
