const { execSync } = require('child_process');
const fs = require('fs-extra');
const path = require('path');

console.log('🚀 Starting build process...');

// Clean dist directory
console.log('🧹 Cleaning previous build...');
const distPath = path.join(__dirname, 'dist');
if (fs.existsSync(distPath)) {
  fs.removeSync(distPath);
}

// Create necessary directories
fs.ensureDirSync(path.join(distPath, 'public'));
fs.ensureDirSync(path.join(distPath, 'renderer'));
fs.ensureDirSync(path.join(distPath, 'main'));

// Copy public assets
console.log('📁 Copying public assets...');
fs.copySync(
  path.join(__dirname, 'public'),
  path.join(distPath, 'public')
);

// Build main process
console.log('🔨 Building main process...');
try {
  execSync('npx webpack --config webpack.main.config.js --mode production', {
    stdio: 'inherit'
  });
} catch (error) {
  console.error('❌ Main process build failed');
  process.exit(1);
}

// Build renderer process
console.log('🎨 Building renderer process...');
try {
  execSync('npx webpack --config webpack.renderer.config.js --mode production', {
    stdio: 'inherit',
    env: { ...process.env, NODE_ENV: 'production' }
  });
} catch (error) {
  console.error('❌ Renderer process build failed');
  process.exit(1);
}

// Verify build
console.log('✅ Build completed successfully!');
console.log('📁 Output directory:', path.resolve(distPath));
