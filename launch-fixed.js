#!/usr/bin/env node
/**
 * Professional PDF Editor - Fixed Launcher v12
 * Implements Transithesis framework with comprehensive diagnostics
 * Enhanced with Grimoire patterns for robust execution
 */

const { spawn, exec } = require('child_process');
const path = require('path');
const fs = require('fs');

// ANSI color codes for beautiful output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    bgRed: '\x1b[41m',
    bgGreen: '\x1b[42m',
    bgYellow: '\x1b[43m',
    bgBlue: '\x1b[44m'
};

// Transithesis Confidence Tensor
class ConfidenceTensor {
    constructor() {
        this.metrics = {
            fileIntegrity: 0,
            electronAvailability: 0,
            pathConfiguration: 0,
            buildCompleteness: 0,
            systemCompatibility: 0
        };
    }
    
    calculate() {
        const weights = {
            fileIntegrity: 0.30,
            electronAvailability: 0.25,
            pathConfiguration: 0.20,
            buildCompleteness: 0.15,
            systemCompatibility: 0.10
        };
        
        let total = 0;
        for (const [key, weight] of Object.entries(weights)) {
            total += this.metrics[key] * weight;
        }
        return total;
    }
    
    report() {
        console.log(`${colors.cyan}╔══════════════════════════════════════════════════════════════╗${colors.reset}`);
        console.log(`${colors.cyan}║          CONFIDENCE TENSOR ANALYSIS REPORT                  ║${colors.reset}`);
        console.log(`${colors.cyan}╠══════════════════════════════════════════════════════════════╣${colors.reset}`);
        
        for (const [key, value] of Object.entries(this.metrics)) {
            const percentage = Math.round(value * 100);
            const bar = this.createProgressBar(percentage);
            const name = key.replace(/([A-Z])/g, ' $1').trim();
            console.log(`${colors.cyan}║${colors.reset} ${name.padEnd(20)} ${bar} ${percentage}%`);
        }
        
        const overall = Math.round(this.calculate() * 100);
        console.log(`${colors.cyan}╠══════════════════════════════════════════════════════════════╣${colors.reset}`);
        console.log(`${colors.cyan}║${colors.reset} ${colors.bright}Overall Confidence:${colors.reset}  ${this.createProgressBar(overall)} ${colors.bright}${overall}%${colors.reset}`);
        console.log(`${colors.cyan}╚══════════════════════════════════════════════════════════════╝${colors.reset}`);
    }
    
    createProgressBar(percentage) {
        const filled = Math.floor(percentage / 5);
        const empty = 20 - filled;
        const color = percentage >= 80 ? colors.green : percentage >= 60 ? colors.yellow : colors.red;
        return `${color}${'█'.repeat(filled)}${colors.dim}${'░'.repeat(empty)}${colors.reset}`;
    }
}

// Living Spiral Pattern Implementation
class PDFEditorLauncher {
    constructor() {
        this.confidence = new ConfidenceTensor();
        this.projectRoot = __dirname;
        this.launchStrategies = [];
        this.initializeStrategies();
    }
    
    initializeStrategies() {
        // Strategy hierarchy based on confidence and reliability
        this.launchStrategies = [
            {
                name: 'Standard Electron Launch',
                confidence: 0.95,
                execute: () => this.standardLaunch()
            },
            {
                name: 'Direct Path Launch',
                confidence: 0.90,
                execute: () => this.directPathLaunch()
            },
            {
                name: 'NPX Electron Launch',
                confidence: 0.85,
                execute: () => this.npxLaunch()
            },
            {
                name: 'Node Modules Launch',
                confidence: 0.80,
                execute: () => this.nodeModulesLaunch()
            },
            {
                name: 'Emergency Build & Launch',
                confidence: 0.70,
                execute: () => this.emergencyBuildAndLaunch()
            }
        ];
    }
    
    async launch() {
        console.clear();
        this.printHeader();
        
        // Phase 1: Comprehensive Diagnostics (Transithesis)
        console.log(`\n${colors.blue}▶ Phase 1: System Diagnostics${colors.reset}`);
        await this.runDiagnostics();
        
        // Phase 2: Environment Preparation
        console.log(`\n${colors.blue}▶ Phase 2: Environment Preparation${colors.reset}`);
        await this.prepareEnvironment();
        
        // Phase 3: Strategy Selection & Execution
        console.log(`\n${colors.blue}▶ Phase 3: Launch Execution${colors.reset}`);
        const confidence = this.confidence.calculate();
        
        if (confidence < 0.5) {
            console.log(`${colors.red}⚠ Critical: Confidence too low (${Math.round(confidence * 100)}%)${colors.reset}`);
            console.log(`${colors.yellow}Initiating emergency recovery...${colors.reset}`);
            await this.emergencyRecovery();
        }
        
        // Try strategies in order
        for (const strategy of this.launchStrategies) {
            if (confidence >= strategy.confidence * 0.8) { // Allow some flexibility
                console.log(`\n${colors.cyan}Attempting: ${strategy.name}${colors.reset}`);
                const result = await strategy.execute();
                if (result) {
                    console.log(`${colors.green}✓ Success with ${strategy.name}${colors.reset}`);
                    return;
                }
            }
        }
        
        // If all strategies fail
        console.log(`\n${colors.red}✗ All strategies exhausted${colors.reset}`);
        this.provideManualInstructions();
    }
    
    printHeader() {
        const title = 'PROFESSIONAL PDF EDITOR v12.0';
        const subtitle = 'Adobe-Quality Experience with AI Enhancement';
        
        console.log(`${colors.bgBlue}${colors.white}${'═'.repeat(66)}${colors.reset}`);
        console.log(`${colors.bgBlue}${colors.white}${title.padStart(40).padEnd(66)}${colors.reset}`);
        console.log(`${colors.bgBlue}${colors.white}${subtitle.padStart(44).padEnd(66)}${colors.reset}`);
        console.log(`${colors.bgBlue}${colors.white}${'═'.repeat(66)}${colors.reset}`);
    }
    
    async runDiagnostics() {
        const diagnostics = [
            { name: 'Node.js Version', check: () => this.checkNode() },
            { name: 'Electron Installation', check: () => this.checkElectron() },
            { name: 'Project Structure', check: () => this.checkProjectStructure() },
            { name: 'Build Artifacts', check: () => this.checkBuildArtifacts() },
            { name: 'Dependencies', check: () => this.checkDependencies() }
        ];
        
        for (const diagnostic of diagnostics) {
            process.stdout.write(`  Checking ${diagnostic.name}...`);
            const result = await diagnostic.check();
            if (result.success) {
                console.log(` ${colors.green}✓${colors.reset} ${result.message || ''}`);
            } else {
                console.log(` ${colors.red}✗${colors.reset} ${result.message || ''}`);
            }
        }
        
        this.confidence.report();
    }
    
    async checkNode() {
        try {
            const version = process.version;
            const major = parseInt(version.split('.')[0].substring(1));
            
            if (major >= 14) {
                this.confidence.metrics.systemCompatibility = 1.0;
                return { success: true, message: `v${version}` };
            } else {
                this.confidence.metrics.systemCompatibility = 0.5;
                return { success: false, message: `v${version} (needs v14+)` };
            }
        } catch (error) {
            this.confidence.metrics.systemCompatibility = 0;
            return { success: false, message: 'Failed to check version' };
        }
    }
    
    async checkElectron() {
        const paths = [
            path.join(this.projectRoot, 'node_modules', '.bin', 'electron'),
            path.join(this.projectRoot, 'node_modules', '.bin', 'electron.cmd'),
            path.join(this.projectRoot, 'node_modules', 'electron', 'dist', 'electron.exe')
        ];
        
        for (const electronPath of paths) {
            if (fs.existsSync(electronPath)) {
                this.confidence.metrics.electronAvailability = 1.0;
                return { success: true, message: 'Found' };
            }
        }
        
        // Check if electron is available via npx
        try {
            await this.executeCommand('npx electron --version', { silent: true });
            this.confidence.metrics.electronAvailability = 0.8;
            return { success: true, message: 'Available via npx' };
        } catch {
            this.confidence.metrics.electronAvailability = 0;
            return { success: false, message: 'Not found' };
        }
    }
    
    async checkProjectStructure() {
        const requiredFiles = [
            'package.json',
            'src/main/main.ts',
            'src/renderer/App.tsx'
        ];
        
        let found = 0;
        for (const file of requiredFiles) {
            if (fs.existsSync(path.join(this.projectRoot, file))) {
                found++;
            }
        }
        
        this.confidence.metrics.fileIntegrity = found / requiredFiles.length;
        
        if (found === requiredFiles.length) {
            return { success: true, message: 'Complete' };
        } else {
            return { success: false, message: `${found}/${requiredFiles.length} files` };
        }
    }
    
    async checkBuildArtifacts() {
        const mainPath = path.join(this.projectRoot, 'dist', 'main', 'main.js');
        const rendererPath = path.join(this.projectRoot, 'dist', 'renderer');
        
        const mainExists = fs.existsSync(mainPath);
        const rendererExists = fs.existsSync(rendererPath);
        
        if (mainExists && rendererExists) {
            this.confidence.metrics.buildCompleteness = 1.0;
            return { success: true, message: 'Ready' };
        } else if (mainExists || rendererExists) {
            this.confidence.metrics.buildCompleteness = 0.5;
            return { success: false, message: 'Partial build' };
        } else {
            this.confidence.metrics.buildCompleteness = 0;
            return { success: false, message: 'Build required' };
        }
    }
    
    async checkDependencies() {
        const nodeModulesPath = path.join(this.projectRoot, 'node_modules');
        
        if (!fs.existsSync(nodeModulesPath)) {
            this.confidence.metrics.pathConfiguration = 0;
            return { success: false, message: 'Not installed' };
        }
        
        // Check for critical dependencies
        const critical = ['electron', 'react', 'pdf-lib'];
        let found = 0;
        
        for (const dep of critical) {
            if (fs.existsSync(path.join(nodeModulesPath, dep))) {
                found++;
            }
        }
        
        this.confidence.metrics.pathConfiguration = found / critical.length;
        
        if (found === critical.length) {
            return { success: true, message: 'Complete' };
        } else {
            return { success: false, message: `${found}/${critical.length} critical deps` };
        }
    }
    
    async prepareEnvironment() {
        // Install dependencies if needed
        if (this.confidence.metrics.pathConfiguration < 0.5) {
            console.log(`  ${colors.yellow}Installing dependencies...${colors.reset}`);
            await this.executeCommand('npm install');
            // Re-check after installation
            await this.checkDependencies();
        }
        
        // Build if needed
        if (this.confidence.metrics.buildCompleteness < 0.5) {
            console.log(`  ${colors.yellow}Building application...${colors.reset}`);
            await this.buildApplication();
        }
        
        console.log(`  ${colors.green}✓ Environment ready${colors.reset}`);
    }
    
    async buildApplication() {
        const buildScripts = [
            'build.js',
            'build-master-v5.js',
            'build-emergency.js'
        ];
        
        for (const script of buildScripts) {
            const scriptPath = path.join(this.projectRoot, script);
            if (fs.existsSync(scriptPath)) {
                try {
                    console.log(`    Running ${script}...`);
                    await this.executeCommand(`node "${scriptPath}"`);
                    
                    // Check if build succeeded
                    await this.checkBuildArtifacts();
                    if (this.confidence.metrics.buildCompleteness > 0.8) {
                        return true;
                    }
                } catch (error) {
                    console.log(`    ${colors.yellow}⚠ ${script} failed${colors.reset}`);
                }
            }
        }
        
        // Fallback to npm build
        try {
            console.log(`    Running npm build...`);
            await this.executeCommand('npm run build');
            return true;
        } catch {
            console.log(`    ${colors.red}✗ Build failed${colors.reset}`);
            return false;
        }
    }
    
    async standardLaunch() {
        try {
            const mainPath = path.join(this.projectRoot, 'dist', 'main', 'main.js');
            if (!fs.existsSync(mainPath)) {
                throw new Error('Main file not found');
            }
            
            return await this.spawnElectron([mainPath]);
        } catch (error) {
            return false;
        }
    }
    
    async directPathLaunch() {
        try {
            return await this.spawnElectron(['dist/main/main.js']);
        } catch {
            return false;
        }
    }
    
    async npxLaunch() {
        try {
            const child = spawn('npx', ['electron', 'dist/main/main.js'], {
                cwd: this.projectRoot,
                stdio: 'inherit',
                shell: true
            });
            
            return await this.waitForProcess(child);
        } catch {
            return false;
        }
    }
    
    async nodeModulesLaunch() {
        try {
            const electronPath = path.join(this.projectRoot, 'node_modules', '.bin', 'electron');
            const mainPath = path.join(this.projectRoot, 'dist', 'main', 'main.js');
            
            const child = spawn(electronPath, [mainPath], {
                cwd: this.projectRoot,
                stdio: 'inherit',
                shell: true
            });
            
            return await this.waitForProcess(child);
        } catch {
            return false;
        }
    }
    
    async emergencyBuildAndLaunch() {
        console.log(`  ${colors.yellow}Emergency: Rebuilding and launching...${colors.reset}`);
        
        // Try to build
        await this.buildApplication();
        
        // Try to launch again
        return await this.standardLaunch();
    }
    
    async emergencyRecovery() {
        console.log(`\n${colors.bgYellow}${colors.black} EMERGENCY RECOVERY MODE ${colors.reset}`);
        
        // Create emergency HTML if needed
        const emergencyHtml = path.join(this.projectRoot, 'emergency.html');
        if (!fs.existsSync(emergencyHtml)) {
            this.createEmergencyHTML(emergencyHtml);
        }
        
        // Try to launch emergency HTML
        try {
            const child = spawn('npx', ['electron', emergencyHtml], {
                cwd: this.projectRoot,
                stdio: 'inherit',
                shell: true
            });
            
            console.log(`${colors.green}✓ Emergency mode activated${colors.reset}`);
            return await this.waitForProcess(child);
        } catch (error) {
            console.log(`${colors.red}✗ Emergency mode failed${colors.reset}`);
            return false;
        }
    }
    
    createEmergencyHTML(filePath) {
        const html = `<!DOCTYPE html>
<html>
<head>
    <title>PDF Editor - Emergency Mode</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
        }
        .container {
            text-align: center;
            padding: 40px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 20px;
            backdrop-filter: blur(10px);
        }
        h1 { font-size: 48px; margin: 0 0 20px 0; }
        p { font-size: 18px; opacity: 0.9; }
        button {
            margin-top: 30px;
            padding: 15px 40px;
            font-size: 16px;
            background: white;
            color: #667eea;
            border: none;
            border-radius: 50px;
            cursor: pointer;
            transition: transform 0.2s;
        }
        button:hover { transform: scale(1.05); }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚨 Emergency Mode</h1>
        <p>The PDF Editor is running in emergency mode.</p>
        <p>Main application is being repaired.</p>
        <button onclick="window.close()">Close</button>
    </div>
    <script>
        const { ipcRenderer } = require('electron');
        console.log('Emergency mode active');
    </script>
</body>
</html>`;
        
        fs.writeFileSync(filePath, html);
        console.log(`  ${colors.green}✓ Created emergency.html${colors.reset}`);
    }
    
    async spawnElectron(args) {
        const electronExecutables = [
            'electron',
            'electron.cmd',
            'electron.exe',
            path.join(this.projectRoot, 'node_modules', '.bin', 'electron'),
            path.join(this.projectRoot, 'node_modules', '.bin', 'electron.cmd'),
            path.join(this.projectRoot, 'node_modules', 'electron', 'dist', 'electron.exe')
        ];
        
        for (const exe of electronExecutables) {
            try {
                const child = spawn(exe, args, {
                    cwd: this.projectRoot,
                    stdio: 'inherit',
                    shell: true
                });
                
                return await this.waitForProcess(child);
            } catch {
                continue;
            }
        }
        
        throw new Error('No working Electron executable found');
    }
    
    waitForProcess(child) {
        return new Promise((resolve) => {
            child.on('close', (code) => {
                if (code === 0) {
                    resolve(true);
                } else {
                    resolve(false);
                }
            });
            
            child.on('error', () => {
                resolve(false);
            });
        });
    }
    
    executeCommand(command, options = {}) {
        return new Promise((resolve, reject) => {
            exec(command, { cwd: this.projectRoot, ...options }, (error, stdout, stderr) => {
                if (error) {
                    if (!options.silent) {
                        console.error(`    ${colors.red}Error: ${error.message}${colors.reset}`);
                    }
                    reject(error);
                } else {
                    if (!options.silent && stdout) {
                        console.log(`    ${stdout.trim()}`);
                    }
                    resolve(stdout);
                }
            });
        });
    }
    
    provideManualInstructions() {
        console.log(`\n${colors.bgRed}${colors.white} MANUAL INTERVENTION REQUIRED ${colors.reset}`);
        console.log(`\n${colors.yellow}Please try the following steps manually:${colors.reset}`);
        console.log(`\n1. ${colors.cyan}Install dependencies:${colors.reset}`);
        console.log(`   npm install`);
        console.log(`\n2. ${colors.cyan}Build the application:${colors.reset}`);
        console.log(`   npm run build`);
        console.log(`\n3. ${colors.cyan}Start the application:${colors.reset}`);
        console.log(`   npm start`);
        console.log(`\n4. ${colors.cyan}If still failing, try emergency mode:${colors.reset}`);
        console.log(`   npx electron emergency.html`);
        console.log(`\n5. ${colors.cyan}Check the suggestions folder for detailed logs:${colors.reset}`);
        console.log(`   ${path.join(this.projectRoot, 'suggestions')}`);
        
        // Create a detailed report
        this.createDetailedReport();
    }
    
    createDetailedReport() {
        const reportPath = path.join(this.projectRoot, 'suggestions', 'launch-report-v12.json');
        const report = {
            timestamp: new Date().toISOString(),
            confidence: this.confidence.metrics,
            overallConfidence: this.confidence.calculate(),
            environment: {
                node: process.version,
                platform: process.platform,
                arch: process.arch,
                cwd: process.cwd()
            },
            projectStructure: {
                hasPackageJson: fs.existsSync(path.join(this.projectRoot, 'package.json')),
                hasNodeModules: fs.existsSync(path.join(this.projectRoot, 'node_modules')),
                hasDist: fs.existsSync(path.join(this.projectRoot, 'dist')),
                hasMainFile: fs.existsSync(path.join(this.projectRoot, 'dist', 'main', 'main.js'))
            },
            recommendations: this.generateRecommendations()
        };
        
        try {
            fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
            console.log(`\n${colors.green}✓ Detailed report saved to suggestions/launch-report-v12.json${colors.reset}`);
        } catch (error) {
            console.log(`\n${colors.red}✗ Could not save report: ${error.message}${colors.reset}`);
        }
    }
    
    generateRecommendations() {
        const recommendations = [];
        const confidence = this.confidence.metrics;
        
        if (confidence.electronAvailability < 0.5) {
            recommendations.push('Install Electron: npm install electron --save-dev');
        }
        
        if (confidence.pathConfiguration < 0.5) {
            recommendations.push('Install all dependencies: npm install');
        }
        
        if (confidence.buildCompleteness < 0.5) {
            recommendations.push('Build the application: npm run build');
        }
        
        if (confidence.fileIntegrity < 0.8) {
            recommendations.push('Check project structure - some source files may be missing');
        }
        
        if (confidence.systemCompatibility < 0.8) {
            recommendations.push('Update Node.js to v14 or higher');
        }
        
        return recommendations;
    }
}

// Main execution
async function main() {
    const launcher = new PDFEditorLauncher();
    
    try {
        await launcher.launch();
    } catch (error) {
        console.error(`\n${colors.red}Fatal error: ${error.message}${colors.reset}`);
        console.error(`${colors.dim}Stack trace:${colors.reset}`);
        console.error(error.stack);
        process.exit(1);
    }
}

// Handle process signals gracefully
process.on('SIGINT', () => {
    console.log(`\n${colors.yellow}Interrupted by user${colors.reset}`);
    process.exit(0);
});

process.on('uncaughtException', (error) => {
    console.error(`\n${colors.red}Uncaught exception: ${error.message}${colors.reset}`);
    process.exit(1);
});

// Execute
main();
