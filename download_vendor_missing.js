const fs = require('fs');
const path = require('path');

const VENDOR_DIR = path.join(__dirname, 'frontend', 'vendor');

const filesToDownload = [
  { url: 'https://cdn.tailwindcss.com', dest: 'tailwindcss.js' },
  { url: 'https://cdn.sheetjs.com/xlsx-latest/package/dist/xlsx.full.min.js', dest: 'xlsx.full.min.js' },
  { url: 'https://unpkg.com/lucide@latest', dest: 'lucide.js' },
];

async function run() {
  for (const file of filesToDownload) {
    try {
      console.log(`Fetching ${file.url}...`);
      const response = await fetch(file.url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const text = await response.text();
      fs.writeFileSync(path.join(VENDOR_DIR, file.dest), text);
      console.log(`Saved ${file.dest}`);
    } catch (err) {
      console.error(`Error fetching ${file.url}:`, err);
    }
  }
}

run();
