/**
 * Production Build Verification Script
 * Ensures all compilation errors are fixed and build succeeds
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('========================================');
console.log('PRODUCTION BUILD VERIFICATION');
console.log('========================================\n');

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkFile(filePath, description) {
  if (fs.existsSync(filePath)) {
    log(`✓ ${description}`, 'green');
    return true;
  } else {
    log(`✗ ${description} - Missing: ${filePath}`, 'red');
    return false;
  }
}

function runCommand(command, description) {
  try {
    log(`\nRunning: ${description}`, 'blue');
    execSync(command, { stdio: 'inherit' });
    log(`✓ ${description} completed successfully`, 'green');
    return true;
  } catch (error) {
    log(`✗ ${description} failed`, 'red');
    return false;
  }
}

async function verifyBuild() {
  let allChecksPassed = true;

  // Step 1: Verify critical files exist
  log('\n1. Verifying critical files...', 'yellow');
  const criticalFiles = [
    ['src/renderer/App.tsx', 'Main App component'],
    ['src/types/electron.d.ts', 'Electron type definitions'],
    ['src/main.js', 'Main process file'],
    ['src/preload.js', 'Preload script'],
    ['webpack.main.config.js', 'Main webpack config'],
    ['webpack.renderer.config.js', 'Renderer webpack config'],
    ['package.json', 'Package configuration'],
    ['tsconfig.json', 'TypeScript configuration']
  ];

  for (const [file, desc] of criticalFiles) {
    if (!checkFile(path.join(__dirname, file), desc)) {
      allChecksPassed = false;
    }
  }

  // Step 2: Check TypeScript compilation
  log('\n2. Checking TypeScript compilation...', 'yellow');
  if (!runCommand('npx tsc --noEmit', 'TypeScript type checking')) {
    log('TypeScript errors detected - attempting to show details', 'yellow');
    try {
      execSync('npx tsc --noEmit --pretty', { stdio: 'inherit' });
    } catch (e) {
      // Errors shown above
    }
    allChecksPassed = false;
  }

  // Step 3: Clean previous builds
  log('\n3. Cleaning previous builds...', 'yellow');
  const distPath = path.join(__dirname, 'dist');
  if (fs.existsSync(distPath)) {
    fs.rmSync(distPath, { recursive: true, force: true });
    log('✓ Previous builds cleaned', 'green');
  }

  // Step 4: Build main process
  log('\n4. Building main process...', 'yellow');
  if (!runCommand('npm run build:main', 'Main process build')) {
    allChecksPassed = false;
  }

  // Step 5: Build renderer process
  log('\n5. Building renderer process...', 'yellow');
  if (!runCommand('npm run build:renderer', 'Renderer process build')) {
    allChecksPassed = false;
  }

  // Step 6: Verify build output
  log('\n6. Verifying build output...', 'yellow');
  const buildOutputs = [
    ['dist/main.js', 'Main process bundle'],
    ['dist/preload.js', 'Preload script bundle'],
    ['dist/renderer.js', 'Renderer bundle'],
    ['dist/index.html', 'HTML entry point']
  ];

  for (const [file, desc] of buildOutputs) {
    if (!checkFile(path.join(__dirname, file), desc)) {
      allChecksPassed = false;
    }
  }

  // Step 7: Check for security vulnerabilities
  log('\n7. Checking for security vulnerabilities...', 'yellow');
  try {
    execSync('npm audit --audit-level=high', { stdio: 'pipe' });
    log('✓ No high severity vulnerabilities found', 'green');
  } catch (error) {
    log('⚠ Security vulnerabilities detected - run "npm audit fix"', 'yellow');
  }

  // Final report
  log('\n========================================', 'blue');
  if (allChecksPassed) {
    log('BUILD VERIFICATION SUCCESSFUL', 'green');
    log('All checks passed! Ready for production.', 'green');
    
    log('\nNext steps:', 'yellow');
    log('1. Run "npm start" to test the application', 'blue');
    log('2. Run "npm run dist" to create installer', 'blue');
    log('3. Test the installer on target platforms', 'blue');
  } else {
    log('BUILD VERIFICATION FAILED', 'red');
    log('Please fix the errors above and run again.', 'red');
    process.exit(1);
  }
  log('========================================', 'blue');
}

// Run verification
verifyBuild().catch(error => {
  log(`\nUnexpected error: ${error.message}`, 'red');
  process.exit(1);
});
