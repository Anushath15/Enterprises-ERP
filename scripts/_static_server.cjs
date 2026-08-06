// Minimal detached static server for Phase 6 harnesses (serves frontend/ on :5173).
// No external deps; stays alive across tool calls via Start-Process -WindowStyle Hidden.
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', 'frontend');
const PORT = 5173;
const HOST = '127.0.0.1';

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.png': 'image/png',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.map': 'application/json'
};

const server = http.createServer((req, res) => {
  let url = decodeURIComponent(req.url).split('?')[0];
  if (url === '/' || url === '') url = '/index.html';
  if (url === '/#/' || url.indexOf('#') !== -1) url = '/index.html';
  let p = path.normalize(path.join(ROOT, url));
  if (!p.startsWith(ROOT + path.sep) && p !== ROOT) { res.statusCode = 403; res.end(); return; }
  fs.readFile(p, (err, data) => {
    if (err) { res.statusCode = 404; res.end('Not found'); return; }
    const ext = path.extname(p).toLowerCase();
    res.setHeader('Content-Type', TYPES[ext] || 'application/octet-stream');
    res.end(data);
  });
});

server.on('error', () => process.exit(0));
server.listen(PORT, HOST, () => console.log('static server listening on ' + HOST + ':' + PORT));
