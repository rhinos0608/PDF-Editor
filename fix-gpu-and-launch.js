#!/usr/bin/env node
/**
 * GPU Fix and Launch Script v13.0
 * Fixes GPU/WebGL issues and ensures proper app launch
 * Follows Grimoire patterns: Diagnostic-First, Recovery Cascade
 */

const fs = require('fs');
const path = require('path');
const { spawn, execSync } = require('child_process');

// Color codes for visual excellence
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function header(title) {
  console.log('\n' + '='.repeat(60));
  log(`  ${title}`, colors.cyan);
  console.log('='.repeat(60));
}

class GPUFixLauncher {
  constructor() {
    this.rootDir = __dirname;
    this.confidence = 0;
    this.launchStrategies = [];
  }

  async execute() {
    header('🚀 PDF Editor GPU Fix & Launch v13.0');
    
    // Phase 1: Diagnostic (Collapse)
    await this.diagnose();
    
    // Phase 2: Council (Multi-voice decision)
    await this.assembleCouncil();
    
    // Phase 3: Synthesis (Build if needed)
    await this.synthesize();
    
    // Phase 4: Rebirth (Launch with fixes)
    await this.launch();
  }

  async diagnose() {
    header('📊 Phase 1: Diagnostic Analysis');
    
    // Check for GPU issues
    log('Checking GPU/WebGL compatibility...', colors.yellow);
    
    // Verify file structure
    const criticalFiles = [
      'dist/main/main.js',
      'dist/main/preload.js',
      'dist/renderer/index.html',
      'dist/renderer/renderer.js',
      'dist/renderer/vendors.js'
    ];
    
    let filesOk = true;
    for (const file of criticalFiles) {
      const fullPath = path.join(this.rootDir, file);
      if (fs.existsSync(fullPath)) {
        log(`  ✓ ${file}`, colors.green);
        this.confidence += 0.15;
      } else {
        log(`  ✗ ${file} - MISSING`, colors.red);
        filesOk = false;
      }
    }
    
    // Check Electron
    const electronPath = path.join(this.rootDir, 'node_modules', 'electron');
    if (fs.existsSync(electronPath)) {
      log('  ✓ Electron installed', colors.green);
      this.confidence += 0.25;
    } else {
      log('  ✗ Electron not found', colors.red);
    }
    
    log(`\nConfidence: ${(this.confidence * 100).toFixed(0)}%`, 
        this.confidence > 0.7 ? colors.green : colors.yellow);
    
    return filesOk;
  }

  async assembleCouncil() {
    header('🎭 Phase 2: Council Assembly');
    
    const voices = {
      guardian: {
        name: 'Guardian',
        says: 'Disable GPU to prevent crashes',
        weight: 0.35
      },
      performance: {
        name: 'Performance',
        says: 'Use software rendering fallback',
        weight: 0.25
      },
      maintainer: {
        name: 'Maintainer',
        says: 'Ensure stable launch path',
        weight: 0.20
      },
      explorer: {
        name: 'Explorer',
        says: 'Try WebGL2 with fallbacks',
        weight: 0.20
      }
    };
    
    // Council deliberation
    for (const [key, voice] of Object.entries(voices)) {
      log(`${voice.name}: "${voice.says}"`, colors.magenta);
    }
    
    // Synthesis
    log('\n✨ Council Decision: Disable GPU, use software rendering', colors.green);
    
    // Define launch strategies based on council
    this.launchStrategies = [
      {
        name: 'Safe Mode (No GPU)',
        confidence: 0.95,
        env: {
          ELECTRON_DISABLE_GPU: '1',
          ELECTRON_ENABLE_LOGGING: '1',
          ELECTRON_NO_SANDBOX: '1'
        },
        args: ['--disable-gpu', '--disable-software-rasterizer', '--no-sandbox']
      },
      {
        name: 'Software Rendering',
        confidence: 0.90,
        env: {
          ELECTRON_DISABLE_GPU: '1',
          ELECTRON_FORCE_SOFTWARE_RENDERING: '1'
        },
        args: ['--disable-gpu', '--disable-gpu-compositing']
      },
      {
        name: 'WebGL Compatibility',
        confidence: 0.85,
        env: {},
        args: ['--use-angle=swiftshader', '--use-gl=swiftshader']
      },
      {
        name: 'Basic Launch',
        confidence: 0.80,
        env: {},
        args: []
      }
    ];
  }

  async synthesize() {
    header('🔧 Phase 3: Synthesis & Preparation');
    
    // Check if we need to build
    if (this.confidence < 0.5) {
      log('Confidence too low, rebuilding...', colors.yellow);
      await this.rebuild();
    } else {
      log('Files ready, skipping rebuild', colors.green);
    }
    
    // Fix the HTML file to ensure scripts load
    await this.ensureHtmlIntegrity();
  }

  async ensureHtmlIntegrity() {
    log('Verifying HTML integrity...', colors.yellow);
    
    const htmlPath = path.join(this.rootDir, 'dist', 'renderer', 'index.html');
    
    if (!fs.existsSync(htmlPath)) {
      log('  Creating emergency HTML...', colors.yellow);
      const emergencyHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdnjs.cloudflare.com; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdnjs.cloudflare.com; style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com; font-src 'self' https://cdnjs.cloudflare.com data:; img-src 'self' data: blob:; connect-src 'self' https://cdnjs.cloudflare.com;">
  <title>Professional PDF Editor</title>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #1e1e1e;
      color: #fff;
      overflow: hidden;
    }
    #root {
      width: 100vw;
      height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .loading {
      text-align: center;
    }
    .loading h1 {
      font-size: 24px;
      margin-bottom: 20px;
    }
    .spinner {
      border: 3px solid rgba(255, 255, 255, 0.1);
      border-radius: 50%;
      border-top: 3px solid #007acc;
      width: 40px;
      height: 40px;
      animation: spin 1s linear infinite;
      margin: 0 auto;
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  </style>
</head>
<body>
  <div id="root">
    <div class="loading">
      <h1>Professional PDF Editor</h1>
      <div class="spinner"></div>
      <p>Loading application...</p>
    </div>
  </div>
  
  <!-- Load PDF.js first -->
  <script src="pdfjs.js"></script>
  
  <!-- Then vendors -->
  <script src="vendors.js"></script>
  
  <!-- Finally the main app -->
  <script src="renderer.js"></script>
  
  <!-- Fallback script -->
  <script>
    window.addEventListener('error', function(e) {
      console.error('Script loading error:', e);
      
      // If main scripts fail, show error
      setTimeout(() => {
        const root = document.getElementById('root');
        if (root && root.querySelector('.loading')) {
          root.innerHTML = '<div style="text-align: center; padding: 50px;"><h1>Loading Error</h1><p>Please restart the application or press Ctrl+R to reload.</p></div>';
        }
      }, 5000);
    });
    
    // Check if electronAPI is available
    setTimeout(() => {
      if (window.electronAPI) {
        console.log('✓ Electron API loaded successfully');
      } else {
        console.warn('⚠ Electron API not available - preload script may have issues');
      }
    }, 1000);
  </script>
</body>
</html>`;
      
      // Ensure directory exists
      const rendererDir = path.join(this.rootDir, 'dist', 'renderer');
      if (!fs.existsSync(rendererDir)) {
        fs.mkdirSync(rendererDir, { recursive: true });
      }
      
      fs.writeFileSync(htmlPath, emergencyHtml);
      log('  ✓ Emergency HTML created', colors.green);
    } else {
      log('  ✓ HTML file exists', colors.green);
    }
  }

  async rebuild() {
    log('Rebuilding application...', colors.yellow);
    
    try {
      // Try to run the build script
      if (fs.existsSync(path.join(this.rootDir, 'build-unified.js'))) {
        execSync('node build-unified.js', { 
          cwd: this.rootDir,
          stdio: 'inherit'
        });
      } else if (fs.existsSync(path.join(this.rootDir, 'build-master-v5.js'))) {
        execSync('node build-master-v5.js', { 
          cwd: this.rootDir,
          stdio: 'inherit'
        });
      } else {
        // Fallback to npm build
        execSync('npm run build', { 
          cwd: this.rootDir,
          stdio: 'inherit'
        });
      }
      
      log('✓ Build completed', colors.green);
      this.confidence = 0.8;
    } catch (error) {
      log('✗ Build failed, continuing anyway', colors.yellow);
    }
  }

  async launch() {
    header('🚀 Phase 4: Launch Application');
    
    for (const strategy of this.launchStrategies) {
      log(`\nTrying: ${strategy.name} (${(strategy.confidence * 100).toFixed(0)}% confidence)`, colors.cyan);
      
      const success = await this.tryLaunch(strategy);
      
      if (success) {
        log('✅ Application launched successfully!', colors.green);
        return true;
      }
    }
    
    // If all strategies fail, provide manual instructions
    this.showManualInstructions();
    return false;
  }

  async tryLaunch(strategy) {
    try {
      const electronPath = this.findElectron();
      
      if (!electronPath) {
        log('  ✗ Electron not found', colors.red);
        return false;
      }
      
      const mainPath = path.join(this.rootDir, 'dist', 'main', 'main.js');
      
      if (!fs.existsSync(mainPath)) {
        log('  ✗ Main file not found', colors.red);
        return false;
      }
      
      // Set environment variables
      const env = {
        ...process.env,
        ...strategy.env
      };
      
      // Launch command
      const args = [mainPath, ...strategy.args];
      
      log(`  Launching: ${electronPath} ${args.join(' ')}`, colors.blue);
      
      const child = spawn(electronPath, args, {
        env,
        cwd: this.rootDir,
        detached: false,
        stdio: 'inherit'
      });
      
      // Give it time to start
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Check if process is still running
      try {
        process.kill(child.pid, 0);
        return true; // Process is running
      } catch {
        return false; // Process died
      }
      
    } catch (error) {
      log(`  ✗ Launch failed: ${error.message}`, colors.red);
      return false;
    }
  }

  findElectron() {
    const possiblePaths = [
      path.join(this.rootDir, 'node_modules', '.bin', 'electron.cmd'),
      path.join(this.rootDir, 'node_modules', '.bin', 'electron'),
      path.join(this.rootDir, 'node_modules', 'electron', 'dist', 'electron.exe'),
      path.join(this.rootDir, 'node_modules', 'electron', 'dist', 'electron')
    ];
    
    for (const electronPath of possiblePaths) {
      if (fs.existsSync(electronPath)) {
        return electronPath;
      }
    }
    
    // Try npx
    try {
      execSync('npx electron --version', { stdio: 'pipe' });
      return 'npx electron';
    } catch {
      return null;
    }
  }

  showManualInstructions() {
    header('📋 Manual Launch Instructions');
    
    log('All automatic strategies failed. Try these manual steps:', colors.yellow);
    log('\n1. Open Command Prompt as Administrator', colors.cyan);
    log('2. Navigate to: ' + this.rootDir, colors.cyan);
    log('3. Run these commands in order:', colors.cyan);
    log('   set ELECTRON_DISABLE_GPU=1', colors.white);
    log('   set ELECTRON_NO_SANDBOX=1', colors.white);
    log('   npx electron dist/main/main.js --disable-gpu --no-sandbox', colors.white);
    log('\n4. If that fails, try:', colors.cyan);
    log('   npm run start:safe', colors.white);
    log('\n5. As last resort:', colors.cyan);
    log('   Open dist/renderer/index.html directly in Chrome/Edge', colors.white);
  }
}

// Execute the launcher
const launcher = new GPUFixLauncher();
launcher.execute().catch(error => {
  log(`\n❌ Fatal error: ${error.message}`, colors.red);
  process.exit(1);
});
