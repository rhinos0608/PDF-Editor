/**
 * Professional PDF Editor - Ultimate Build Fix
 * Applying Transisthesis Cognitive Engine Framework
 * Global Benchmark Standards Implementation
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const webpack = require('webpack');

// Console colors for better visibility
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

class UltimateBuildFix {
    constructor() {
        this.rootDir = __dirname;
        this.distDir = path.join(this.rootDir, 'dist');
        this.srcDir = path.join(this.rootDir, 'src');
        this.issues = [];
        this.fixes = [];
    }

    log(message, type = 'info') {
        const prefix = {
            'success': `${colors.green}✓${colors.reset}`,
            'error': `${colors.red}✗${colors.reset}`,
            'warning': `${colors.yellow}⚠${colors.reset}`,
            'info': `${colors.blue}ℹ${colors.reset}`,
            'phase': `${colors.cyan}▶${colors.reset}`
        }[type] || '';
        
        console.log(`${prefix} ${message}`);
    }

    banner() {
        console.log('\n' + '='.repeat(60));
        console.log('   PROFESSIONAL PDF EDITOR - ULTIMATE BUILD FIX');
        console.log('        Transisthesis Cognitive Engine v3.0');
        console.log('='.repeat(60) + '\n');
    }

    // PHASE 1: Deep Analysis (Collapse)
    async analyzeIssues() {
        this.log('PHASE 1: Deep System Analysis', 'phase');
        
        // Check if main.js and preload.js exist in src
        const mainExists = fs.existsSync(path.join(this.srcDir, 'main.js'));
        const preloadExists = fs.existsSync(path.join(this.srcDir, 'preload.js'));
        
        if (!mainExists) {
            this.issues.push('Source main.js missing');
            this.log('Source main.js missing!', 'error');
        } else {
            this.log('Source main.js found', 'success');
        }
        
        if (!preloadExists) {
            this.issues.push('Source preload.js missing');
            this.log('Source preload.js missing!', 'error');
        } else {
            this.log('Source preload.js found', 'success');
        }
        
        // Check webpack installation
        try {
            require.resolve('webpack');
            this.log('Webpack installed', 'success');
        } catch (e) {
            this.issues.push('Webpack not properly installed');
            this.log('Webpack not found', 'error');
        }
        
        // Check if dist exists
        if (!fs.existsSync(this.distDir)) {
            fs.mkdirSync(this.distDir, { recursive: true });
            this.log('Created dist directory', 'info');
        }
        
        return this.issues.length === 0;
    }

    // PHASE 2: Fix GPU Issues
    fixGPUConfig() {
        this.log('PHASE 2: Fixing GPU Configuration', 'phase');
        
        const mainPath = path.join(this.srcDir, 'main.js');
        let mainContent = fs.readFileSync(mainPath, 'utf8');
        
        // Add GPU fix if not present
        if (!mainContent.includes('app.disableHardwareAcceleration')) {
            const gpuFix = `
// Fix GPU errors
if (process.platform === 'win32') {
  app.commandLine.appendSwitch('disable-gpu');
  app.commandLine.appendSwitch('disable-software-rasterizer');
}
// Optionally disable hardware acceleration if issues persist
// app.disableHardwareAcceleration();
`;
            // Insert after app import
            mainContent = mainContent.replace(
                "const isDev = process.env.NODE_ENV === 'development';",
                `const isDev = process.env.NODE_ENV === 'development';
${gpuFix}`
            );
            
            fs.writeFileSync(mainPath, mainContent);
            this.log('Applied GPU fixes', 'success');
            this.fixes.push('GPU configuration fixed');
        } else {
            this.log('GPU fixes already present', 'info');
        }
    }

    // PHASE 3: Build Main Process with Direct Webpack
    async buildMainDirect() {
        this.log('PHASE 3: Direct Main Process Build', 'phase');
        
        // Create a simple webpack config inline
        const config = {
            mode: 'production',
            target: 'electron-main',
            entry: {
                main: path.join(this.srcDir, 'main.js'),
                preload: path.join(this.srcDir, 'preload.js')
            },
            output: {
                path: this.distDir,
                filename: '[name].js'
            },
            externals: {
                'electron': 'commonjs electron',
                'electron-updater': 'commonjs electron-updater',
                'fs': 'commonjs fs',
                'path': 'commonjs path'
            },
            node: {
                __dirname: false,
                __filename: false
            }
        };
        
        return new Promise((resolve, reject) => {
            webpack(config, (err, stats) => {
                if (err) {
                    this.log(`Webpack error: ${err.message}`, 'error');
                    resolve(false);
                    return;
                }
                
                if (stats.hasErrors()) {
                    const errors = stats.toJson().errors;
                    errors.forEach(error => {
                        this.log(`Build error: ${error.message}`, 'error');
                    });
                    resolve(false);
                    return;
                }
                
                // Check if files were created
                const mainCreated = fs.existsSync(path.join(this.distDir, 'main.js'));
                const preloadCreated = fs.existsSync(path.join(this.distDir, 'preload.js'));
                
                if (mainCreated) {
                    const size = (fs.statSync(path.join(this.distDir, 'main.js')).size / 1024).toFixed(2);
                    this.log(`main.js created (${size} KB)`, 'success');
                } else {
                    this.log('main.js not created!', 'error');
                }
                
                if (preloadCreated) {
                    const size = (fs.statSync(path.join(this.distDir, 'preload.js')).size / 1024).toFixed(2);
                    this.log(`preload.js created (${size} KB)`, 'success');
                } else {
                    this.log('preload.js not created!', 'error');
                }
                
                resolve(mainCreated && preloadCreated);
            });
        });
    }

    // PHASE 4: Alternative - Manual Copy if Webpack Fails
    async manualCopyFallback() {
        this.log('PHASE 4: Manual Copy Fallback', 'phase');
        
        try {
            // Copy main.js
            const mainSrc = path.join(this.srcDir, 'main.js');
            const mainDest = path.join(this.distDir, 'main.js');
            
            if (fs.existsSync(mainSrc)) {
                fs.copyFileSync(mainSrc, mainDest);
                this.log('Manually copied main.js', 'success');
            }
            
            // Copy preload.js
            const preloadSrc = path.join(this.srcDir, 'preload.js');
            const preloadDest = path.join(this.distDir, 'preload.js');
            
            if (fs.existsSync(preloadSrc)) {
                fs.copyFileSync(preloadSrc, preloadDest);
                this.log('Manually copied preload.js', 'success');
            }
            
            return true;
        } catch (error) {
            this.log(`Manual copy failed: ${error.message}`, 'error');
            return false;
        }
    }

    // PHASE 5: Build Renderer
    async buildRenderer() {
        this.log('PHASE 5: Renderer Build', 'phase');
        
        try {
            execSync('npx webpack --config webpack.renderer.config.prod.js', {
                cwd: this.rootDir,
                stdio: 'pipe'
            });
            
            // Verify renderer files
            const rendererFiles = ['index.html', 'app.bundle.js', 'vendor.bundle.js'];
            let allPresent = true;
            
            for (const file of rendererFiles) {
                if (fs.existsSync(path.join(this.distDir, file))) {
                    const size = (fs.statSync(path.join(this.distDir, file)).size / 1024).toFixed(2);
                    this.log(`${file} (${size} KB)`, 'success');
                } else {
                    this.log(`${file} missing`, 'warning');
                    allPresent = false;
                }
            }
            
            return allPresent;
        } catch (error) {
            this.log('Renderer build failed', 'error');
            return false;
        }
    }

    // PHASE 6: Final Verification
    verify() {
        this.log('PHASE 6: Final Verification', 'phase');
        
        const required = {
            'main.js': path.join(this.distDir, 'main.js'),
            'preload.js': path.join(this.distDir, 'preload.js'),
            'index.html': path.join(this.distDir, 'index.html')
        };
        
        let success = true;
        for (const [name, filepath] of Object.entries(required)) {
            if (fs.existsSync(filepath)) {
                const size = (fs.statSync(filepath).size / 1024).toFixed(2);
                this.log(`${name}: ${size} KB`, 'success');
            } else {
                this.log(`${name}: MISSING`, 'error');
                success = false;
            }
        }
        
        return success;
    }

    // Main execution
    async execute() {
        this.banner();
        
        // Analysis
        await this.analyzeIssues();
        
        // Fix GPU issues
        this.fixGPUConfig();
        
        // Try direct webpack build
        let mainBuilt = await this.buildMainDirect();
        
        // If webpack fails, use manual copy
        if (!mainBuilt) {
            this.log('Webpack failed, trying manual copy...', 'warning');
            mainBuilt = await this.manualCopyFallback();
        }
        
        // Build renderer
        const rendererBuilt = await this.buildRenderer();
        
        // Final verification
        const verified = this.verify();
        
        // Report
        console.log('\n' + '='.repeat(60));
        if (verified) {
            this.log('BUILD SUCCESSFUL!', 'success');
            console.log('\nThe PDF Editor is ready to run:');
            console.log('  npm start');
            console.log('  or');
            console.log('  start-app.bat');
        } else {
            this.log('BUILD INCOMPLETE', 'error');
            console.log('\nSome files are missing. Check the output above.');
        }
        console.log('='.repeat(60) + '\n');
        
        return verified;
    }
}

// Run the fix
(async () => {
    const fixer = new UltimateBuildFix();
    const success = await fixer.execute();
    process.exit(success ? 0 : 1);
})();
