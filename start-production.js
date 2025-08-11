#!/usr/bin/env node

/**
 * Professional PDF Editor - Production Startup Script
 * This script ensures the application is production-ready before launch
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function checkDependency(name) {
  try {
    require.resolve(name);
    return true;
  } catch (e) {
    return false;
  }
}

function ensureDirectory(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    log(`✓ Created directory: ${dir}`, colors.green);
  }
}

function main() {
  log('\n========================================', colors.cyan);
  log('Professional PDF Editor - Production Check', colors.bright);
  log('========================================\n', colors.cyan);

  // Check Node.js version
  const nodeVersion = process.version;
  log(`Node.js version: ${nodeVersion}`, colors.cyan);
  
  const majorVersion = parseInt(nodeVersion.split('.')[0].substring(1));
  if (majorVersion < 16) {
    log('✗ Node.js 16 or higher is required', colors.red);
    process.exit(1);
  }

  // Check if package.json exists
  if (!fs.existsSync('package.json')) {
    log('✗ package.json not found', colors.red);
    process.exit(1);
  }

  // Check critical dependencies
  const criticalDeps = [
    'electron',
    'react',
    'react-dom',
    'pdf-lib',
    'pdfjs-dist'
  ];

  log('\nChecking dependencies...', colors.yellow);
  let missingDeps = [];
  
  for (const dep of criticalDeps) {
    if (!checkDependency(dep)) {
      missingDeps.push(dep);
      log(`✗ Missing: ${dep}`, colors.red);
    } else {
      log(`✓ Found: ${dep}`, colors.green);
    }
  }

  if (missingDeps.length > 0) {
    log('\nInstalling missing dependencies...', colors.yellow);
    try {
      execSync('npm install', { stdio: 'inherit' });
      log('✓ Dependencies installed', colors.green);
    } catch (error) {
      log('✗ Failed to install dependencies', colors.red);
      process.exit(1);
    }
  }

  // Ensure required directories exist
  log('\nChecking directory structure...', colors.yellow);
  ensureDirectory('dist');
  ensureDirectory('dist/main');
  ensureDirectory('dist/renderer');
  ensureDirectory('public');

  // Check if TypeScript compilation is needed
  const mainJsExists = fs.existsSync('dist/main/main.js');
  const rendererExists = fs.existsSync('dist/renderer/index.html');

  if (!mainJsExists || !rendererExists) {
    log('\nBuilding application...', colors.yellow);
    try {
      log('Building main process...', colors.cyan);
      execSync('npm run build:main', { stdio: 'inherit' });
      
      log('Building renderer process...', colors.cyan);
      execSync('npm run build:renderer', { stdio: 'inherit' });
      
      log('✓ Build complete', colors.green);
    } catch (error) {
      log('✗ Build failed. Attempting to fix...', colors.red);
      
      // Try to fix common issues
      try {
        log('Installing type definitions...', colors.yellow);
        execSync('npm install --save-dev @types/react-color', { stdio: 'inherit' });
        
        log('Retrying build...', colors.yellow);
        execSync('npm run build', { stdio: 'inherit' });
        log('✓ Build successful', colors.green);
      } catch (retryError) {
        log('✗ Build failed. Please check the error messages above.', colors.red);
        process.exit(1);
      }
    }
  }

  // Create default icon if it doesn't exist
  if (!fs.existsSync('public/icon.png')) {
    log('\nCreating default icon...', colors.yellow);
    // Create a simple PNG icon
    const iconBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');
    fs.writeFileSync('public/icon.png', iconBuffer);
    log('✓ Default icon created', colors.green);
  }

  // Final checks
  log('\n========================================', colors.cyan);
  log('Production Check Complete!', colors.bright + colors.green);
  log('========================================\n', colors.cyan);

  // Launch the application
  log('Starting Professional PDF Editor...', colors.cyan);
  try {
    require('electron');
    const { spawn } = require('child_process');
    const electron = spawn('electron', ['.'], { stdio: 'inherit' });
    
    electron.on('close', (code) => {
      if (code !== 0) {
        log(`\nApplication exited with code ${code}`, colors.yellow);
      }
      process.exit(code);
    });
  } catch (error) {
    log('✗ Failed to start Electron', colors.red);
    log('Try running: npm start', colors.yellow);
    process.exit(1);
  }
}

// Run the main function
main();
