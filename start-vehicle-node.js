const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting Vehicle Service...');

const servicePath = path.join(__dirname, 'services', 'vehicle-service');
const child = spawn('npm', ['run', 'dev'], {
  cwd: servicePath,
  detached: true,
  stdio: 'inherit'
});

child.on('error', (err) => {
  console.error('❌ Failed to start vehicle service:', err);
});

child.on('spawn', () => {
  console.log('✅ Vehicle service started successfully');
});

// Keep the process running for a few seconds to ensure it starts
setTimeout(() => {
  console.log('🔍 Service should be starting up...');
  process.exit(0);
}, 3000);
