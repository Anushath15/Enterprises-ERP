const { Jimp } = require('jimp');
const pngToIco = require('png-to-ico').default;
const fs = require('fs');
const path = require('path');

const assetsDir = path.join(__dirname, '..', 'desktop', 'assets');
const pngPath = path.join(assetsDir, 'icon.png');
const icoPath = path.join(assetsDir, 'icon.ico');

async function createIcon() {
  const image = new Jimp({ width: 256, height: 256, color: '#1e3a8a' });
  await image.write(pngPath);
  
  const buf = await pngToIco(pngPath);
  fs.writeFileSync(icoPath, buf);
  console.log('Successfully generated 256x256 icon.ico');
}

createIcon().catch(console.error);
