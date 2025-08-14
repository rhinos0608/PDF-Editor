const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ========================================
// Professional PDF Editor - Smart Build System
// Applying Transisthesis Framework Principles
// ========================================

class BuildOrchestrator {
    constructor() {
        this.rootDir = __dirname;
        this.distDir = path.join(this.rootDir, 'dist');
        this.errors = [];
        this.warnings = [];
        this.buildMetrics = {
            startTime: Date.now(),
            phases: {}
        };
    }

    // Collapse Phase - Analyze current state
    async analyzeProject() {
        console.log('\n📊 ANALYSIS PHASE');
        console.log('================');
        
        const checks = {
            'package.json exists': fs.existsSync(path.join(this.rootDir, 'package.json')),
            'node_modules exists': fs.existsSync(path.join(this.rootDir, 'node_modules')),
            'src/main.js exists': fs.existsSync(path.join(this.rootDir, 'src', 'main.js')),
            'src/preload.js exists': fs.existsSync(path.join(this.rootDir, 'src', 'preload.js')),
            'webpack configs exist': fs.existsSync(path.join(this.rootDir, 'webpack.main.config.js'))
        };

        for (const [check, result] of Object.entries(checks)) {
            console.log(`  ${result ? '✅' : '❌'} ${check}`);
            if (!result) {
                this.errors.push(`Missing: ${check}`);
            }
        }

        return Object.values(checks).every(v => v);
    }

    // Clean Phase
    cleanBuild() {
        console.log('\n🧹 CLEAN PHASE');
        console.log('==============');
        
        if (fs.existsSync(this.distDir)) {
            console.log('  Removing existing dist directory...');
            this.removeDir(this.distDir);
        }
        
        console.log('  Creating fresh dist directory...');
        fs.mkdirSync(this.distDir, { recursive: true });
        console.log('  ✅ Clean complete');
    }

    // Build Main Process
    buildMain() {
        console.log('\n🔨 BUILD MAIN PROCESS');
        console.log('====================');
        
        const startTime = Date.now();
        
        try {
            // Run webpack directly with explicit configuration
            const command = 'npx webpack --config webpack.main.config.js --mode production';
            console.log(`  Running: ${command}`);
            
            const output = execSync(command, {
                cwd: this.rootDir,
                env: { ...process.env, NODE_ENV: 'production' },
                encoding: 'utf8'
            });
            
            console.log('  Webpack output:', output.substring(0, 200) + '...');
            
            // Verify the output files exist
            const mainPath = path.join(this.distDir, 'main.js');
            const preloadPath = path.join(this.distDir, 'preload.js');
            
            if (fs.existsSync(mainPath)) {
                const size = (fs.statSync(mainPath).size / 1024).toFixed(2);
                console.log(`  ✅ main.js created (${size} KB)`);
            } else {
                throw new Error('main.js was not created');
            }
            
            if (fs.existsSync(preloadPath)) {
                const size = (fs.statSync(preloadPath).size / 1024).toFixed(2);
                console.log(`  ✅ preload.js created (${size} KB)`);
            } else {
                throw new Error('preload.js was not created');
            }
            
            this.buildMetrics.phases.main = Date.now() - startTime;
            return true;
            
        } catch (error) {
            console.error('  ❌ Main process build failed:', error.message);
            this.errors.push(`Main build: ${error.message}`);
            
            // Try alternative build approach
            console.log('\n  Attempting alternative build method...');
            return this.buildMainAlternative();
        }
    }

    // Alternative build method if webpack fails
    buildMainAlternative() {
        try {
            // Use webpack programmatically
            const webpack = require('webpack');
            const config = require('./webpack.main.config.js');
            
            // Call config function with proper arguments
            const webpackConfig = typeof config === 'function' 
                ? config({}, { mode: 'production' })
                : config;
            
            console.log('  Using programmatic webpack build...');
            
            return new Promise((resolve, reject) => {
                webpack(webpackConfig, (err, stats) => {
                    if (err || stats.hasErrors()) {
                        console.error('  ❌ Webpack build failed');
                        if (err) console.error(err);
                        if (stats) console.error(stats.toString());
                        resolve(false);
                    } else {
                        console.log('  ✅ Alternative build succeeded');
                        console.log(stats.toString({ colors: true }));
                        resolve(true);
                    }
                });
            });
        } catch (error) {
            console.error('  ❌ Alternative build also failed:', error.message);
            return false;
        }
    }

    // Build Renderer Process
    buildRenderer() {
        console.log('\n🎨 BUILD RENDERER PROCESS');
        console.log('========================');
        
        const startTime = Date.now();
        
        try {
            const command = 'npx webpack --config webpack.renderer.config.prod.js';
            console.log(`  Running: ${command}`);
            
            execSync(command, {
                cwd: this.rootDir,
                env: { ...process.env, NODE_ENV: 'production' },
                stdio: 'inherit'
            });
            
            // Verify renderer output
            const requiredFiles = [
                'app.bundle.js',
                'vendor.bundle.js',
                'index.html',
                'pdf.worker.min.js'
            ];
            
            for (const file of requiredFiles) {
                const filePath = path.join(this.distDir, file);
                if (fs.existsSync(filePath)) {
                    const size = (fs.statSync(filePath).size / 1024).toFixed(2);
                    console.log(`  ✅ ${file} (${size} KB)`);
                } else {
                    console.log(`  ⚠️ ${file} not found`);
                    this.warnings.push(`Missing renderer file: ${file}`);
                }
            }
            
            this.buildMetrics.phases.renderer = Date.now() - startTime;
            return true;
            
        } catch (error) {
            console.error('  ❌ Renderer build failed:', error.message);
            this.errors.push(`Renderer build: ${error.message}`);
            return false;
        }
    }

    // Verify Final Build
    verifyBuild() {
        console.log('\n🔍 VERIFICATION PHASE');
        console.log('====================');
        
        const criticalFiles = {
            'main.js': path.join(this.distDir, 'main.js'),
            'preload.js': path.join(this.distDir, 'preload.js'),
            'index.html': path.join(this.distDir, 'index.html')
        };
        
        const optionalFiles = {
            'app.bundle.js': path.join(this.distDir, 'app.bundle.js'),
            'vendor.bundle.js': path.join(this.distDir, 'vendor.bundle.js'),
            'pdf.worker.min.js': path.join(this.distDir, 'pdf.worker.min.js')
        };
        
        let allCriticalPresent = true;
        
        console.log('  Critical files:');
        for (const [name, path] of Object.entries(criticalFiles)) {
            if (fs.existsSync(path)) {
                const size = (fs.statSync(path).size / 1024).toFixed(2);
                console.log(`    ✅ ${name} (${size} KB)`);
            } else {
                console.log(`    ❌ ${name} - MISSING`);
                allCriticalPresent = false;
            }
        }
        
        console.log('\n  Additional files:');
        for (const [name, path] of Object.entries(optionalFiles)) {
            if (fs.existsSync(path)) {
                const size = (fs.statSync(path).size / 1024).toFixed(2);
                console.log(`    ✅ ${name} (${size} KB)`);
            } else {
                console.log(`    ⚠️ ${name} - Not found`);
            }
        }
        
        return allCriticalPresent;
    }

    // Generate Report
    generateReport() {
        const totalTime = Date.now() - this.buildMetrics.startTime;
        
        console.log('\n📈 BUILD REPORT');
        console.log('===============');
        console.log(`  Total build time: ${(totalTime / 1000).toFixed(2)}s`);
        
        if (this.buildMetrics.phases.main) {
            console.log(`  Main process: ${(this.buildMetrics.phases.main / 1000).toFixed(2)}s`);
        }
        if (this.buildMetrics.phases.renderer) {
            console.log(`  Renderer process: ${(this.buildMetrics.phases.renderer / 1000).toFixed(2)}s`);
        }
        
        if (this.warnings.length > 0) {
            console.log('\n  ⚠️ Warnings:');
            this.warnings.forEach(w => console.log(`    - ${w}`));
        }
        
        if (this.errors.length > 0) {
            console.log('\n  ❌ Errors:');
            this.errors.forEach(e => console.log(`    - ${e}`));
        }
    }

    // Helper to remove directory
    removeDir(dirPath) {
        if (fs.existsSync(dirPath)) {
            fs.readdirSync(dirPath).forEach(file => {
                const curPath = path.join(dirPath, file);
                if (fs.lstatSync(curPath).isDirectory()) {
                    this.removeDir(curPath);
                } else {
                    fs.unlinkSync(curPath);
                }
            });
            fs.rmdirSync(dirPath);
        }
    }

    // Main orchestration
    async build() {
        console.log('╔════════════════════════════════════════╗');
        console.log('║   PROFESSIONAL PDF EDITOR BUILD SYSTEM  ║');
        console.log('║         Transisthesis Framework         ║');
        console.log('╚════════════════════════════════════════╝');
        
        // Phase 1: Analysis
        if (!await this.analyzeProject()) {
            console.error('\n❌ Project analysis failed. Fix errors above.');
            return false;
        }
        
        // Phase 2: Clean
        this.cleanBuild();
        
        // Phase 3: Build Main
        const mainSuccess = await this.buildMain();
        if (!mainSuccess) {
            console.error('\n❌ Main process build failed.');
            this.generateReport();
            return false;
        }
        
        // Phase 4: Build Renderer
        const rendererSuccess = await this.buildRenderer();
        if (!rendererSuccess) {
            console.error('\n❌ Renderer process build failed.');
            this.generateReport();
            return false;
        }
        
        // Phase 5: Verify
        const verified = this.verifyBuild();
        
        // Phase 6: Report
        this.generateReport();
        
        if (verified && this.errors.length === 0) {
            console.log('\n✨ BUILD SUCCESSFUL! ✨');
            console.log('Run "npm start" to launch the application.');
            return true;
        } else {
            console.log('\n⚠️ Build completed with issues.');
            console.log('The application may not function correctly.');
            return false;
        }
    }
}

// Execute build
(async () => {
    const builder = new BuildOrchestrator();
    const success = await builder.build();
    process.exit(success ? 0 : 1);
})();
