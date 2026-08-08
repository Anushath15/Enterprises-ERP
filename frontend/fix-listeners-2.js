const fs = require('fs');
const path = require('path');

const pagesDir = path.join(__dirname, 'pages');
const files = fs.readdirSync(pagesDir).filter(f => f.endsWith('.js'));

for (const file of files) {
  const filePath = path.join(pagesDir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // Fix duplicated __listeners
  if (content.includes('const __listeners = [];\r\n  const __listeners = [];') || content.includes('const __listeners = [];\n  const __listeners = [];')) {
    content = content.replace(/const __listeners = \[\];\s*const __listeners = \[\];/, 'const __listeners = [];');
  }

  // Fix recursive safeWindowAdd calling safeWindowAdd
  content = content.replace(/safeRootAdd\(type, listener, options\);/g, 'rootElement.addEventListener(type, listener, options);');
  content = content.replace(/safeWindowAdd\(type, listener, options\);/g, 'window.addEventListener(type, listener, options);');
  content = content.replace(/safeDocAdd\(type, listener, options\);/g, 'document.addEventListener(type, listener, options);');

  // Fix any remaining _origWindowAdd or _origDocAdd inside the file that was not cleaned up
  content = content.replace(/window\.addEventListener = _origWindowAdd;/g, '');
  content = content.replace(/document\.addEventListener = _origDocAdd;/g, '');

  fs.writeFileSync(filePath, content, 'utf8');
}
console.log('Fixed syntax and recursion in all files');
