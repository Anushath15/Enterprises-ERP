const fs = require('fs');
const path = require('path');

const pagesDir = path.join(__dirname, 'pages');
const files = fs.readdirSync(pagesDir).filter(f => f.endsWith('.js'));

let totalFixed = 0;

for (const file of files) {
  const filePath = path.join(pagesDir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // Check if it has the monkey patch
  if (content.includes('const _origWindowAdd = window.addEventListener;')) {
    
    // Replace the monkey patch block
    const patchRegex = /const _origAddEventListener = rootElement\.addEventListener;[\s\S]*?document\.addEventListener = function\(type, listener, options\) \{[\s\S]*?_origDocAdd\.call\(document, type, listener, options\);\s*\};/m;
    
    const replacement = `const __listeners = [];
  const safeRootAdd = (type, listener, options) => {
    __listeners.push({ target: rootElement, type, listener, options });
    rootElement.addEventListener(type, listener, options);
  };
  const trackedWindowDoc = [];
  const safeWindowAdd = (type, listener, options) => {
    trackedWindowDoc.push({ target: window, type, listener, options });
    window.addEventListener(type, listener, options);
  };
  const safeDocAdd = (type, listener, options) => {
    trackedWindowDoc.push({ target: document, type, listener, options });
    document.addEventListener(type, listener, options);
  };`;

    if (patchRegex.test(content)) {
      content = content.replace(patchRegex, replacement);
      
      // Replace window.addEventListener(...) with safeWindowAdd(...)
      // But avoid replacing _origWindowAdd
      content = content.replace(/window\.addEventListener\(/g, 'safeWindowAdd(');
      content = content.replace(/document\.addEventListener\(/g, 'safeDocAdd(');
      content = content.replace(/rootElement\.addEventListener\(/g, 'safeRootAdd(');
      
      // Fix cleanup block
      const cleanupRegex = /window\.addEventListener = _origWindowAdd;\s*document\.addEventListener = _origDocAdd;/m;
      content = content.replace(cleanupRegex, '');
      
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Fixed ${file}`);
      totalFixed++;
    }
  }
}

console.log(`Fixed ${totalFixed} files`);
