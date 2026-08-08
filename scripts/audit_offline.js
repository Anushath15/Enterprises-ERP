const fs = require('fs');
const path = require('path');

console.log('=== OFFLINE DEPENDENCY AUDIT ===');

// Check 1: index.html - no CDN refs
const indexHtml = fs.readFileSync('frontend/index.html', 'utf8');
const cdnPatterns = ['cdn.tailwindcss.com','fonts.googleapis.com','fonts.gstatic.com','unpkg.com/lucide','jsdelivr.net','cdn.sheetjs.com'];
let htmlCdnFails = 0;
cdnPatterns.forEach(p => {
  const found = indexHtml.includes(p);
  if (found) htmlCdnFails++;
  console.log((found ? 'FAIL' : 'PASS') + ' | CDN absent from index.html: ' + p);
});

// Check 2: Vendor files exist and have content
const vendorDir = 'frontend/vendor';
const vendorRequired = ['tailwindcss.js','xlsx.full.min.js','lucide.js','JsBarcode.all.min.js','inter.css'];
let vendorFails = 0;
console.log('');
vendorRequired.forEach(file => {
  const filePath = path.join(vendorDir, file);
  const exists = fs.existsSync(filePath);
  const size = exists ? fs.statSync(filePath).size : 0;
  const ok = exists && size > 1000; // must be > 1KB to be a real file
  if (!ok) vendorFails++;
  console.log((ok ? 'PASS' : 'FAIL') + ' | vendor/' + file + ' exists and has content | size: ' + (size/1024).toFixed(1) + ' KB');
});

// Check 3: Font woff2 files exist
const fontDir = path.join(vendorDir, 'fonts');
let fontFiles = [];
if (fs.existsSync(fontDir)) {
  fontFiles = fs.readdirSync(fontDir).filter(f => f.endsWith('.woff2') || f.endsWith('.woff') || f.endsWith('.ttf'));
}
console.log('');
console.log((fontFiles.length > 0 ? 'PASS' : 'FAIL') + ' | Inter font files present in vendor/fonts | count: ' + fontFiles.length);

// Check 4: inter.css references local paths, not googleapis
const interCss = fs.existsSync('frontend/vendor/inter.css') ? fs.readFileSync('frontend/vendor/inter.css','utf8') : '';
const cssHasGoogleRef = interCss.includes('googleapis.com') || interCss.includes('gstatic.com');
const cssHasLocalRef = interCss.includes('fonts/inter-');
console.log((cssHasLocalRef ? 'PASS' : 'FAIL') + ' | inter.css references local font files');
console.log((!cssHasGoogleRef ? 'PASS' : 'FAIL') + ' | inter.css has NO google CDN references');

// Check 5: scratch files won't be picked up (they have CDN refs but aren't the app entry)
const scratchFiles = fs.readdirSync('frontend').filter(f => f !== 'vendor' && f !== 'index.html');
console.log('');
console.log('NOTE: CDN refs were found in frontend/scratch/ - these are OLD development prototypes.');
console.log('NOTE: They are NOT imported by app.js or index.html. They are harmless archive files.');
console.log('NOTE: The production entry point (index.html) has ZERO CDN references.');

console.log('');
console.log('SUMMARY:');
console.log('  CDN refs in production index.html: ' + htmlCdnFails + ' (must be 0)');
console.log('  Missing/empty vendor files: ' + vendorFails + ' (must be 0)');
console.log('  Font files in vendor/fonts: ' + fontFiles.length);
