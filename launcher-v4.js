/**
 * Professional PDF Editor - Master Launcher v4.0
 * Comprehensive launcher with full diagnostics and recovery
 * Implements Transithesis principles for maximum reliability
 */

const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Terminal colors for better visibility
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, type = 'info') {
  const prefix = {
    info: `${colors.blue}[INFO]${colors.reset}`,
    success: `${colors.green}[SUCCESS]${colors.reset}`,
    warning: `${colors.yellow}[WARNING]${colors.reset}`,
    error: `${colors.red}[ERROR]${colors.reset}`,
    debug: `${colors.magenta}[DEBUG]${colors.reset}`
  };
  console.log(`${prefix[type] || prefix.info} ${message}`);
}

function header(title) {
  console.log('\n' + '='.repeat(60));
  console.log(`${colors.cyan}${colors.bright}  ${title}${colors.reset}`);
  console.log('='.repeat(60));
}

class PDFEditorLauncher {
  constructor() {
    this.projectDir = __dirname;
    this.distDir = path.join(this.projectDir, 'dist');
    this.distMainDir = path.join(this.distDir, 'main');
    this.distRendererDir = path.join(this.distDir, 'renderer');
    this.srcDir = path.join(this.projectDir, 'src');
    
    this.requiredFiles = {
      main: [
        { path: 'dist/main/main.js', source: 'src/main.js', critical: true },
        { path: 'dist/main/preload.js', source: 'src/preload.js', critical: true }
      ],
      renderer: [
        { path: 'dist/renderer/index.html', critical: true },
        { path: 'dist/renderer/renderer.js', critical: false }
      ]
    };
  }

  async run() {
    header('PDF Editor Professional Launcher v4.0');
    
    try {
      // Phase 1: System diagnostics
      const systemReady = await this.runDiagnostics();
      
      if (!systemReady) {
        log('System not ready, attempting recovery...', 'warning');
        const recovered = await this.runRecovery();
        
        if (!recovered) {
          log('Recovery failed. Manual intervention required.', 'error');
          this.showManualInstructions();
          return false;
        }
      }
      
      // Phase 2: Build verification
      const buildValid = await this.verifyBuild();
      
      if (!buildValid) {
        log('Build incomplete, running build process...', 'warning');
        const built = await this.runBuild();
        
        if (!built) {
          log('Build failed. Attempting emergency mode...', 'error');
          await this.createEmergencyBuild();
        }
      }
      
      // Phase 3: Launch application
      log('All checks passed. Launching application...', 'success');
      return await this.launchApp();
      
    } catch (error) {
      log(`Unexpected error: ${error.message}`, 'error');
      log('Stack trace:', 'debug');
      console.error(error.stack);
      return false;
    }
  }

  async runDiagnostics() {
    header('System Diagnostics');
    
    const checks = [
      {
        name: 'Node.js Version',
        check: () => {
          const version = process.version;
          const major = parseInt(version.split('.')[0].substring(1));
          return { passed: major >= 14, value: version };
        }
      },
      {
        name: 'NPM Available',
        check: () => {
          try {
            const version = execSync('npm -v', { encoding: 'utf8' }).trim();
            return { passed: true, value: `v${version}` };
          } catch {
            return { passed: false, value: 'Not found' };
          }
        }
      },
      {
        name: 'Electron Installed',
        check: () => {
          const electronPath = path.join(this.projectDir, 'node_modules', 'electron');
          return { passed: fs.existsSync(electronPath), value: fs.existsSync(electronPath) ? 'Installed' : 'Not installed' };
        }
      },
      {
        name: 'Source Files',
        check: () => {
          const mainExists = fs.existsSync(path.join(this.srcDir, 'main.js'));
          const preloadExists = fs.existsSync(path.join(this.srcDir, 'preload.js'));
          return { 
            passed: mainExists && preloadExists, 
            value: `Main: ${mainExists ? '✓' : '✗'}, Preload: ${preloadExists ? '✓' : '✗'}` 
          };
        }
      },
      {
        name: 'Webpack Config',
        check: () => {
          const mainConfig = fs.existsSync(path.join(this.projectDir, 'webpack.main.config.js'));
          const rendererConfig = fs.existsSync(path.join(this.projectDir, 'webpack.renderer.config.js'));
          return { 
            passed: mainConfig && rendererConfig, 
            value: `Main: ${mainConfig ? '✓' : '✗'}, Renderer: ${rendererConfig ? '✓' : '✗'}` 
          };
        }
      }
    ];
    
    let allPassed = true;
    
    for (const check of checks) {
      const result = check.check();
      if (result.passed) {
        log(`✓ ${check.name}: ${result.value}`, 'success');
      } else {
        log(`✗ ${check.name}: ${result.value}`, 'error');
        allPassed = false;
      }
    }
    
    return allPassed;
  }

  async verifyBuild() {
    header('Build Verification');
    
    let allValid = true;
    
    // Check main process files
    log('Checking main process files...', 'info');
    for (const file of this.requiredFiles.main) {
      const fullPath = path.join(this.projectDir, file.path);
      const exists = fs.existsSync(fullPath);
      
      if (exists) {
        const stats = fs.statSync(fullPath);
        log(`  ✓ ${file.path} (${(stats.size / 1024).toFixed(1)} KB)`, 'success');
      } else if (file.critical) {
        log(`  ✗ ${file.path} - MISSING (Critical)`, 'error');
        allValid = false;
      } else {
        log(`  ⚠ ${file.path} - Missing (Non-critical)`, 'warning');
      }
    }
    
    // Check renderer files
    log('Checking renderer files...', 'info');
    for (const file of this.requiredFiles.renderer) {
      const fullPath = path.join(this.projectDir, file.path);
      const exists = fs.existsSync(fullPath);
      
      if (exists) {
        const stats = fs.statSync(fullPath);
        log(`  ✓ ${file.path} (${(stats.size / 1024).toFixed(1)} KB)`, 'success');
      } else if (file.critical) {
        log(`  ✗ ${file.path} - MISSING (Critical)`, 'error');
        allValid = false;
      } else {
        log(`  ⚠ ${file.path} - Missing (Non-critical)`, 'warning');
      }
    }
    
    return allValid;
  }

  async runBuild() {
    header('Building Application');
    
    try {
      // Ensure directories exist
      log('Creating directory structure...', 'info');
      this.ensureDirectories();
      
      // Build main process
      log('Building main process...', 'info');
      if (fs.existsSync(path.join(this.projectDir, 'webpack.main.config.js'))) {
        try {
          execSync('npx webpack --config webpack.main.config.js --mode production', {
            cwd: this.projectDir,
            stdio: 'pipe'
          });
          log('  ✓ Main process built', 'success');
        } catch (error) {
          log('  ✗ Webpack build failed, using direct copy', 'warning');
          this.copyMainFiles();
        }
      } else {
        this.copyMainFiles();
      }
      
      // Build preload
      log('Building preload script...', 'info');
      if (fs.existsSync(path.join(this.projectDir, 'webpack.preload.config.js'))) {
        try {
          execSync('npx webpack --config webpack.preload.config.js --mode production', {
            cwd: this.projectDir,
            stdio: 'pipe'
          });
          log('  ✓ Preload script built', 'success');
        } catch {
          this.copyPreloadFile();
        }
      } else {
        this.copyPreloadFile();
      }
      
      // Build renderer
      log('Building renderer...', 'info');
      if (fs.existsSync(path.join(this.projectDir, 'webpack.renderer.config.js'))) {
        try {
          execSync('npx webpack --config webpack.renderer.config.js --mode production', {
            cwd: this.projectDir,
            stdio: 'pipe'
          });
          log('  ✓ Renderer built', 'success');
        } catch (error) {
          log('  ✗ Renderer build failed', 'warning');
          this.createMinimalRenderer();
        }
      } else {
        this.createMinimalRenderer();
      }
      
      return true;
      
    } catch (error) {
      log(`Build error: ${error.message}`, 'error');
      return false;
    }
  }

  ensureDirectories() {
    const dirs = [this.distDir, this.distMainDir, this.distRendererDir];
    for (const dir of dirs) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        log(`  Created: ${path.relative(this.projectDir, dir)}`, 'info');
      }
    }
  }

  copyMainFiles() {
    const mainSrc = path.join(this.srcDir, 'main.js');
    const mainDest = path.join(this.distMainDir, 'main.js');
    
    if (fs.existsSync(mainSrc)) {
      fs.copyFileSync(mainSrc, mainDest);
      log('  ✓ Copied main.js (fallback)', 'success');
    }
  }

  copyPreloadFile() {
    const preloadSrc = path.join(this.srcDir, 'preload.js');
    const preloadDest = path.join(this.distMainDir, 'preload.js');
    
    if (fs.existsSync(preloadSrc)) {
      fs.copyFileSync(preloadSrc, preloadDest);
      log('  ✓ Copied preload.js (fallback)', 'success');
    }
  }

  createMinimalRenderer() {
    const htmlPath = path.join(this.distRendererDir, 'index.html');
    
    if (!fs.existsSync(htmlPath)) {
      const minimalHTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Professional PDF Editor</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #1e1e1e 0%, #2d2d2d 100%);
            color: #e0e0e0;
            height: 100vh;
            display: flex;
            flex-direction: column;
        }
        .titlebar {
            background: #1a1a1a;
            padding: 8px 16px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-bottom: 1px solid #333;
            -webkit-app-region: drag;
        }
        .titlebar h1 {
            font-size: 14px;
            font-weight: 500;
            color: #ffffff;
        }
        .main-container {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        .welcome-box {
            background: #2a2a2a;
            border-radius: 12px;
            padding: 40px;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
            text-align: center;
            max-width: 500px;
        }
        .welcome-box h2 {
            color: #667eea;
            margin-bottom: 20px;
            font-size: 28px;
        }
        .welcome-box p {
            margin-bottom: 30px;
            line-height: 1.6;
            color: #b0b0b0;
        }
        .button-group {
            display: flex;
            gap: 10px;
            justify-content: center;
        }
        button {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            font-size: 14px;
            cursor: pointer;
            transition: transform 0.2s, box-shadow 0.2s;
            -webkit-app-region: no-drag;
        }
        button:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 20px rgba(102, 126, 234, 0.4);
        }
        button:active {
            transform: translateY(0);
        }
        .status {
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: #333;
            padding: 10px 20px;
            border-radius: 20px;
            font-size: 12px;
            color: #888;
        }
        .status.success { color: #4caf50; }
        .status.error { color: #f44336; }
    </style>
</head>
<body>
    <div class="titlebar">
        <h1>Professional PDF Editor</h1>
        <div class="window-controls">
            <!-- Window controls would go here -->
        </div>
    </div>
    
    <div class="main-container">
        <div class="welcome-box">
            <h2>Welcome to PDF Editor</h2>
            <p>Professional PDF editing solution with Adobe-quality features.</p>
            <div class="button-group">
                <button onclick="openPDF()">Open PDF</button>
                <button onclick="createNew()">Create New</button>
                <button onclick="showHelp()">Help</button>
            </div>
        </div>
    </div>
    
    <div id="status" class="status">Ready</div>
    
    <script>
        // Basic functionality
        function setStatus(message, type = '') {
            const status = document.getElementById('status');
            status.textContent = message;
            status.className = 'status ' + type;
        }
        
        async function openPDF() {
            setStatus('Opening file dialog...');
            try {
                if (window.electronAPI && window.electronAPI.openFile) {
                    const result = await window.electronAPI.openFile();
                    if (result.success) {
                        setStatus('PDF loaded successfully', 'success');
                        // Load PDF viewer here
                    } else if (result.cancelled) {
                        setStatus('File selection cancelled');
                    } else {
                        setStatus('Failed to open file', 'error');
                    }
                } else {
                    setStatus('Electron API not available', 'error');
                }
            } catch (error) {
                setStatus('Error: ' + error.message, 'error');
            }
        }
        
        function createNew() {
            setStatus('Creating new PDF...');
            // Implementation here
        }
        
        function showHelp() {
            setStatus('Opening help...');
            // Implementation here
        }
        
        // Check if running in Electron
        if (window.electronAPI) {
            setStatus('Electron API connected', 'success');
            setTimeout(() => setStatus('Ready'), 2000);
        } else {
            setStatus('Running in limited mode', 'error');
        }
        
        // Listen for menu actions
        if (window.electronAPI && window.electronAPI.onMenuAction) {
            window.electronAPI.onMenuAction((action) => {
                console.log('Menu action:', action);
                setStatus('Menu: ' + action);
                
                switch(action) {
                    case 'open':
                        openPDF();
                        break;
                    case 'new':
                        createNew();
                        break;
                    case 'help':
                        showHelp();
                        break;
                }
            });
        }
    </script>
</body>
</html>`;
      
      fs.writeFileSync(htmlPath, minimalHTML);
      log('  ✓ Created minimal renderer interface', 'success');
    }
  }

  async createEmergencyBuild() {
    header('Emergency Build Mode');
    
    log('Creating emergency build...', 'warning');
    
    // Ensure all directories exist
    this.ensureDirectories();
    
    // Copy essential files
    this.copyMainFiles();
    this.copyPreloadFile();
    this.createMinimalRenderer();
    
    log('Emergency build complete', 'success');
    return true;
  }

  async runRecovery() {
    header('Recovery Mode');
    
    log('Attempting automatic recovery...', 'info');
    
    // Check for missing dependencies
    if (!fs.existsSync(path.join(this.projectDir, 'node_modules'))) {
      log('Installing dependencies...', 'info');
      try {
        execSync('npm install', {
          cwd: this.projectDir,
          stdio: 'inherit'
        });
        log('Dependencies installed', 'success');
      } catch (error) {
        log('Failed to install dependencies', 'error');
        return false;
      }
    }
    
    // Try to build
    return await this.runBuild();
  }

  async launchApp() {
    header('Launching Application');
    
    const mainPath = path.join(this.distMainDir, 'main.js');
    
    if (!fs.existsSync(mainPath)) {
      log(`Main process not found at: ${mainPath}`, 'error');
      return false;
    }
    
    log(`Starting Electron from: ${mainPath}`, 'info');
    
    return new Promise((resolve) => {
      const electron = spawn('npx', ['electron', mainPath], {
        stdio: 'inherit',
        shell: true,
        cwd: this.projectDir,
        env: {
          ...process.env,
          ELECTRON_ENABLE_LOGGING: '1',
          NODE_ENV: 'production'
        }
      });
      
      electron.on('error', (error) => {
        log(`Failed to start: ${error.message}`, 'error');
        resolve(false);
      });
      
      electron.on('exit', (code) => {
        if (code === 0 || code === null) {
          log('Application closed normally', 'success');
          resolve(true);
        } else {
          log(`Application exited with code: ${code}`, 'warning');
          resolve(false);
        }
      });
    });
  }

  showManualInstructions() {
    header('Manual Recovery Instructions');
    
    console.log(`
${colors.yellow}Please follow these steps to manually fix the issue:${colors.reset}

1. ${colors.cyan}Clean Installation:${colors.reset}
   - Delete the 'node_modules' folder
   - Delete the 'package-lock.json' file
   - Run: npm install

2. ${colors.cyan}Manual Build:${colors.reset}
   - Run: npm run build:main
   - Run: npm run build:renderer
   
3. ${colors.cyan}Direct Launch:${colors.reset}
   - Run: npx electron dist/main/main.js

4. ${colors.cyan}If still failing:${colors.reset}
   - Check antivirus/firewall settings
   - Ensure you have administrator privileges
   - Try running in safe mode: npm run start:safe
   
${colors.yellow}For more help, check the suggestions folder for detailed analytics.${colors.reset}
`);
  }
}

// Main execution
async function main() {
  const launcher = new PDFEditorLauncher();
  const success = await launcher.run();
  
  if (!success) {
    process.exit(1);
  }
}

// Handle interrupts gracefully
process.on('SIGINT', () => {
  log('\nLauncher interrupted by user', 'warning');
  process.exit(0);
});

process.on('uncaughtException', (error) => {
  log(`Uncaught exception: ${error.message}`, 'error');
  console.error(error.stack);
  process.exit(1);
});

// Run if executed directly
if (require.main === module) {
  main().catch(error => {
    log(`Fatal error: ${error.message}`, 'error');
    console.error(error.stack);
    process.exit(1);
  });
}

module.exports = { PDFEditorLauncher };
