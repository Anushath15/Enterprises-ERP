// Detached dev-server launcher for Phase 6 harnesses.
// Spawns live-server and exits immediately (server keeps running detached).
const { spawn } = require('child_process');
spawn('npx', ['live-server', 'frontend', '--port=5173', '--no-browser', '--quiet', '--host=127.0.0.1'], {
  stdio: 'ignore',
  detached: true,
  windowsHide: true
});
