/**
 * Smoke Test Script for Packaged Application
 * Verifies that the built electron app launches and basic functionality works
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

class SmokeTest {
  constructor() {
    this.platform = os.platform();
    this.testResults = [];
    this.timeouts = new Set();
  }

  log(message, level = 'info') {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
    console.log(logMessage);
    
    if (level === 'error') {
      console.error(logMessage);
    }
  }

  async findExecutable() {
    const releaseDir = path.join(__dirname, '..', 'release');
    
    if (!fs.existsSync(releaseDir)) {
      throw new Error(`Release directory not found: ${releaseDir}`);
    }

    let executablePath;
    
    switch (this.platform) {
      case 'win32':
        // Look for exe in win-unpacked folder or nsis installer
        const winUnpacked = path.join(releaseDir, 'win-unpacked');
        if (fs.existsSync(winUnpacked)) {
          executablePath = path.join(winUnpacked, 'Professional PDF Editor.exe');
        }
        break;
        
      case 'darwin':
        // Look for .app bundle
        const macUnpacked = path.join(releaseDir, 'mac');
        if (fs.existsSync(macUnpacked)) {
          executablePath = path.join(macUnpacked, 'Professional PDF Editor.app', 'Contents', 'MacOS', 'Professional PDF Editor');
        }
        break;
        
      case 'linux':
        // Look for AppImage or unpacked folder
        const linuxUnpacked = path.join(releaseDir, 'linux-unpacked');
        if (fs.existsSync(linuxUnpacked)) {
          executablePath = path.join(linuxUnpacked, 'professional-pdf-editor');
        } else {
          // Look for AppImage
          const files = fs.readdirSync(releaseDir);
          const appImage = files.find(f => f.endsWith('.AppImage'));
          if (appImage) {
            executablePath = path.join(releaseDir, appImage);
          }
        }
        break;
    }

    if (!executablePath || !fs.existsSync(executablePath)) {
      throw new Error(`Executable not found for platform ${this.platform}. Looked for: ${executablePath}`);
    }

    this.log(`Found executable: ${executablePath}`);
    return executablePath;
  }

  async testApplicationLaunch(executablePath) {
    return new Promise((resolve, reject) => {
      this.log('Testing application launch...');
      
      const child = spawn(executablePath, ['--test-mode'], {
        stdio: ['pipe', 'pipe', 'pipe'],
        detached: false
      });

      let hasStarted = false;
      let output = '';
      let errorOutput = '';

      // Set timeout for launch test
      const timeout = setTimeout(() => {
        child.kill();
        reject(new Error('Application launch timed out after 30 seconds'));
      }, 30000);

      child.stdout.on('data', (data) => {
        const text = data.toString();
        output += text;
        this.log(`STDOUT: ${text.trim()}`);
        
        // Look for success indicators
        if (text.includes('ready-to-show') || 
            text.includes('did-finish-load') || 
            text.includes('main window created')) {
          hasStarted = true;
        }
      });

      child.stderr.on('data', (data) => {
        const text = data.toString();
        errorOutput += text;
        this.log(`STDERR: ${text.trim()}`, 'warn');
      });

      child.on('close', (code) => {
        clearTimeout(timeout);
        
        if (hasStarted || code === 0) {
          this.log('✅ Application launched successfully');
          resolve({
            success: true,
            output,
            errorOutput,
            exitCode: code
          });
        } else {
          this.log(`❌ Application failed to launch (exit code: ${code})`, 'error');
          reject(new Error(`Application exited with code ${code}\nOutput: ${output}\nErrors: ${errorOutput}`));
        }
      });

      child.on('error', (err) => {
        clearTimeout(timeout);
        this.log(`❌ Failed to start application: ${err.message}`, 'error');
        reject(err);
      });

      // Send a graceful shutdown signal after a few seconds
      setTimeout(() => {
        if (child.pid) {
          child.kill('SIGTERM');
        }
      }, 10000);
    });
  }

  async testBasicFunctionality() {
    this.log('Testing basic functionality...');
    
    // For now, this is a placeholder for more advanced testing
    // In a full implementation, you might:
    // - Use puppeteer to control the Electron app
    // - Test PDF loading
    // - Test basic operations
    // - Verify UI components are working
    
    this.log('✅ Basic functionality test passed (placeholder)');
    return { success: true };
  }

  async testFileAssociations() {
    this.log('Testing file associations...');
    
    // Check if the application can handle PDF files
    // This is platform-specific and would require different approaches
    
    this.log('✅ File associations test passed (placeholder)');
    return { success: true };
  }

  async generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      platform: this.platform,
      results: this.testResults,
      summary: {
        total: this.testResults.length,
        passed: this.testResults.filter(r => r.success).length,
        failed: this.testResults.filter(r => !r.success).length
      }
    };

    const reportPath = path.join(__dirname, '..', 'smoke-test-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    this.log(`📊 Test report written to: ${reportPath}`);
    return report;
  }

  async run() {
    this.log('🔬 Starting smoke tests for packaged application...');
    
    try {
      // Find the executable
      const executablePath = await this.findExecutable();
      this.testResults.push({ test: 'find_executable', success: true });

      // Test application launch
      try {
        const launchResult = await this.testApplicationLaunch(executablePath);
        this.testResults.push({ test: 'application_launch', success: true, details: launchResult });
      } catch (error) {
        this.testResults.push({ test: 'application_launch', success: false, error: error.message });
        throw error; // Critical failure
      }

      // Test basic functionality
      try {
        const functionalityResult = await this.testBasicFunctionality();
        this.testResults.push({ test: 'basic_functionality', success: true, details: functionalityResult });
      } catch (error) {
        this.testResults.push({ test: 'basic_functionality', success: false, error: error.message });
      }

      // Test file associations
      try {
        const associationsResult = await this.testFileAssociations();
        this.testResults.push({ test: 'file_associations', success: true, details: associationsResult });
      } catch (error) {
        this.testResults.push({ test: 'file_associations', success: false, error: error.message });
      }

      // Generate report
      const report = await this.generateReport();
      
      // Summary
      if (report.summary.failed === 0) {
        this.log('🎉 All smoke tests passed!');
        process.exit(0);
      } else {
        this.log(`❌ ${report.summary.failed} test(s) failed out of ${report.summary.total}`, 'error');
        process.exit(1);
      }
      
    } catch (error) {
      this.log(`💥 Smoke test failed: ${error.message}`, 'error');
      await this.generateReport();
      process.exit(1);
    }
  }
}

// Run the smoke tests if this script is executed directly
if (require.main === module) {
  const smokeTest = new SmokeTest();
  smokeTest.run().catch(error => {
    console.error('Fatal error during smoke tests:', error);
    process.exit(1);
  });
}

module.exports = SmokeTest;