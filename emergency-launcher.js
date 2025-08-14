#!/usr/bin/env node
/**
 * Emergency Launcher v11.0
 * Direct Electron invocation with comprehensive diagnostics
 * Implements Transithesis recovery cascade
 */

const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Color codes for console output
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
  const icons = {
    info: `${colors.blue}ℹ${colors.reset}`,
    success: `${colors.green}✓${colors.reset}`,
    warning: `${colors.yellow}⚠${colors.reset}`,
    error: `${colors.red}✗${colors.reset}`,
    debug: `${colors.magenta}⚡${colors.reset}`
  };
  console.log(`${icons[type]} ${message}`);
}

function header(title) {
  console.log('\n' + '='.repeat(60));
  console.log(`${colors.cyan}${colors.bright}  ${title}${colors.reset}`);
  console.log('='.repeat(60));
}

class EmergencyLauncher {
  constructor() {
    this.rootDir = __dirname;
    this.mainPath = path.join(this.rootDir, 'dist', 'main', 'main.js');
    this.preloadPath = path.join(this.rootDir, 'dist', 'main', 'preload.js');
    this.rendererPath = path.join(this.rootDir, 'dist', 'renderer', 'index.html');
    this.electronPath = this.findElectron();
  }

  findElectron() {
    // Multiple strategies to find Electron
    const possiblePaths = [
      path.join(this.rootDir, 'node_modules', '.bin', 'electron.cmd'),
      path.join(this.rootDir, 'node_modules', '.bin', 'electron'),
      path.join(this.rootDir, 'node_modules', 'electron', 'dist', 'electron.exe'),
      path.join(this.rootDir, 'node_modules', 'electron', 'cli.js')
    ];

    for (const electronPath of possiblePaths) {
      if (fs.existsSync(electronPath)) {
        return electronPath;
      }
    }

    // Fallback to npx
    return 'npx';
  }

  async run() {
    header('Emergency PDF Editor Launcher v11.0');
    
    // Phase 1: Critical file check
    log('Phase 1: Checking critical files...', 'info');
    const criticalFiles = this.checkCriticalFiles();
    
    if (!criticalFiles.allPresent) {
      log('Critical files missing! Attempting recovery...', 'warning');
      await this.recoverMissingFiles(criticalFiles.missing);
    }
    
    // Phase 2: Fix package.json if needed
    log('Phase 2: Verifying package.json...', 'info');
    this.fixPackageJson();
    
    // Phase 3: Try different launch methods
    log('Phase 3: Attempting launch...', 'info');
    
    const launchMethods = [
      () => this.launchDirect(),
      () => this.launchWithNpx(),
      () => this.launchWithNode(),
      () => this.launchEmergencyMode()
    ];
    
    for (const [index, method] of launchMethods.entries()) {
      log(`Trying method ${index + 1}/4...`, 'debug');
      try {
        const success = await method();
        if (success) {
          log('Launch successful!', 'success');
          return true;
        }
      } catch (error) {
        log(`Method ${index + 1} failed: ${error.message}`, 'warning');
      }
    }
    
    log('All launch methods failed!', 'error');
    this.showManualInstructions();
    return false;
  }

  checkCriticalFiles() {
    const files = [
      { path: this.mainPath, name: 'main.js' },
      { path: this.preloadPath, name: 'preload.js' },
      { path: this.rendererPath, name: 'index.html' }
    ];
    
    const missing = [];
    let allPresent = true;
    
    for (const file of files) {
      if (fs.existsSync(file.path)) {
        const stats = fs.statSync(file.path);
        log(`✓ ${file.name} (${(stats.size / 1024).toFixed(1)} KB)`, 'success');
      } else {
        log(`✗ ${file.name} - MISSING`, 'error');
        missing.push(file);
        allPresent = false;
      }
    }
    
    return { allPresent, missing };
  }

  async recoverMissingFiles(missingFiles) {
    log('Attempting file recovery...', 'info');
    
    // Create directories if needed
    const dirs = [
      path.join(this.rootDir, 'dist'),
      path.join(this.rootDir, 'dist', 'main'),
      path.join(this.rootDir, 'dist', 'renderer')
    ];
    
    for (const dir of dirs) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        log(`Created directory: ${path.basename(dir)}`, 'success');
      }
    }
    
    // Try to copy from src
    for (const file of missingFiles) {
      if (file.name === 'main.js') {
        const srcPath = path.join(this.rootDir, 'src', 'main.js');
        if (fs.existsSync(srcPath)) {
          fs.copyFileSync(srcPath, file.path);
          log(`Recovered main.js from src`, 'success');
        }
      } else if (file.name === 'preload.js') {
        const srcPath = path.join(this.rootDir, 'src', 'preload.js');
        if (fs.existsSync(srcPath)) {
          fs.copyFileSync(srcPath, file.path);
          log(`Recovered preload.js from src`, 'success');
        }
      } else if (file.name === 'index.html') {
        // Create minimal HTML
        this.createMinimalHTML(file.path);
        log(`Created emergency index.html`, 'success');
      }
    }
  }

  createMinimalHTML(htmlPath) {
    const html = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>PDF Editor - Emergency Mode</title>
    <style>
        body {
            margin: 0;
            font-family: -apple-system, sans-serif;
            background: linear-gradient(135deg, #1e1e1e, #2d2d2d);
            color: #e0e0e0;
            height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .container {
            text-align: center;
            padding: 40px;
            background: rgba(0,0,0,0.5);
            border-radius: 20px;
            backdrop-filter: blur(10px);
        }
        h1 {
            color: #667eea;
            margin-bottom: 20px;
        }
        p {
            color: #aaa;
            margin: 10px 0;
        }
        button {
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            font-size: 16px;
            cursor: pointer;
            margin: 10px;
            transition: transform 0.2s;
        }
        button:hover {
            transform: scale(1.05);
        }
        .status {
            margin-top: 20px;
            padding: 10px;
            background: rgba(255,255,255,0.1);
            border-radius: 5px;
            font-family: monospace;
            font-size: 12px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>PDF Editor Professional</h1>
        <p>Running in Emergency Mode</p>
        <p>The application launched but some components may be missing.</p>
        
        <div style="margin: 30px 0;">
            <button onclick="testAPI()">Test Electron API</button>
            <button onclick="openFile()">Open PDF File</button>
            <button onclick="showInfo()">System Info</button>
        </div>
        
        <div id="status" class="status">
            Status: Checking system...
        </div>
    </div>
    
    <script>
        const status = document.getElementById('status');
        
        // Check Electron API
        setTimeout(() => {
            if (window.electronAPI) {
                status.textContent = 'Status: Electron API Connected ✓';
                status.style.color = '#4caf50';
            } else {
                status.textContent = 'Status: Running in browser mode (limited functionality)';
                status.style.color = '#ff9800';
            }
        }, 1000);
        
        function testAPI() {
            if (window.electronAPI) {
                alert('Electron API is working!');
            } else {
                alert('Electron API not available');
            }
        }
        
        async function openFile() {
            if (window.electronAPI && window.electronAPI.openFile) {
                try {
                    const result = await window.electronAPI.openFile();
                    if (result.success) {
                        status.textContent = 'File opened successfully';
                    }
                } catch (error) {
                    status.textContent = 'Error: ' + error.message;
                }
            } else {
                alert('File operations not available in emergency mode');
            }
        }
        
        function showInfo() {
            const info = [
                'Platform: ' + (navigator.platform || 'Unknown'),
                'User Agent: ' + navigator.userAgent.substring(0, 50) + '...',
                'Screen: ' + screen.width + 'x' + screen.height,
                'Memory: ' + (navigator.deviceMemory || 'Unknown') + ' GB'
            ].join('\\n');
            alert(info);
        }
    </script>
</body>
</html>`;
    
    fs.writeFileSync(htmlPath, html);
  }

  fixPackageJson() {
    try {
      const packagePath = path.join(this.rootDir, 'package.json');
      const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
      
      // Ensure main field points to the correct location
      const correctMain = 'dist/main/main.js';
      if (packageJson.main !== correctMain) {
        log(`Fixing package.json main field...`, 'warning');
        packageJson.main = correctMain;
        fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));
        log(`Updated package.json main field to: ${correctMain}`, 'success');
      } else {
        log(`Package.json main field is correct`, 'success');
      }
    } catch (error) {
      log(`Could not fix package.json: ${error.message}`, 'warning');
    }
  }

  async launchDirect() {
    return new Promise((resolve) => {
      log('Attempting direct launch with absolute path...', 'debug');
      
      const args = [this.mainPath];
      const cmd = this.electronPath === 'npx' ? 'npx' : this.electronPath;
      const cmdArgs = this.electronPath === 'npx' ? ['electron', ...args] : args;
      
      const electron = spawn(cmd, cmdArgs, {
        stdio: 'inherit',
        shell: true,
        cwd: this.rootDir,
        env: {
          ...process.env,
          ELECTRON_ENABLE_LOGGING: '1',
          NODE_ENV: 'production'
        }
      });
      
      electron.on('error', (error) => {
        log(`Direct launch failed: ${error.message}`, 'error');
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

  async launchWithNpx() {
    return new Promise((resolve) => {
      log('Attempting launch with npx electron...', 'debug');
      
      const electron = spawn('npx', ['electron', '.'], {
        stdio: 'inherit',
        shell: true,
        cwd: this.rootDir,
        env: {
          ...process.env,
          ELECTRON_ENABLE_LOGGING: '1'
        }
      });
      
      electron.on('error', (error) => {
        log(`NPX launch failed: ${error.message}`, 'error');
        resolve(false);
      });
      
      electron.on('exit', (code) => {
        resolve(code === 0 || code === null);
      });
    });
  }

  async launchWithNode() {
    return new Promise((resolve) => {
      log('Attempting launch with node electron...', 'debug');
      
      const electronCli = path.join(this.rootDir, 'node_modules', 'electron', 'cli.js');
      
      if (!fs.existsSync(electronCli)) {
        log('Electron CLI not found', 'warning');
        resolve(false);
        return;
      }
      
      const electron = spawn('node', [electronCli, this.mainPath], {
        stdio: 'inherit',
        cwd: this.rootDir,
        env: {
          ...process.env,
          ELECTRON_ENABLE_LOGGING: '1'
        }
      });
      
      electron.on('error', (error) => {
        log(`Node launch failed: ${error.message}`, 'error');
        resolve(false);
      });
      
      electron.on('exit', (code) => {
        resolve(code === 0 || code === null);
      });
    });
  }

  async launchEmergencyMode() {
    log('Activating emergency standalone mode...', 'warning');
    
    // Create a standalone launcher script
    const emergencyScript = `
const { app, BrowserWindow } = require('electron');
const path = require('path');

app.whenReady().then(() => {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'dist', 'main', 'preload.js')
    }
  });
  
  const indexPath = path.join(__dirname, 'dist', 'renderer', 'index.html');
  win.loadFile(indexPath).catch(() => {
    win.loadURL('data:text/html,<h1>Emergency Mode Active</h1><p>PDF Editor is running but UI failed to load.</p>');
  });
});

app.on('window-all-closed', () => {
  app.quit();
});
`;
    
    const emergencyPath = path.join(this.rootDir, 'emergency-start.js');
    fs.writeFileSync(emergencyPath, emergencyScript);
    
    return new Promise((resolve) => {
      const electron = spawn('npx', ['electron', emergencyPath], {
        stdio: 'inherit',
        shell: true,
        cwd: this.rootDir
      });
      
      electron.on('error', () => resolve(false));
      electron.on('exit', (code) => resolve(code === 0));
    });
  }

  showManualInstructions() {
    header('Manual Recovery Instructions');
    
    console.log(`
${colors.yellow}The automatic launch failed. Please try these manual steps:${colors.reset}

1. ${colors.cyan}Quick Fix:${colors.reset}
   Run: npx electron dist/main/main.js

2. ${colors.cyan}Rebuild Everything:${colors.reset}
   - Delete the 'dist' folder
   - Run: node build-master-v5.js
   - Run: npx electron dist/main/main.js

3. ${colors.cyan}Clean Install:${colors.reset}
   - Delete 'node_modules' folder
   - Delete 'package-lock.json'
   - Run: npm install
   - Run: npm start

4. ${colors.cyan}Direct Electron Path:${colors.reset}
   - Find electron.exe in node_modules/electron/dist/
   - Run: [path-to-electron.exe] dist/main/main.js

5. ${colors.cyan}Developer Mode:${colors.reset}
   - Run: npm run dev

${colors.yellow}If none of these work, the issue may be:${colors.reset}
- Antivirus blocking Electron
- Corrupted node_modules
- Windows path length limitations
- Missing Visual C++ redistributables

${colors.cyan}For detailed logs, set environment variable:${colors.reset}
SET ELECTRON_ENABLE_LOGGING=1
`);
  }
}

// Main execution
async function main() {
  const launcher = new EmergencyLauncher();
  const success = await launcher.run();
  
  if (!success) {
    process.exit(1);
  }
}

// Handle interrupts
process.on('SIGINT', () => {
  log('\nLauncher interrupted', 'warning');
  process.exit(0);
});

// Run
if (require.main === module) {
  main().catch(error => {
    log(`Fatal error: ${error.message}`, 'error');
    console.error(error.stack);
    process.exit(1);
  });
}

module.exports = { EmergencyLauncher };
