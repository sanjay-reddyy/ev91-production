// Comprehensive diagnostic script for rider service
const express = require('express');
const axios = require('axios');

async function runDiagnostics() {
  console.log('🔍 RIDER SERVICE DIAGNOSTICS\n');
  
  // Test 1: Check if port 6000 is available
  console.log('1️⃣ Testing port availability...');
  const testApp = express();
  let portAvailable = false;
  
  testApp.get('/', (req, res) => {
    res.json({ status: 'Port test successful', port: 6000 });
  });
  
  try {
    const testServer = testApp.listen(6000, '0.0.0.0', () => {
      console.log('✅ Port 6000 is available');
      portAvailable = true;
      testServer.close();
      
      // Test 2: Check network connectivity
      testNetworkConnectivity();
    });
  } catch (error) {
    console.log('❌ Port 6000 is not available:', error.message);
    console.log('💡 Try using a different port or kill the process using port 6000');
  }
}

async function testNetworkConnectivity() {
  console.log('\n2️⃣ Testing network connectivity...');
  
  const testUrls = [
    'http://localhost:6000',
    'http://127.0.0.1:6000', 
    'http://192.168.0.2:6000'
  ];
  
  // Start a simple test server
  const app = express();
  app.get('/', (req, res) => {
    res.json({ 
      message: 'Test server working',
      requestFrom: req.ip,
      timestamp: new Date().toISOString()
    });
  });
  
  const server = app.listen(6000, '0.0.0.0', async () => {
    console.log('🚀 Test server started on port 6000');
    
    // Test each URL
    for (const url of testUrls) {
      try {
        const response = await axios.get(url, { timeout: 5000 });
        console.log(`✅ ${url} - Working`);
      } catch (error) {
        if (error.code === 'ECONNREFUSED') {
          console.log(`❌ ${url} - Connection refused`);
        } else if (error.code === 'ENOTFOUND') {
          console.log(`❌ ${url} - Host not found`);
        } else {
          console.log(`❌ ${url} - Error: ${error.message}`);
        }
      }
    }
    
    server.close();
    console.log('\n3️⃣ Checking TypeScript compilation...');
    checkTypeScriptBuild();
  });
}

function checkTypeScriptBuild() {
  const { spawn } = require('child_process');
  
  const tscProcess = spawn('npx', ['tsc', '--noEmit'], {
    cwd: process.cwd(),
    stdio: 'pipe'
  });
  
  let output = '';
  
  tscProcess.stdout.on('data', (data) => {
    output += data.toString();
  });
  
  tscProcess.stderr.on('data', (data) => {
    output += data.toString();
  });
  
  tscProcess.on('close', (code) => {
    if (code === 0) {
      console.log('✅ TypeScript compilation successful');
    } else {
      console.log('❌ TypeScript compilation failed:');
      console.log(output);
    }
    
    console.log('\n4️⃣ Environment configuration:');
    checkEnvironment();
  });
}

function checkEnvironment() {
  const fs = require('fs');
  const path = require('path');
  
  // Check .env file
  const envPath = path.join(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    console.log('✅ .env file exists');
    const envContent = fs.readFileSync(envPath, 'utf8');
    const hasPort = envContent.includes('PORT=');
    console.log(`${hasPort ? '✅' : '❌'} PORT configuration in .env: ${hasPort}`);
  } else {
    console.log('⚠️  .env file not found');
  }
  
  // Check if dist folder exists (for npm start)
  const distPath = path.join(process.cwd(), 'dist');
  const hasDistFolder = fs.existsSync(distPath);
  console.log(`${hasDistFolder ? '✅' : '❌'} Compiled dist folder: ${hasDistFolder}`);
  
  console.log('\n📋 SUMMARY:');
  console.log('If all checks pass, the service should work with:');
  console.log('- Browser: http://localhost:6000');
  console.log('- Mobile: http://192.168.0.2:6000');
  console.log('\nTo start the service:');
  console.log('npm run dev  (for development)');
  console.log('npm run build && npm start  (for production)');
}

// Run diagnostics
runDiagnostics().catch(console.error);
