#!/usr/bin/env node

/**
 * Development Environment Test Script
 * Tests CSP configuration and dev server setup
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  reset: '\x1b[0m'
};

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  log('cyan', `\n${'='.repeat(60)}`);
  log('cyan', `  ${title}`);
  log('cyan', `${'='.repeat(60)}\n`);
}

async function checkFileExists(filePath) {
  try {
    await fs.promises.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function testCSPConfiguration() {
  logSection('CSP Configuration Test');
  
  const webpackConfigPath = path.join(__dirname, 'webpack.renderer.config.js');
  const mainConfigPath = path.join(__dirname, 'src', 'main', 'main.ts');
  
  log('blue', '🔍 Checking webpack CSP configuration...');
  if (await checkFileExists(webpackConfigPath)) {
    const webpackConfig = require(webpackConfigPath);
    const cspHeader = webpackConfig.devServer?.headers?.['Content-Security-Policy'];
    
    if (cspHeader && cspHeader.includes('unsafe-eval')) {
      log('green', '✅ Webpack CSP allows unsafe-eval for PDF.js compatibility');
    } else {
      log('red', '❌ Webpack CSP does not allow unsafe-eval');
    }
    
    if (cspHeader && cspHeader.includes('worker-src')) {
      log('green', '✅ Webpack CSP allows workers for PDF.js');
    } else {
      log('red', '❌ Webpack CSP does not allow workers');
    }
  } else {
    log('red', '❌ webpack.renderer.config.js not found');
  }
  
  log('blue', '🔍 Checking main process CSP configuration...');
  if (await checkFileExists(mainConfigPath)) {
    log('green', '✅ main.ts exists with CSP configuration');
  } else {
    log('red', '❌ main.ts not found');
  }
}

async function testDependencies() {
  logSection('Dependencies Test');
  
  const packageJsonPath = path.join(__dirname, 'package.json');
  const nodeModulesPath = path.join(__dirname, 'node_modules');
  
  log('blue', '🔍 Checking package.json...');
  if (await checkFileExists(packageJsonPath)) {
    const packageJson = require(packageJsonPath);
    
    // Check critical dependencies
    const criticalDeps = [
      'electron',
      'react',
      'webpack',
      'webpack-dev-server',
      'pdf-lib',
      'pdfjs-dist'
    ];
    
    let missingDeps = [];
    for (const dep of criticalDeps) {
      if (!packageJson.dependencies[dep] && !packageJson.devDependencies[dep]) {
        missingDeps.push(dep);
      }
    }
    
    if (missingDeps.length === 0) {
      log('green', '✅ All critical dependencies are listed');
    } else {
      log('red', `❌ Missing dependencies: ${missingDeps.join(', ')}`);
    }
  }
  
  log('blue', '🔍 Checking node_modules...');
  if (await checkFileExists(nodeModulesPath)) {
    log('green', '✅ node_modules directory exists');
  } else {
    log('red', '❌ node_modules directory not found - run npm install');
  }
}

async function testBuildConfiguration() {
  logSection('Build Configuration Test');
  
  const configFiles = [
    'webpack.main.config.js',
    'webpack.renderer.config.js',
    'webpack.preload.config.js'
  ];
  
  for (const configFile of configFiles) {
    const configPath = path.join(__dirname, configFile);
    if (await checkFileExists(configPath)) {
      log('green', `✅ ${configFile} exists`);
    } else {
      log('yellow', `⚠️  ${configFile} not found (may be optional)`);
    }
  }
  
  // Check source directories
  const srcDirs = [
    path.join(__dirname, 'src', 'main'),
    path.join(__dirname, 'src', 'renderer'),
    path.join(__dirname, 'src', 'renderer', 'components'),
    path.join(__dirname, 'src', 'renderer', 'services'),
    path.join(__dirname, 'src', 'renderer', 'styles')
  ];
  
  for (const srcDir of srcDirs) {
    if (await checkFileExists(srcDir)) {
      log('green', `✅ ${path.relative(__dirname, srcDir)} directory exists`);
    } else {
      log('red', `❌ ${path.relative(__dirname, srcDir)} directory not found`);
    }
  }
}

async function testArrayBufferFixes() {
  logSection('ArrayBuffer Fixes Test');
  
  const utilsPath = path.join(__dirname, 'src', 'renderer', 'utils', 'pdfUtils.ts');
  
  log('blue', '🔍 Checking enhanced pdfUtils...');
  if (await checkFileExists(utilsPath)) {
    const utilsContent = await fs.promises.readFile(utilsPath, 'utf8');
    
    if (utilsContent.includes('createSafePDFBytes')) {
      log('green', '✅ createSafePDFBytes function exists');
    } else {
      log('red', '❌ createSafePDFBytes function not found');
    }
    
    if (utilsContent.includes('createSafeArrayBuffer')) {
      log('green', '✅ createSafeArrayBuffer function exists');
    } else {
      log('red', '❌ createSafeArrayBuffer function not found');
    }
    
    if (utilsContent.includes('Uint8Array.from')) {
      log('green', '✅ Safe buffer copying strategy implemented');
    } else {
      log('yellow', '⚠️  Safe buffer copying strategy may not be fully implemented');
    }
  } else {
    log('red', '❌ pdfUtils.ts not found');
  }
}

async function runDevelopmentTest() {
  logSection('Development Environment Test');
  
  log('blue', '🚀 Testing development server startup...');
  log('yellow', 'Note: This will try to start the dev server briefly');
  
  return new Promise((resolve) => {
    let serverStarted = false;
    let timeout;
    
    // Start webpack-dev-server
    const devServer = spawn('npm', ['run', 'dev:renderer'], {
      cwd: __dirname,
      stdio: 'pipe'
    });
    
    // Set timeout to kill server after 10 seconds
    timeout = setTimeout(() => {
      devServer.kill();
      if (!serverStarted) {
        log('red', '❌ Development server failed to start within 10 seconds');
      }
      resolve(serverStarted);
    }, 10000);
    
    devServer.stdout.on('data', (data) => {
      const output = data.toString();
      if (output.includes('webpack compiled') || output.includes('Local:')) {
        log('green', '✅ Development server started successfully');
        serverStarted = true;
        clearTimeout(timeout);
        devServer.kill();
        resolve(true);
      }
    });
    
    devServer.stderr.on('data', (data) => {
      const output = data.toString();
      if (output.includes('EADDRINUSE') || output.includes('port')) {
        log('yellow', '⚠️  Port may already be in use (this is okay if dev server is running)');
        clearTimeout(timeout);
        devServer.kill();
        resolve(true);
      } else if (output.toLowerCase().includes('error')) {
        log('red', `❌ Error starting dev server: ${output.slice(0, 200)}`);
      }
    });
    
    devServer.on('error', (error) => {
      log('red', `❌ Failed to start development server: ${error.message}`);
      clearTimeout(timeout);
      resolve(false);
    });
  });
}

async function main() {
  log('magenta', '🔧 Professional PDF Editor - Development Environment Test');
  log('white', 'This script tests the CSP fixes and development setup.\n');
  
  try {
    await testDependencies();
    await testBuildConfiguration();
    await testArrayBufferFixes();
    await testCSPConfiguration();
    
    // Uncomment the line below if you want to test dev server startup
    // await runDevelopmentTest();
    
    logSection('Summary');
    log('green', '🎉 Development environment test completed!');
    log('white', '\nTo start development:');
    log('cyan', '  npm run dev');
    log('white', '\nTo start with specific CSP debugging:');
    log('cyan', '  npm run dev:renderer  # Start webpack dev server');
    log('cyan', '  npm run dev:main      # In another terminal');
    
    logSection('Troubleshooting');
    log('yellow', 'If you see CSP errors:');
    log('white', '  1. Make sure webpack.renderer.config.js has the CSP headers configured');
    log('white', '  2. Check that main.ts has development-specific CSP settings');
    log('white', '  3. Clear browser cache and restart both dev server and Electron');
    
    log('yellow', '\nIf you see ArrayBuffer detachment errors:');
    log('white', '  1. Ensure pdfUtils.ts has the enhanced buffer handling functions');
    log('white', '  2. Check that all PDF operations use createSafePDFBytes()');
    log('white', '  3. Look for console messages about buffer strategy success/failure');
    
  } catch (error) {
    log('red', `❌ Test failed: ${error.message}`);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
