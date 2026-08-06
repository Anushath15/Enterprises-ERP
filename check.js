const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function checkFiles(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      if (!fullPath.includes('node_modules') && !fullPath.includes('.git')) {
        checkFiles(fullPath);
      }
    } else if (fullPath.endsWith('.js')) {
      try {
        execSync('node --check "' + fullPath + '"', { stdio: 'pipe' });
      } catch (err) {
        console.error('Syntax error in:', fullPath);
        console.error(err.stderr.toString());
      }
    }
  }
}

checkFiles('D:\\Senthil Enterprises\\BS Software\\frontend');
console.log('Syntax check complete');
