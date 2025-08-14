#!/usr/bin/env node

/**
 * Quick Build Test Script
 * Tests if the application builds without errors
 */

const { execSync } = require('child_process');
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

log('\n========================================', colors.cyan);
log('Testing TypeScript Compilation', colors.yellow);
log('========================================\n', colors.cyan);

try {
  log('Testing main process build...', colors.yellow);
  execSync('npx webpack --config webpack.main.config.js --mode production', { stdio: 'inherit' });
  log('✓ Main process compiled successfully!', colors.green);
  
  log('\nTesting renderer process build...', colors.yellow);
  execSync('npx webpack --config webpack.renderer.config.js --mode production', { stdio: 'inherit' });
  log('✓ Renderer process compiled successfully!', colors.green);
  
  log('\n========================================', colors.cyan);
  log('✅ ALL COMPILATION ERRORS FIXED!', colors.green);
  log('========================================\n', colors.cyan);
  log('The application is ready for production!', colors.green);
  
} catch (error) {
  log('\n❌ Build failed. Please check the errors above.', colors.red);
  process.exit(1);
}
