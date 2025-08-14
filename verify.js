/**
 * Quick Verification Script
 * Checks if all critical files are in place
 */

const fs = require('fs');
const path = require('path');

console.log('PDF Editor - Quick Verification\n');
console.log('='.repeat(40));

const checks = [
  // Critical files
  { file: 'dist/main/main.js', type: 'Critical' },
  { file: 'dist/main/preload.js', type: 'Critical' },
  { file: 'dist/renderer/index.html', type: 'Critical' },
  
  // Source files
  { file: 'src/main.js', type: 'Source' },
  { file: 'src/preload.js', type: 'Source' },
  
  // Build files
  { file: 'launcher-v4.js', type: 'Launcher' },
  { file: 'build-master-v5.js', type: 'Builder' },
  { file: 'START.bat', type: 'Entry Point' },
  
  // Config files
  { file: 'package.json', type: 'Config' },
  { file: 'webpack.main.config.js', type: 'Config' },
  { file: 'webpack.renderer.config.js', type: 'Config' }
];

let allGood = true;

checks.forEach(check => {
  const exists = fs.existsSync(path.join(__dirname, check.file));
  const status = exists ? '✓' : '✗';
  const color = exists ? '\x1b[32m' : '\x1b[31m';
  const reset = '\x1b[0m';
  
  console.log(`${color}[${status}]${reset} ${check.type.padEnd(12)} - ${check.file}`);
  
  if (!exists && check.type === 'Critical') {
    allGood = false;
  }
});

console.log('='.repeat(40));

if (allGood) {
  console.log('\n\x1b[32m✅ All critical files present!\x1b[0m');
  console.log('\nRun START.bat to launch the application.');
} else {
  console.log('\n\x1b[31m❌ Some critical files missing!\x1b[0m');
  console.log('\nRun BUILD-AND-RUN.bat to rebuild and launch.');
}

console.log('\nFor detailed diagnostics, run: node launcher-v4.js');
