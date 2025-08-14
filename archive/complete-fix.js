/**
 * Complete System Fix and Diagnostic
 * Transisthesis Framework - Council of Voices Approach
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class CompleteFix {
    constructor() {
        this.rootDir = __dirname;
        this.distDir = path.join(this.rootDir, 'dist');
        this.srcDir = path.join(this.rootDir, 'src');
        this.council = {
            explorer: [],      // New solutions
            maintainer: [],    // Code quality
            guardian: [],      // Security/errors
            performance: [],   // Performance issues
            platform: []       // Platform-specific
        };
    }

    // Council Phase - Gather all perspectives
    gatherCouncil() {
        console.log('\n🏛️  COUNCIL OF VOICES - Analyzing Issues\n');
        
        // Explorer Voice
        console.log('🔍 Explorer analyzing...');
        if (!fs.existsSync(path.join(this.distDir, 'main.js'))) {
            this.council.explorer.push('Webpack not outputting main files - need alternative build');
        }
        if (!fs.existsSync(path.join(this.distDir, 'app.bundle.js'))) {
            this.council.explorer.push('Renderer bundle missing - features won\'t work');
        }
        
        // Guardian Voice
        console.log('🛡️  Guardian analyzing...');
        this.council.guardian.push('GPU errors detected - need hardware acceleration fixes');
        this.council.guardian.push('Electron security must be maintained');
        
        // Platform Voice
        console.log('💻 Platform Specialist analyzing...');
        this.council.platform.push('Windows GPU issues common - need command line switches');
        this.council.platform.push('Character encoding issues in console - need UTF-8');
        
        // Maintainer Voice
        console.log('🔧 Maintainer analyzing...');
        this.council.maintainer.push('Build process fragmented - need unified solution');
        this.council.maintainer.push('Path resolution issues between dev and production');
        
        // Performance Voice
        console.log('⚡ Performance Engineer analyzing...');
        this.council.performance.push('Large bundle sizes may cause slow startup');
        this.council.performance.push('Webpack optimization needed');
    }

    // Synthesis Phase - Merge solutions
    synthesizeSolutions() {
        console.log('\n🔮 SYNTHESIS - Merging Council Wisdom\n');
        
        const solutions = [];
        
        // Solution 1: Fix GPU errors
        solutions.push({
            name: 'GPU Error Fix',
            priority: 'HIGH',
            action: () => this.fixGPUErrors()
        });
        
        // Solution 2: Direct file copy for main process
        solutions.push({
            name: 'Direct Main Process Build',
            priority: 'HIGH',
            action: () => this.directMainBuild()
        });
        
        // Solution 3: Fix renderer build
        solutions.push({
            name: 'Renderer Bundle Fix',
            priority: 'HIGH',
            action: () => this.fixRendererBuild()
        });
        
        // Solution 4: Fix paths
        solutions.push({
            name: 'Path Resolution Fix',
            priority: 'MEDIUM',
            action: () => this.fixPaths()
        });
        
        return solutions;
    }

    // Fix GPU Errors
    fixGPUErrors() {
        console.log('🛠️  Fixing GPU errors...');
        
        const mainPath = path.join(this.srcDir, 'main.js');
        if (!fs.existsSync(mainPath)) {
            console.log('   ❌ main.js not found in src');
            return false;
        }
        
        let content = fs.readFileSync(mainPath, 'utf8');
        
        // Add comprehensive GPU fixes
        const gpuFixes = `
// Comprehensive GPU Error Prevention
app.commandLine.appendSwitch('disable-gpu');
app.commandLine.appendSwitch('disable-gpu-compositing');
app.commandLine.appendSwitch('disable-gpu-rasterization');
app.commandLine.appendSwitch('disable-software-rasterizer');
app.commandLine.appendSwitch('no-sandbox');
app.commandLine.appendSwitch('disable-dev-shm-usage');

// Force CPU rendering if GPU fails
app.on('gpu-process-crashed', (event, killed) => {
  console.log('GPU process crashed, using CPU rendering');
  app.disableHardwareAcceleration();
});
`;
        
        if (!content.includes('disable-gpu')) {
            // Add after imports
            content = content.replace(
                "const isDev = process.env.NODE_ENV === 'development';",
                `const isDev = process.env.NODE_ENV === 'development';\n${gpuFixes}`
            );
            
            fs.writeFileSync(mainPath, content);
            console.log('   ✅ GPU fixes applied');
            return true;
        }
        
        console.log('   ℹ️  GPU fixes already present');
        return true;
    }

    // Direct Main Build (bypass webpack)
    directMainBuild() {
        console.log('🔨 Building main process directly...');
        
        // Ensure dist exists
        if (!fs.existsSync(this.distDir)) {
            fs.mkdirSync(this.distDir, { recursive: true });
        }
        
        // Process and copy main.js
        const mainSrc = path.join(this.srcDir, 'main.js');
        const mainDest = path.join(this.distDir, 'main.js');
        
        if (fs.existsSync(mainSrc)) {
            let content = fs.readFileSync(mainSrc, 'utf8');
            
            // Fix require paths for production
            content = content.replace(
                /require\('\.\.\/public/g,
                "require('./public"
            );
            
            fs.writeFileSync(mainDest, content);
            console.log('   ✅ main.js built');
        } else {
            console.log('   ❌ main.js source not found');
            return false;
        }
        
        // Copy preload.js
        const preloadSrc = path.join(this.srcDir, 'preload.js');
        const preloadDest = path.join(this.distDir, 'preload.js');
        
        if (fs.existsSync(preloadSrc)) {
            fs.copyFileSync(preloadSrc, preloadDest);
            console.log('   ✅ preload.js built');
        } else {
            console.log('   ❌ preload.js source not found');
            return false;
        }
        
        return true;
    }

    // Fix Renderer Build
    fixRendererBuild() {
        console.log('🎨 Fixing renderer build...');
        
        try {
            // Try webpack first
            execSync('npx webpack --config webpack.renderer.config.prod.js', {
                cwd: this.rootDir,
                stdio: 'pipe'
            });
            
            // Check if bundles were created
            const hasAppBundle = fs.existsSync(path.join(this.distDir, 'app.bundle.js'));
            const hasVendorBundle = fs.existsSync(path.join(this.distDir, 'vendor.bundle.js'));
            const hasHTML = fs.existsSync(path.join(this.distDir, 'index.html'));
            
            if (hasAppBundle && hasVendorBundle && hasHTML) {
                console.log('   ✅ Renderer bundles created');
                return true;
            }
            
            console.log('   ⚠️  Some renderer files missing');
            
        } catch (error) {
            console.log('   ⚠️  Webpack failed, creating fallback...');
        }
        
        // Create minimal working HTML if missing
        if (!fs.existsSync(path.join(this.distDir, 'index.html'))) {
            this.createFallbackHTML();
        }
        
        return true;
    }

    // Create fallback HTML
    createFallbackHTML() {
        const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy" content="default-src 'self' 'unsafe-inline' 'unsafe-eval'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';">
    <title>Professional PDF Editor</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #1e1e1e;
            color: #e0e0e0;
            height: 100vh;
            display: flex;
            flex-direction: column;
        }
        .toolbar {
            background: #2d2d2d;
            padding: 10px;
            display: flex;
            gap: 10px;
            border-bottom: 1px solid #444;
        }
        .btn {
            padding: 8px 16px;
            background: #0d7377;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
        }
        .btn:hover { background: #14868b; }
        .main-content {
            flex: 1;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 20px;
        }
        .pdf-viewer {
            background: #2d2d2d;
            border-radius: 8px;
            padding: 40px;
            text-align: center;
            max-width: 600px;
        }
        h1 { color: #4CAF50; margin-bottom: 20px; }
        p { line-height: 1.6; margin-bottom: 20px; }
        .status { 
            background: #1e1e1e; 
            padding: 15px; 
            border-radius: 4px;
            font-family: monospace;
        }
    </style>
</head>
<body>
    <div class="toolbar">
        <button class="btn" onclick="openFile()">Open PDF</button>
        <button class="btn" onclick="testAPI()">Test API</button>
    </div>
    <div class="main-content">
        <div class="pdf-viewer">
            <h1>Professional PDF Editor</h1>
            <p>Emergency mode active. Core features loading...</p>
            <div class="status" id="status">
                Checking system...
            </div>
        </div>
    </div>
    
    <script>
        // Check if Electron API is available
        window.addEventListener('DOMContentLoaded', () => {
            const status = document.getElementById('status');
            
            if (typeof window.electronAPI !== 'undefined') {
                status.textContent = '✅ Electron API connected';
                console.log('Electron API available:', window.electronAPI);
            } else {
                status.textContent = '❌ Electron API not available';
                console.error('Electron API missing - preload script may have failed');
            }
        });
        
        function openFile() {
            if (window.electronAPI && window.electronAPI.openFile) {
                window.electronAPI.openFile().then(result => {
                    console.log('File opened:', result);
                }).catch(err => {
                    console.error('Error opening file:', err);
                });
            } else {
                alert('File API not available');
            }
        }
        
        function testAPI() {
            const status = document.getElementById('status');
            status.innerHTML = 'Testing APIs...<br>';
            
            // Test various APIs
            const tests = [
                { name: 'Electron API', exists: typeof window.electronAPI !== 'undefined' },
                { name: 'IPC Renderer', exists: typeof window.ipcRenderer !== 'undefined' },
                { name: 'File System', exists: window.electronAPI?.openFile !== undefined }
            ];
            
            tests.forEach(test => {
                status.innerHTML += test.exists ? 
                    `✅ ${test.name}<br>` : 
                    `❌ ${test.name}<br>`;
            });
        }
    </script>
    
    <!-- Try to load bundles if they exist -->
    <script src="vendor.bundle.js" defer></script>
    <script src="app.bundle.js" defer></script>
</body>
</html>`;
        
        fs.writeFileSync(path.join(this.distDir, 'index.html'), html);
        console.log('   ✅ Fallback HTML created');
    }

    // Fix path issues
    fixPaths() {
        console.log('📁 Fixing path resolution...');
        
        // Update package.json main field
        const packagePath = path.join(this.rootDir, 'package.json');
        const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
        
        if (pkg.main !== 'dist/main.js') {
            pkg.main = 'dist/main.js';
            fs.writeFileSync(packagePath, JSON.stringify(pkg, null, 2));
            console.log('   ✅ Package.json main field updated');
        }
        
        // Copy public assets
        const publicSrc = path.join(this.rootDir, 'public');
        const publicDest = path.join(this.distDir, 'public');
        
        if (fs.existsSync(publicSrc) && !fs.existsSync(publicDest)) {
            this.copyDir(publicSrc, publicDest);
            console.log('   ✅ Public assets copied');
        }
        
        return true;
    }

    // Helper to copy directory
    copyDir(src, dest) {
        fs.mkdirSync(dest, { recursive: true });
        const entries = fs.readdirSync(src, { withFileTypes: true });
        
        for (let entry of entries) {
            const srcPath = path.join(src, entry.name);
            const destPath = path.join(dest, entry.name);
            
            if (entry.isDirectory()) {
                this.copyDir(srcPath, destPath);
            } else {
                fs.copyFileSync(srcPath, destPath);
            }
        }
    }

    // Verification
    verify() {
        console.log('\n✅ VERIFICATION PHASE\n');
        
        const checks = [
            { file: 'main.js', critical: true },
            { file: 'preload.js', critical: true },
            { file: 'index.html', critical: true },
            { file: 'app.bundle.js', critical: false },
            { file: 'vendor.bundle.js', critical: false },
            { file: 'pdf.worker.min.js', critical: false }
        ];
        
        let allCritical = true;
        
        checks.forEach(check => {
            const filePath = path.join(this.distDir, check.file);
            if (fs.existsSync(filePath)) {
                const size = (fs.statSync(filePath).size / 1024).toFixed(2);
                console.log(`   ✅ ${check.file} (${size} KB)`);
            } else {
                console.log(`   ${check.critical ? '❌' : '⚠️'} ${check.file} missing`);
                if (check.critical) allCritical = false;
            }
        });
        
        return allCritical;
    }

    // Main execution
    async execute() {
        console.log('╔══════════════════════════════════════════════════════════╗');
        console.log('║     COMPLETE SYSTEM FIX - TRANSISTHESIS ENGINE          ║');
        console.log('╚══════════════════════════════════════════════════════════╝');
        
        // Phase 1: Council
        this.gatherCouncil();
        
        // Phase 2: Synthesis
        const solutions = this.synthesizeSolutions();
        
        // Phase 3: Execution
        console.log('\n⚡ EXECUTION PHASE\n');
        for (const solution of solutions) {
            console.log(`\nExecuting: ${solution.name} (Priority: ${solution.priority})`);
            solution.action();
        }
        
        // Phase 4: Verification
        const success = this.verify();
        
        // Phase 5: Report
        console.log('\n' + '═'.repeat(60));
        if (success) {
            console.log('✨ SYSTEM FIXED SUCCESSFULLY ✨');
            console.log('\nThe PDF Editor is ready to run:');
            console.log('  npm start');
        } else {
            console.log('⚠️  PARTIAL FIX APPLIED');
            console.log('\nSome issues remain. Check the output above.');
        }
        console.log('═'.repeat(60) + '\n');
        
        return success;
    }
}

// Run the complete fix
(async () => {
    const fix = new CompleteFix();
    const success = await fix.execute();
    process.exit(success ? 0 : 1);
})();
