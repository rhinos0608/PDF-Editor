/**
 * PDF Editor Launcher v3.0
 * Comprehensive launcher with automatic recovery
 * Uses Transithesis framework for optimal execution
 */

const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 PDF Editor Professional Launcher v3.0');
console.log('━'.repeat(60));

// Check system readiness
function checkReadiness() {
  console.log('\n📊 System Check:');
  
  const checks = [
    {
      name: 'Node.js',
      check: () => process.version,
      required: 'v14.0.0'
    },
    {
      name: 'Main Process',
      check: () => fs.existsSync(path.join(__dirname, 'dist/main/main.js')),
      required: true
    },
    {
      name: 'Preload Script',
      check: () => fs.existsSync(path.join(__dirname, 'dist/main/preload.js')),
      required: true
    },
    {
      name: 'Renderer',
      check: () => fs.existsSync(path.join(__dirname, 'dist/renderer/index.html')),
      required: true
    },
    {
      name: 'Electron',
      check: () => {
        try {
          execSync('npx electron --version', { stdio: 'pipe' });
          return true;
        } catch {
          return false;
        }
      },
      required: true
    }
  ];
  
  let allPassed = true;
  
  checks.forEach(check => {
    const result = check.check();
    if (typeof result === 'string') {
      console.log(`  ✓ ${check.name}: ${result}`);
    } else if (result === true) {
      console.log(`  ✓ ${check.name}: Ready`);
    } else {
      console.log(`  ✗ ${check.name}: Missing`);
      if (check.required === true) {
        allPassed = false;
      }
    }
  });
  
  return allPassed;
}

// Auto-build if needed
function autoBuild() {
  console.log('\n🔧 Auto-Build Check:');
  
  const mainExists = fs.existsSync(path.join(__dirname, 'dist/main/main.js'));
  const rendererExists = fs.existsSync(path.join(__dirname, 'dist/renderer/index.html'));
  
  if (!mainExists || !rendererExists) {
    console.log('  ⚠️ Build required - missing components');
    console.log('  🔨 Starting automatic build...\n');
    
    try {
      execSync('node build-master-v3.js', { 
        stdio: 'inherit',
        cwd: __dirname 
      });
      console.log('\n  ✓ Build completed successfully');
      return true;
    } catch (error) {
      console.error('  ✗ Build failed:', error.message);
      
      // Try emergency build
      console.log('  🚨 Attempting emergency build...');
      try {
        execSync('node build-emergency.js', { 
          stdio: 'inherit',
          cwd: __dirname 
        });
        return true;
      } catch {
        return false;
      }
    }
  } else {
    console.log('  ✓ Build artifacts present');
    return true;
  }
}

// Launch application
function launchApp() {
  console.log('\n🚀 Launching Application:');
  
  const mainPath = path.join(__dirname, 'dist/main/main.js');
  
  // Check one more time
  if (!fs.existsSync(mainPath)) {
    console.error('  ✗ Main process not found at:', mainPath);
    console.error('\n❌ Cannot start application - build failed');
    return false;
  }
  
  console.log('  📂 Main process:', mainPath);
  console.log('  ⚡ Starting Electron...\n');
  
  // Launch with proper error handling
  const electron = spawn('npx', ['electron', mainPath], {
    stdio: 'inherit',
    shell: true,
    env: {
      ...process.env,
      ELECTRON_ENABLE_LOGGING: '1',
      NODE_ENV: 'production'
    }
  });
  
  electron.on('error', (error) => {
    console.error('\n❌ Failed to start:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('  1. Run: npm install electron');
    console.log('  2. Check if antivirus is blocking');
    console.log('  3. Try: npx electron dist/main/main.js');
  });
  
  electron.on('exit', (code) => {
    if (code !== 0 && code !== null) {
      console.log(`\n⚠️ Application exited with code: ${code}`);
    } else {
      console.log('\n✅ Application closed successfully');
    }
  });
  
  return true;
}

// Recovery mode
function recoveryMode() {
  console.log('\n🚨 Recovery Mode Activated');
  console.log('━'.repeat(60));
  
  console.log('\nAttempting recovery options:\n');
  
  // Option 1: Direct copy
  console.log('1. Direct file copy...');
  try {
    // Ensure directories exist
    const dirs = ['dist', 'dist/main', 'dist/renderer'];
    dirs.forEach(dir => {
      const dirPath = path.join(__dirname, dir);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
    });
    
    // Copy main files
    const mainSrc = path.join(__dirname, 'src/main.js');
    const mainDest = path.join(__dirname, 'dist/main/main.js');
    if (fs.existsSync(mainSrc)) {
      fs.copyFileSync(mainSrc, mainDest);
      console.log('   ✓ Copied main.js');
    }
    
    const preloadSrc = path.join(__dirname, 'src/preload.js');
    const preloadDest = path.join(__dirname, 'dist/main/preload.js');
    if (fs.existsSync(preloadSrc)) {
      fs.copyFileSync(preloadSrc, preloadDest);
      console.log('   ✓ Copied preload.js');
    }
    
    // Check for existing renderer
    const rendererHtml = path.join(__dirname, 'dist/renderer/index.html');
    if (!fs.existsSync(rendererHtml)) {
      // Create minimal HTML
      const html = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>PDF Editor</title>
    <style>
        body { 
            margin: 0; 
            background: #1e1e1e; 
            color: white; 
            font-family: sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
        }
    </style>
</head>
<body>
    <div>
        <h1>PDF Editor - Recovery Mode</h1>
        <p>Application is running in recovery mode.</p>
    </div>
</body>
</html>`;
      fs.writeFileSync(rendererHtml, html);
      console.log('   ✓ Created emergency HTML');
    }
    
    console.log('\n   ✓ Recovery successful - attempting launch...\n');
    return launchApp();
    
  } catch (error) {
    console.error('   ✗ Recovery failed:', error.message);
    return false;
  }
}

// Main execution
async function main() {
  try {
    // Step 1: Check system
    const isReady = checkReadiness();
    
    if (!isReady) {
      // Step 2: Try auto-build
      const buildSuccess = autoBuild();
      
      if (!buildSuccess) {
        // Step 3: Try recovery mode
        const recoverySuccess = recoveryMode();
        
        if (!recoverySuccess) {
          console.error('\n❌ All launch attempts failed');
          console.log('\n📝 Manual Steps:');
          console.log('  1. Delete node_modules and package-lock.json');
          console.log('  2. Run: npm install');
          console.log('  3. Run: node build-master-v3.js');
          console.log('  4. Run: npm start');
          process.exit(1);
        }
      } else {
        // Build succeeded, launch app
        launchApp();
      }
    } else {
      // System ready, launch directly
      launchApp();
    }
    
  } catch (error) {
    console.error('\n❌ Unexpected error:', error);
    console.log('\n🔧 Please report this issue with the error details above');
    process.exit(1);
  }
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n\n⚠️ Launcher interrupted by user');
  process.exit(0);
});

process.on('uncaughtException', (error) => {
  console.error('\n❌ Uncaught exception:', error);
  process.exit(1);
});

// Execute
console.log('\n🔍 Initializing PDF Editor...');
main();
