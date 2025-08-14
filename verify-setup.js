/**
 * PDF Editor - Setup Verification
 * Checks if all required files exist and are properly configured
 */

const fs = require('fs');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkFile(filePath, description) {
  const fullPath = path.join(__dirname, filePath);
  if (fs.existsSync(fullPath)) {
    log(`  ✅ ${description}`, 'green');
    return true;
  } else {
    log(`  ❌ ${description} - MISSING at ${filePath}`, 'red');
    return false;
  }
}

function verifySetup() {
  log('\n🔍 PDF Editor Setup Verification\n', 'magenta');
  
  let allGood = true;
  
  // Check main process files
  log('📦 Main Process Files:', 'blue');
  allGood &= checkFile('dist/main/main.js', 'Main process script');
  allGood &= checkFile('dist/main/preload.js', 'Preload script');
  
  // Check renderer files
  log('\n🎨 Renderer Files:', 'blue');
  allGood &= checkFile('dist/renderer/index.html', 'HTML entry point');
  allGood &= checkFile('dist/renderer/web-init.js', 'Web initialization');
  allGood &= checkFile('dist/renderer/runtime.js', 'Webpack runtime');
  allGood &= checkFile('dist/renderer/vendors.js', 'Vendor bundle');
  allGood &= checkFile('dist/renderer/renderer.js', 'Application bundle');
  allGood &= checkFile('dist/renderer/pdfjs.js', 'PDF.js bundle');
  
  // Check if web-init.js is loaded first in index.html
  log('\n📝 HTML Configuration:', 'blue');
  const indexPath = path.join(__dirname, 'dist/renderer/index.html');
  if (fs.existsSync(indexPath)) {
    const indexContent = fs.readFileSync(indexPath, 'utf8');
    const webInitPos = indexContent.indexOf('web-init.js');
    const vendorsPos = indexContent.indexOf('vendors.js');
    
    if (webInitPos > -1 && vendorsPos > -1 && webInitPos < vendorsPos) {
      log('  ✅ web-init.js loads before vendors.js', 'green');
    } else {
      log('  ❌ Script loading order incorrect!', 'red');
      log('     web-init.js must load before vendors.js', 'yellow');
      allGood = false;
    }
  }
  
  // Check runner scripts
  log('\n🚀 Runner Scripts:', 'blue');
  allGood &= checkFile('run-dev.js', 'Development runner');
  allGood &= checkFile('RUN-DEV.bat', 'Development launcher');
  
  // Check package.json scripts
  log('\n📜 Package Scripts:', 'blue');
  const packagePath = path.join(__dirname, 'package.json');
  if (fs.existsSync(packagePath)) {
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    const scripts = packageJson.scripts || {};
    
    if (scripts['start-dev']) {
      log('  ✅ start-dev script configured', 'green');
    } else {
      log('  ⚠️  start-dev script not found', 'yellow');
    }
    
    if (scripts['start']) {
      log('  ✅ start script configured', 'green');
    } else {
      log('  ❌ start script missing', 'red');
      allGood = false;
    }
  }
  
  // Summary
  log('\n' + '='.repeat(50), 'blue');
  if (allGood) {
    log('\n✨ All checks passed! The app is ready to run.\n', 'green');
    log('You can start the app with:', 'yellow');
    log('  npm run start-dev    (development mode)', 'blue');
    log('  npm start           (production mode)', 'blue');
    log('  RUN-DEV.bat         (development batch file)', 'blue');
  } else {
    log('\n⚠️  Some issues were found. Please fix them before running.\n', 'red');
    log('You may need to:', 'yellow');
    log('  1. Run: npm run build', 'blue');
    log('  2. Check the error messages above', 'blue');
    log('  3. Run this verification again', 'blue');
  }
  log('');
  
  return allGood;
}

// Run verification
const success = verifySetup();
process.exit(success ? 0 : 1);
