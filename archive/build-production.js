#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs-extra');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

async function runCommand(command, args = []) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      shell: true,
      stdio: 'inherit'
    });

    child.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Command failed with exit code ${code}`));
      } else {
        resolve();
      }
    });

    child.on('error', (error) => {
      reject(error);
    });
  });
}

async function buildProduction() {
  try {
    log('\n========================================', colors.bright);
    log('PROFESSIONAL PDF EDITOR - PRODUCTION BUILD', colors.bright + colors.blue);
    log('========================================\n', colors.bright);

    // Step 1: Clean previous builds
    log('Step 1: Cleaning previous builds...', colors.yellow);
    await fs.remove(path.join(__dirname, 'dist'));
    await fs.remove(path.join(__dirname, 'release'));
    log('✓ Previous builds cleaned', colors.green);

    // Step 2: Install dependencies
    log('\nStep 2: Verifying dependencies...', colors.yellow);
    await runCommand('npm', ['install']);
    log('✓ Dependencies verified', colors.green);

    // Step 3: Install missing type definitions
    log('\nStep 3: Installing type definitions...', colors.yellow);
    await runCommand('npm', ['install', '--save-dev', '@types/uuid']);
    log('✓ Type definitions installed', colors.green);

    // Step 4: Run TypeScript compilation check
    log('\nStep 4: Type checking...', colors.yellow);
    await runCommand('npx', ['tsc', '--noEmit']);
    log('✓ TypeScript compilation successful', colors.green);

    // Step 5: Build main process
    log('\nStep 5: Building main process...', colors.yellow);
    await runCommand('npm', ['run', 'build:main']);
    log('✓ Main process built', colors.green);

    // Step 6: Build renderer process
    log('\nStep 6: Building renderer process...', colors.yellow);
    await runCommand('npm', ['run', 'build:renderer']);
    log('✓ Renderer process built', colors.green);

    // Step 7: Verify build output
    log('\nStep 7: Verifying build output...', colors.yellow);
    const requiredFiles = [
      'dist/main/main.js',
      'dist/renderer/renderer.js',
      'dist/renderer/index.html'
    ];

    for (const file of requiredFiles) {
      const filePath = path.join(__dirname, file);
      if (!fs.existsSync(filePath)) {
        throw new Error(`Required file missing: ${file}`);
      }
    }
    log('✓ Build output verified', colors.green);

    // Step 8: Create distributable
    log('\nStep 8: Creating distributable...', colors.yellow);
    await runCommand('npm', ['run', 'dist']);
    log('✓ Distributable created', colors.green);

    // Success
    log('\n========================================', colors.bright + colors.green);
    log('BUILD COMPLETED SUCCESSFULLY!', colors.bright + colors.green);
    log('========================================', colors.bright + colors.green);
    log('\nDistributable files can be found in the "release" directory', colors.blue);
    log('Run "npm start" to test the application\n', colors.blue);

  } catch (error) {
    log('\n========================================', colors.bright + colors.red);
    log('BUILD FAILED', colors.bright + colors.red);
    log('========================================', colors.bright + colors.red);
    log(`\nError: ${error.message}`, colors.red);
    log('\nPlease check the error messages above and fix any issues.\n', colors.yellow);
    process.exit(1);
  }
}

// Run the build
buildProduction();
