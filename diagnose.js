#!/usr/bin/env node
/**
 * Diagnostic Tool v11.0
 * Comprehensive system check for PDF Editor
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function header(title) {
  console.log('\n' + '='.repeat(60));
  log(`  ${title}`, colors.cyan);
  console.log('='.repeat(60));
}

class Diagnostics {
  constructor() {
    this.rootDir = __dirname;
    this.issues = [];
    this.warnings = [];
  }

  run() {
    header('PDF Editor Diagnostics v11.0');
    
    this.checkNodeVersion();
    this.checkElectron();
    this.checkFileStructure();
    this.checkPackageJson();
    this.checkPermissions();
    this.generateReport();
  }

  checkNodeVersion() {
    header('Node.js Check');
    
    try {
      const nodeVersion = process.version;
      const major = parseInt(nodeVersion.split('.')[0].substring(1));
      
      if (major >= 14) {
        log(`✓ Node.js ${nodeVersion} - Compatible`, colors.green);
      } else {
        log(`✗ Node.js ${nodeVersion} - Too old (need v14+)`, colors.red);
        this.issues.push('Node.js version too old');
      }
      
      // Check npm
      try {
        const npmVersion = execSync('npm -v', { encoding: 'utf8' }).trim();
        log(`✓ NPM v${npmVersion} - Installed`, colors.green);
      } catch {
        log(`⚠ NPM not found in PATH`, colors.yellow);
        this.warnings.push('NPM not in PATH');
      }
    } catch (error) {
      log(`✗ Error checking Node.js: ${error.message}`, colors.red);
      this.issues.push('Cannot check Node.js version');
    }
  }

  checkElectron() {
    header('Electron Check');
    
    const electronPaths = [
      'node_modules/electron/package.json',
      'node_modules/.bin/electron',
      'node_modules/.bin/electron.cmd',
      'node_modules/electron/dist/electron.exe'
    ];
    
    let electronFound = false;
    let electronVersion = 'Unknown';
    
    for (const electronPath of electronPaths) {
      const fullPath = path.join(this.rootDir, electronPath);
      if (fs.existsSync(fullPath)) {
        electronFound = true;
        
        // Try to get version
        if (electronPath.includes('package.json')) {
          try {
            const pkg = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
            electronVersion = pkg.version;
          } catch {}
        }
        
        log(`✓ Found: ${electronPath}`, colors.green);
        break;
      }
    }
    
    if (electronFound) {
      log(`✓ Electron ${electronVersion} - Installed`, colors.green);
      
      // Test electron command
      try {
        execSync('npx electron --version', { 
          cwd: this.rootDir,
          stdio: 'pipe'
        });
        log(`✓ Electron command works`, colors.green);
      } catch {
        log(`⚠ Electron command not working`, colors.yellow);
        this.warnings.push('Electron command issues');
      }
    } else {
      log(`✗ Electron not found!`, colors.red);
      this.issues.push('Electron not installed');
    }
  }

  checkFileStructure() {
    header('File Structure Check');
    
    const requiredFiles = [
      { path: 'package.json', type: 'Config' },
      { path: 'src/main.js', type: 'Source' },
      { path: 'src/preload.js', type: 'Source' },
      { path: 'dist/main/main.js', type: 'Built' },
      { path: 'dist/main/preload.js', type: 'Built' },
      { path: 'dist/renderer/index.html', type: 'Built' },
      { path: 'webpack.main.config.js', type: 'Config' },
      { path: 'webpack.renderer.config.js', type: 'Config' }
    ];
    
    for (const file of requiredFiles) {
      const fullPath = path.join(this.rootDir, file.path);
      
      if (fs.existsSync(fullPath)) {
        const stats = fs.statSync(fullPath);
        const size = (stats.size / 1024).toFixed(1);
        log(`✓ ${file.type.padEnd(8)} - ${file.path} (${size} KB)`, colors.green);
      } else {
        if (file.type === 'Built') {
          log(`✗ ${file.type.padEnd(8)} - ${file.path} - MISSING`, colors.red);
          this.issues.push(`Missing built file: ${file.path}`);
        } else {
          log(`⚠ ${file.type.padEnd(8)} - ${file.path} - Missing`, colors.yellow);
          this.warnings.push(`Missing ${file.type.toLowerCase()} file: ${file.path}`);
        }
      }
    }
  }

  checkPackageJson() {
    header('Package.json Check');
    
    try {
      const packagePath = path.join(this.rootDir, 'package.json');
      const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
      
      // Check main field
      const expectedMain = 'dist/main/main.js';
      if (pkg.main === expectedMain) {
        log(`✓ Main field correct: ${pkg.main}`, colors.green);
      } else {
        log(`✗ Main field incorrect: ${pkg.main} (should be ${expectedMain})`, colors.red);
        this.issues.push('Package.json main field incorrect');
      }
      
      // Check scripts
      const requiredScripts = ['start', 'build'];
      for (const script of requiredScripts) {
        if (pkg.scripts && pkg.scripts[script]) {
          log(`✓ Script '${script}' defined`, colors.green);
        } else {
          log(`⚠ Script '${script}' missing`, colors.yellow);
          this.warnings.push(`Missing script: ${script}`);
        }
      }
      
      // Check dependencies
      if (pkg.devDependencies && pkg.devDependencies.electron) {
        log(`✓ Electron in devDependencies: ${pkg.devDependencies.electron}`, colors.green);
      } else {
        log(`✗ Electron not in devDependencies`, colors.red);
        this.issues.push('Electron not in package.json');
      }
      
    } catch (error) {
      log(`✗ Cannot read package.json: ${error.message}`, colors.red);
      this.issues.push('Cannot read package.json');
    }
  }

  checkPermissions() {
    header('Permissions Check');
    
    try {
      // Try to write a test file
      const testFile = path.join(this.rootDir, 'test-write.tmp');
      fs.writeFileSync(testFile, 'test');
      fs.unlinkSync(testFile);
      log(`✓ Write permissions OK`, colors.green);
    } catch {
      log(`✗ No write permissions in project directory`, colors.red);
      this.issues.push('No write permissions');
    }
    
    // Check if running as admin (Windows)
    if (process.platform === 'win32') {
      try {
        execSync('net session', { stdio: 'pipe' });
        log(`✓ Running with administrator privileges`, colors.green);
      } catch {
        log(`⚠ Not running as administrator`, colors.yellow);
        this.warnings.push('Not running as administrator');
      }
    }
  }

  generateReport() {
    header('Diagnostic Report');
    
    if (this.issues.length === 0 && this.warnings.length === 0) {
      log('\n✅ All checks passed! The application should work.', colors.green);
      log('\nRun one of these commands to start:', colors.cyan);
      log('  1. EMERGENCY-START.bat', colors.yellow);
      log('  2. npx electron dist/main/main.js', colors.yellow);
      log('  3. node emergency-launcher.js', colors.yellow);
    } else {
      if (this.issues.length > 0) {
        log(`\n❌ Critical Issues (${this.issues.length}):`, colors.red);
        this.issues.forEach((issue, i) => {
          log(`  ${i + 1}. ${issue}`, colors.red);
        });
      }
      
      if (this.warnings.length > 0) {
        log(`\n⚠ Warnings (${this.warnings.length}):`, colors.yellow);
        this.warnings.forEach((warning, i) => {
          log(`  ${i + 1}. ${warning}`, colors.yellow);
        });
      }
      
      log('\n📋 Recommended Actions:', colors.cyan);
      
      if (this.issues.some(i => i.includes('Missing built file'))) {
        log('  1. Run: node build-master-v5.js', colors.yellow);
      }
      
      if (this.issues.some(i => i.includes('Electron not installed'))) {
        log('  2. Run: npm install electron', colors.yellow);
      }
      
      if (this.issues.some(i => i.includes('main field incorrect'))) {
        log('  3. Fix package.json main field to: dist/main/main.js', colors.yellow);
      }
      
      log('\n  Then run: EMERGENCY-START.bat', colors.green);
    }
    
    // Generate diagnostics file
    const report = {
      timestamp: new Date().toISOString(),
      issues: this.issues,
      warnings: this.warnings,
      system: {
        platform: process.platform,
        arch: process.arch,
        node: process.version,
        cwd: process.cwd()
      }
    };
    
    const reportPath = path.join(this.rootDir, 'diagnostics-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    log(`\n📄 Full report saved to: diagnostics-report.json`, colors.blue);
  }
}

// Run diagnostics
const diagnostics = new Diagnostics();
diagnostics.run();
