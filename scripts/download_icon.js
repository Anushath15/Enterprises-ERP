const fs = require('fs');
const path = require('path');

const assetsDir = path.join(__dirname, '..', 'desktop', 'assets');
const pngPath = path.join(assetsDir, 'icon.png');
const icoPath = path.join(assetsDir, 'icon.ico');

async function downloadIcon() {
  console.log('Downloading a valid 256x256 ICO...');
  const res = await fetch('https://github.com/electron/electron/raw/main/default_app/icon.ico');
  const buffer = await res.arrayBuffer();
  fs.writeFileSync(icoPath, Buffer.from(buffer));
  
  const resPng = await fetch('https://github.com/electron/electron/raw/main/default_app/icon.png');
  const bufferPng = await resPng.arrayBuffer();
  fs.writeFileSync(pngPath, Buffer.from(bufferPng));
  
  console.log('Downloaded default Electron icons');
}

downloadIcon().catch(console.error);
