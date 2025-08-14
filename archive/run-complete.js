const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 PDF Editor - Complete Build & Run\n');
console.log('=====================================\n');

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
  console.log(color + message + colors.reset);
}

function execCommand(command, description) {
  try {
    log(`⚙️  ${description}...`, colors.blue);
    execSync(command, { stdio: 'inherit' });
    log(`✅ ${description} completed\n`, colors.green);
    return true;
  } catch (error) {
    log(`❌ ${description} failed\n`, colors.red);
    return false;
  }
}

// Step 1: Clean previous build
log('🧹 Step 1: Cleaning previous build...', colors.bright);
const distPath = path.join(__dirname, 'dist');
if (fs.existsSync(distPath)) {
  fs.rmSync(distPath, { recursive: true, force: true });
  log('   Removed dist directory', colors.green);
}

// Step 2: Install dependencies if needed
log('\n📦 Step 2: Checking dependencies...', colors.bright);
if (!fs.existsSync(path.join(__dirname, 'node_modules'))) {
  execCommand('npm install', 'Installing dependencies');
} else {
  log('   Dependencies already installed', colors.green);
}

// Step 3: Build renderer
log('\n🎨 Step 3: Building renderer process...', colors.bright);
if (!execCommand('npx webpack --config webpack.renderer.config.js --mode production', 'Building renderer')) {
  log('Trying alternative build command...', colors.yellow);
  execCommand('npm run build:renderer', 'Building renderer (alternative)');
}

// Step 4: Build main process
log('\n⚡ Step 4: Building main process...', colors.bright);
if (!execCommand('npx webpack --config webpack.main.config.js --mode production', 'Building main')) {
  log('Trying alternative build command...', colors.yellow);
  execCommand('npm run build:main', 'Building main (alternative)');
}

// Step 5: Verify build output
log('\n🔍 Step 5: Verifying build output...', colors.bright);
const requiredFiles = [
  { path: 'dist/renderer/index.html', name: 'Renderer HTML' },
  { path: 'dist/renderer/renderer.js', name: 'Renderer JS' },
  { path: 'dist/main/main.js', name: 'Main Process' },
  { path: 'dist/main/preload.js', name: 'Preload Script' }
];

let buildSuccess = true;
requiredFiles.forEach(file => {
  const filePath = path.join(__dirname, file.path);
  if (fs.existsSync(filePath)) {
    const stats = fs.statSync(filePath);
    log(`   ✅ ${file.name}: ${(stats.size / 1024).toFixed(2)} KB`, colors.green);
  } else {
    log(`   ❌ ${file.name}: MISSING`, colors.red);
    buildSuccess = false;
  }
});

if (!buildSuccess) {
  log('\n⚠️  Build incomplete - some files are missing', colors.yellow);
  log('Attempting to create missing files...', colors.yellow);
  
  // Create minimal fallback files if needed
  const rendererHtml = path.join(__dirname, 'dist/renderer/index.html');
  if (!fs.existsSync(rendererHtml)) {
    fs.mkdirSync(path.dirname(rendererHtml), { recursive: true });
    fs.copyFileSync(
      path.join(__dirname, 'public/index.html'),
      rendererHtml
    );
    log('   Created fallback index.html', colors.yellow);
  }
}

// Step 6: Start the application
log('\n🚀 Step 6: Starting PDF Editor...', colors.bright);
log('=====================================\n', colors.bright);

try {
  // Check if Electron is installed
  const electronPath = path.join(__dirname, 'node_modules/.bin/electron');
  if (!fs.existsSync(electronPath) && !fs.existsSync(electronPath + '.cmd')) {
    log('Installing Electron...', colors.yellow);
    execSync('npm install electron --save-dev', { stdio: 'inherit' });
  }
  
  // Start the application
  const mainPath = path.join(__dirname, 'dist/main/main.js');
  if (fs.existsSync(mainPath)) {
    log('Starting from: ' + mainPath, colors.green);
    execSync(`npx electron ${mainPath}`, { stdio: 'inherit' });
  } else {
    // Fallback to public/index.html
    log('Starting with fallback...', colors.yellow);
    execSync('npx electron .', { stdio: 'inherit' });
  }
} catch (error) {
  log('\nApplication closed or error occurred', colors.yellow);
  console.error(error.message);
}

log('\n✨ Thank you for using Professional PDF Editor!', colors.bright);
