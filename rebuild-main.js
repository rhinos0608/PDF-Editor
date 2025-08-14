#!/usr/bin/env node
/**
 * Quick Rebuild Main Script
 * Rebuilds just the main process files with GPU fixes
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 Quick Rebuild - Main Process with GPU Fixes');
console.log('================================================\n');

const rootDir = __dirname;

try {
  // Check if webpack config exists
  const webpackMainConfig = path.join(rootDir, 'webpack.main.config.js');
  
  if (fs.existsSync(webpackMainConfig)) {
    console.log('Building main process with webpack...');
    execSync('npx webpack --config webpack.main.config.js --mode production', {
      cwd: rootDir,
      stdio: 'inherit'
    });
    console.log('✅ Main process built successfully!\n');
  } else {
    console.log('⚠️  Webpack config not found, using TypeScript directly...');
    
    // Compile TypeScript files
    execSync('npx tsc src/main/main.ts src/main/preload.ts --outDir dist/main --module commonjs --target es2020 --esModuleInterop --skipLibCheck', {
      cwd: rootDir,
      stdio: 'inherit'
    });
    console.log('✅ TypeScript compilation complete!\n');
  }
  
  // Verify the output
  const mainPath = path.join(rootDir, 'dist', 'main', 'main.js');
  const preloadPath = path.join(rootDir, 'dist', 'main', 'preload.js');
  
  if (fs.existsSync(mainPath) && fs.existsSync(preloadPath)) {
    console.log('✅ Build verification passed!');
    console.log('  - dist/main/main.js exists');
    console.log('  - dist/main/preload.js exists\n');
    
    console.log('📋 Next steps:');
    console.log('  1. Run: FIX-AND-RUN.bat');
    console.log('  2. Or: npm run start:safe');
    console.log('  3. Or: npm run start:gpu-fix\n');
  } else {
    console.error('❌ Build verification failed - files missing');
  }
  
} catch (error) {
  console.error('❌ Build failed:', error.message);
  console.log('\nTrying fallback build method...');
  
  // Try npm script
  try {
    execSync('npm run build:main', {
      cwd: rootDir,
      stdio: 'inherit'
    });
    console.log('✅ Fallback build successful!');
  } catch {
    console.error('❌ All build methods failed');
    console.log('\nPlease install dependencies first:');
    console.log('  npm install');
  }
}
