const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Building Professional PDF Editor...\n');

// Step 1: Clean dist directory
console.log('🧹 Cleaning previous build...');
const distPath = path.join(__dirname, 'dist');
if (fs.existsSync(distPath)) {
  fs.rmSync(distPath, { recursive: true, force: true });
}

// Step 2: Build renderer
console.log('🔨 Building renderer...');
try {
  execSync('npx webpack --config webpack.renderer.config.js', { 
    stdio: 'inherit',
    env: { ...process.env, NODE_ENV: 'production' }
  });
} catch (error) {
  console.error('❌ Renderer build failed');
  process.exit(1);
}

// Step 3: Build main process
console.log('🔨 Building main process...');
try {
  execSync('npx webpack --config webpack.main.config.js', { 
    stdio: 'inherit',
    env: { ...process.env, NODE_ENV: 'production' }
  });
} catch (error) {
  console.error('❌ Main process build failed');
  process.exit(1);
}

// Step 4: Verify build
console.log('\n✅ Verifying build...');
const requiredFiles = [
  'dist/renderer/index.html',
  'dist/renderer/renderer.js',
  'dist/main/main.js',
  'dist/main/preload.js'
];

let allFilesExist = true;
for (const file of requiredFiles) {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    console.log(`  ✓ ${file}`);
  } else {
    console.log(`  ✗ ${file} - MISSING`);
    allFilesExist = false;
  }
}

if (!allFilesExist) {
  console.error('\n❌ Build verification failed - some files are missing');
  process.exit(1);
}

console.log('\n✨ Build successful!');
console.log('\n📦 To run the application:');
console.log('   npm start');
console.log('   or');
console.log('   npx electron dist/main/main.js\n');
