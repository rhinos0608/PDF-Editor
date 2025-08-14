/**
 * Enhanced development starter
 * Properly coordinates webpack dev server and Electron startup
 */

const { spawn } = require('child_process');
const path = require('path');
const http = require('http');

// Configuration
const DEV_SERVER_PORT = 8080;
const DEV_SERVER_URL = `http://localhost:${DEV_SERVER_PORT}`;
const MAX_WAIT_TIME = 30000; // 30 seconds max wait
const CHECK_INTERVAL = 500; // Check every 500ms

console.log('🚀 Starting PDF Editor Development Environment...\n');

// Set environment variables
process.env.NODE_ENV = 'development';
process.env.ELECTRON_DISABLE_GPU = '1';
process.env.ELECTRON_ENABLE_LOGGING = '1';

let webpackProcess = null;
let electronProcess = null;

// Function to check if dev server is running
function checkDevServer() {
  return new Promise((resolve) => {
    const req = http.get(DEV_SERVER_URL, (res) => {
      resolve(true);
    });
    
    req.on('error', () => {
      resolve(false);
    });
    
    req.setTimeout(1000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

// Function to wait for dev server to be ready
async function waitForDevServer() {
  console.log('⏳ Waiting for webpack dev server to be ready...');
  const startTime = Date.now();
  
  while (Date.now() - startTime < MAX_WAIT_TIME) {
    const isReady = await checkDevServer();
    if (isReady) {
      console.log('✅ Webpack dev server is ready!');
      return true;
    }
    
    // Show progress
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    process.stdout.write(`\r🔄 Checking dev server... (${elapsed}s)`);
    
    await new Promise(resolve => setTimeout(resolve, CHECK_INTERVAL));
  }
  
  console.log('\n❌ Timeout waiting for dev server');
  return false;
}

// Start webpack dev server
function startWebpackDevServer() {
  console.log('📦 Starting webpack dev server...');
  
  webpackProcess = spawn('npm', ['run', 'dev:renderer'], {
    stdio: 'pipe',
    shell: true,
    env: {
      ...process.env,
      NODE_ENV: 'development'
    }
  });
  
  webpackProcess.stdout.on('data', (data) => {
    const output = data.toString();
    // Only show important webpack messages
    if (output.includes('webpack compiled') || 
        output.includes('Project is running') || 
        output.includes('ERROR') ||
        output.includes('WARNING')) {
      console.log('📦 Webpack:', output.trim());
    }
  });
  
  webpackProcess.stderr.on('data', (data) => {
    const error = data.toString();
    if (!error.includes('DefinePlugin') && !error.includes('stats.children')) {
      console.error('📦 Webpack Error:', error.trim());
    }
  });
  
  webpackProcess.on('close', (code) => {
    console.log(`📦 Webpack dev server exited with code ${code}`);
  });
}

// Start Electron
function startElectron() {
  console.log('⚡ Starting Electron...');
  
  const electronPath = path.join(__dirname, 'node_modules', '.bin', 'electron.cmd');
  const mainPath = path.join(__dirname, 'dist', 'main', 'main.js');
  
  electronProcess = spawn(electronPath, [mainPath], {
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_ENV: 'development'
    }
  });
  
  electronProcess.on('close', (code) => {
    console.log(`⚡ Electron exited with code ${code}`);
    cleanup();
  });
  
  electronProcess.on('error', (error) => {
    console.error('❌ Failed to start Electron:', error);
    cleanup();
  });
}

// Cleanup function
function cleanup() {
  console.log('\n🧹 Cleaning up...');
  
  if (webpackProcess && !webpackProcess.killed) {
    console.log('📦 Stopping webpack dev server...');
    webpackProcess.kill('SIGTERM');
  }
  
  if (electronProcess && !electronProcess.killed) {
    console.log('⚡ Stopping Electron...');
    electronProcess.kill('SIGTERM');
  }
  
  setTimeout(() => {
    process.exit(0);
  }, 1000);
}

// Main startup sequence
async function main() {
  try {
    // Step 1: Start webpack dev server
    startWebpackDevServer();
    
    // Step 2: Wait for dev server to be ready
    const serverReady = await waitForDevServer();
    
    if (!serverReady) {
      console.error('❌ Failed to start webpack dev server');
      cleanup();
      return;
    }
    
    // Step 3: Start Electron
    startElectron();
    
  } catch (error) {
    console.error('❌ Error during startup:', error);
    cleanup();
  }
}

// Handle graceful shutdown
process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

// Start the development environment
main();