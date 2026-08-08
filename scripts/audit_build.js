const fs = require('fs');
const path = require('path');

console.log('=== BUILD OUTPUT VERIFICATION ===');
console.log('');

const distDir = 'dist';
const requiredFiles = [
  { name: 'Senthil Enterprises ERP Setup 1.0.0.exe', type: 'NSIS Setup Installer' },
  { name: 'Senthil Enterprises ERP 1.0.0.exe', type: 'Portable Executable' },
  { name: 'latest.yml', type: 'Update metadata (auto-update compatible)' },
  { name: 'builder-debug.yml', type: 'Build debug log' },
];

let buildFails = 0;
requiredFiles.forEach(f => {
  const filePath = path.join(distDir, f.name);
  const exists = fs.existsSync(filePath);
  const sizeBytes = exists ? fs.statSync(filePath).size : 0;
  const sizeMB = (sizeBytes / 1024 / 1024).toFixed(2);
  if (!exists || sizeBytes === 0) buildFails++;
  console.log((exists && sizeBytes > 0 ? 'PASS' : 'FAIL') + ' | ' + f.name);
  if (exists) console.log('       Size: ' + sizeMB + ' MB | Type: ' + f.type);
});

// Check win-unpacked dir
const unpackedDir = path.join(distDir, 'win-unpacked');
const unpackedExists = fs.existsSync(unpackedDir);
const mainExeInUnpacked = fs.existsSync(path.join(unpackedDir, 'Senthil Enterprises ERP.exe'));
console.log('');
console.log((unpackedExists ? 'PASS' : 'FAIL') + ' | dist/win-unpacked/ directory exists');
console.log((mainExeInUnpacked ? 'PASS' : 'FAIL') + ' | dist/win-unpacked/Senthil Enterprises ERP.exe exists');
if (mainExeInUnpacked) {
  const exeSize = (fs.statSync(path.join(unpackedDir, 'Senthil Enterprises ERP.exe')).size / 1024 / 1024).toFixed(2);
  console.log('       Unpacked EXE Size: ' + exeSize + ' MB');
}

// Check asar (the packed app code)
const asarPath = path.join(unpackedDir, 'resources', 'app.asar');
const asarExists = fs.existsSync(asarPath);
const asarSize = asarExists ? (fs.statSync(asarPath).size / 1024 / 1024).toFixed(2) : 0;
console.log((asarExists && asarSize > 0 ? 'PASS' : 'FAIL') + ' | resources/app.asar exists (packed app code) | size: ' + asarSize + ' MB');

// Read latest.yml
const latestYml = fs.readFileSync(path.join(distDir, 'latest.yml'), 'utf8');
console.log('');
console.log('=== latest.yml CONTENTS ===');
console.log(latestYml);

console.log('Build failures: ' + buildFails);
