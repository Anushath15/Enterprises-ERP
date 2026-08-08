const fs = require('fs');
const path = require('path');
const https = require('https');

const VENDOR_DIR = path.join(__dirname, 'frontend', 'vendor');
if (!fs.existsSync(VENDOR_DIR)) {
  fs.mkdirSync(VENDOR_DIR, { recursive: true });
}

const filesToDownload = [
  { url: 'https://cdn.tailwindcss.com', dest: 'tailwindcss.js' },
  { url: 'https://cdn.sheetjs.com/xlsx-latest/package/dist/xlsx.full.min.js', dest: 'xlsx.full.min.js' },
  { url: 'https://unpkg.com/lucide@latest', dest: 'lucide.js' },
  { url: 'https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js', dest: 'JsBarcode.all.min.js' },
];

function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    console.log(`Downloading ${url}...`);
    https.get(url, (response) => {
      // Handle redirects (unpkg redirects to a specific version)
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        console.log(`Redirecting to ${response.headers.location}...`);
        return downloadFile(response.headers.location.startsWith('http') ? response.headers.location : new URL(response.headers.location, url).href, destPath).then(resolve).catch(reject);
      }
      
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download ${url}: ${response.statusCode}`));
        return;
      }
      
      const file = fs.createWriteStream(destPath);
      response.pipe(file);
      file.on('finish', () => {
        file.close(resolve);
      });
    }).on('error', (err) => {
      fs.unlink(destPath, () => reject(err));
    });
  });
}

// Download fonts (Inter)
async function downloadFonts() {
  const fontDir = path.join(VENDOR_DIR, 'fonts');
  if (!fs.existsSync(fontDir)) {
    fs.mkdirSync(fontDir, { recursive: true });
  }

  // Inter uses woff2 for modern browsers (which Electron uses)
  // We'll download the variable font or specific weights. For simplicity, let's download a single variable woff2
  // Or since Google Fonts API requires specific User-Agent to return woff2, let's write a standard css with local fonts.
  // Actually, providing a direct link to the woff2 file from Google Fonts:
  const fontUrl = 'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfMZhrib2Bg-4.ttf'; // Standard TTF fallback or WOFF2
  // Let's use the google fonts CSS link, fetch it with a modern Chrome User-Agent, parse the woff2 URLs, download them, and rewrite the CSS.
  
  const cssUrl = 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap';
  
  const cssContent = await new Promise((resolve, reject) => {
    https.get(cssUrl, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
      res.on('error', reject);
    });
  });

  let newCssContent = cssContent;
  const urlRegex = /url\((https:\/\/[^)]+)\)/g;
  let match;
  let fontCount = 0;
  
  while ((match = urlRegex.exec(cssContent)) !== null) {
    const fontFileUrl = match[1];
    const ext = path.extname(new URL(fontFileUrl).pathname) || '.woff2';
    const fontFileName = `inter-${fontCount++}${ext}`;
    const fontFilePath = path.join(fontDir, fontFileName);
    
    await downloadFile(fontFileUrl, fontFilePath);
    newCssContent = newCssContent.replace(fontFileUrl, `fonts/${fontFileName}`);
  }
  
  fs.writeFileSync(path.join(VENDOR_DIR, 'inter.css'), newCssContent);
  console.log('Fonts downloaded and inter.css generated.');
}

async function run() {
  for (const file of filesToDownload) {
    try {
      await downloadFile(file.url, path.join(VENDOR_DIR, file.dest));
      console.log(`Saved ${file.dest}`);
    } catch (err) {
      console.error(`Error downloading ${file.url}:`, err.message);
    }
  }
  
  try {
    await downloadFonts();
  } catch (err) {
    console.error('Error downloading fonts:', err);
  }
  
  console.log('Vendor localization complete.');
}

run();
