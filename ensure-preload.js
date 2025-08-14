#!/usr/bin/env node

/**
 * Quick Preload Builder
 * Ensures preload.js exists in dist/main/
 */

const fs = require('fs');
const path = require('path');

const srcPreload = path.join(__dirname, 'src', 'preload.js');
const distPreload = path.join(__dirname, 'dist', 'main', 'preload.js');

// Create dist/main if it doesn't exist
const distMainDir = path.join(__dirname, 'dist', 'main');
if (!fs.existsSync(distMainDir)) {
  fs.mkdirSync(distMainDir, { recursive: true });
  console.log('✓ Created dist/main directory');
}

// Copy preload if it doesn't exist or is older
if (!fs.existsSync(distPreload) || 
    fs.statSync(srcPreload).mtime > fs.statSync(distPreload).mtime) {
  fs.copyFileSync(srcPreload, distPreload);
  console.log('✓ Copied preload.js to dist/main/');
} else {
  console.log('✓ Preload.js already up to date');
}
