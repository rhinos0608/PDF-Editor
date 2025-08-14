/**
 * Electron Runner - Direct execution without npm
 * Bypasses corrupted Electron installation issues
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Find electron executable paths
const possibleElectronPaths = [
  path.join(__dirname, 'node_modules', 'electron', 'dist', 'electron.exe'),
  path.join(__dirname, 'node_modules', '.bin', 'electron.cmd'),
  path.join(__dirname, 'node_modules', 'electron', 'cli.js'),
  'electron'
];

function findElectron() {
  for (const electronPath of possibleElectronPaths) {
    if (fs.existsSync(electronPath)) {
      console.log(`✅ Found Electron at: ${electronPath}`);
      return electronPath;
    }
  }
  return null;
}

function startElectron() {
  const electronPath = findElectron();
  
  if (!electronPath) {
    console.error('❌ Electron executable not found');
    console.log('Available paths checked:');
    possibleElectronPaths.forEach(p => console.log(`  - ${p}`));
    process.exit(1);
  }

  // Ensure we have the correct main entry point
  const mainScript = path.join(__dirname, 'dist', 'main', 'main.js');
  
  if (!fs.existsSync(mainScript)) {
    console.error(`❌ Main script not found: ${mainScript}`);
    process.exit(1);
  }

  console.log(`🚀 Starting PDF Editor...`);
  console.log(`   Electron: ${electronPath}`);
  console.log(`   Main: ${mainScript}`);

  // Environment variables for stability
  const env = {
    ...process.env,
    NODE_ENV: 'production',
    ELECTRON_DISABLE_GPU: '1',
    ELECTRON_FORCE_SOFTWARE_RENDERING: '1'
  };

  // Start Electron
  const electron = spawn(electronPath, [mainScript], {
    stdio: 'inherit',
    env,
    cwd: __dirname
  });

  electron.on('close', (code) => {
    console.log(`\nElectron process exited with code ${code}`);
  });

  electron.on('error', (err) => {
    console.error('❌ Failed to start Electron:', err);
  });

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down...');
    electron.kill();
    process.exit(0);
  });
}

// Check if dist files exist
const distCheck = [
  'dist/main/main.js',
  'dist/main/preload.js',
  'dist/renderer/index.html'
];

console.log('🔍 Checking build files...');
let missingFiles = [];

for (const file of distCheck) {
  const fullPath = path.join(__dirname, file);
  if (fs.existsSync(fullPath)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file}`);
    missingFiles.push(file);
  }
}

if (missingFiles.length > 0) {
  console.error('\n❌ Missing required files. Please run build first.');
  process.exit(1);
}

// Start the application
startElectron();