/**
 * Emergency Direct Build - Bypasses Webpack
 * Last resort when webpack fails
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('EMERGENCY DIRECT BUILD SYSTEM');
console.log('==============================\n');

const rootDir = __dirname;
const distDir = path.join(rootDir, 'dist');
const srcDir = path.join(rootDir, 'src');

// Step 1: Ensure dist exists
console.log('1. Creating dist directory...');
if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
}

// Step 2: Direct copy main process files
console.log('2. Copying main process files...');

// Copy main.js with GPU fixes
const mainSrc = path.join(srcDir, 'main.js');
const mainDest = path.join(distDir, 'main.js');

if (fs.existsSync(mainSrc)) {
    let mainContent = fs.readFileSync(mainSrc, 'utf8');
    
    // Ensure GPU fixes are present
    if (!mainContent.includes('disable-gpu')) {
        // Add after the imports
        const gpuFix = `
// GPU Error Prevention
app.commandLine.appendSwitch('disable-gpu');
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('disable-software-rasterizer');
app.commandLine.appendSwitch('no-sandbox');
`;
        mainContent = mainContent.replace(
            "const isDev = process.env.NODE_ENV === 'development';",
            `const isDev = process.env.NODE_ENV === 'development';\n${gpuFix}`
        );
    }
    
    // Fix the path for loading index.html
    mainContent = mainContent.replace(
        "mainWindow.loadFile(path.join(__dirname, 'index.html'));",
        `const indexPath = path.join(__dirname, 'index.html');
    if (fs.existsSync(indexPath)) {
        mainWindow.loadFile(indexPath);
    } else {
        console.error('Index.html not found at:', indexPath);
        dialog.showErrorBox('Error', 'Application files not found. Path: ' + indexPath);
    }`
    );
    
    fs.writeFileSync(mainDest, mainContent);
    console.log('   ✓ main.js copied and patched');
} else {
    console.error('   ✗ main.js not found in src!');
}

// Copy preload.js
const preloadSrc = path.join(srcDir, 'preload.js');
const preloadDest = path.join(distDir, 'preload.js');

if (fs.existsSync(preloadSrc)) {
    fs.copyFileSync(preloadSrc, preloadDest);
    console.log('   ✓ preload.js copied');
} else {
    console.error('   ✗ preload.js not found in src!');
}

// Step 3: Build renderer with webpack
console.log('3. Building renderer...');
try {
    execSync('npx webpack --config webpack.renderer.config.prod.js', {
        stdio: 'inherit'
    });
    console.log('   ✓ Renderer built');
} catch (e) {
    console.error('   ✗ Renderer build failed');
    
    // Fallback: copy basic HTML
    const htmlSrc = path.join(srcDir, 'renderer', 'index.html');
    const htmlDest = path.join(distDir, 'index.html');
    
    if (fs.existsSync(htmlSrc)) {
        fs.copyFileSync(htmlSrc, htmlDest);
        console.log('   ✓ Copied fallback HTML');
    }
}

// Step 4: Copy critical assets
console.log('4. Copying assets...');

// Copy public folder
const publicSrc = path.join(rootDir, 'public');
const publicDest = path.join(distDir, 'public');

if (fs.existsSync(publicSrc) && !fs.existsSync(publicDest)) {
    fs.mkdirSync(publicDest, { recursive: true });
    
    // Copy all files from public
    const files = fs.readdirSync(publicSrc);
    files.forEach(file => {
        fs.copyFileSync(
            path.join(publicSrc, file),
            path.join(publicDest, file)
        );
    });
    console.log('   ✓ Public assets copied');
}

// Copy PDF.js worker if needed
const pdfWorkerSrc = path.join(rootDir, 'node_modules', 'pdfjs-dist', 'build', 'pdf.worker.min.js');
const pdfWorkerDest = path.join(distDir, 'pdf.worker.min.js');

if (fs.existsSync(pdfWorkerSrc) && !fs.existsSync(pdfWorkerDest)) {
    fs.copyFileSync(pdfWorkerSrc, pdfWorkerDest);
    console.log('   ✓ PDF.js worker copied');
}

// Step 5: Create emergency HTML if nothing else worked
if (!fs.existsSync(path.join(distDir, 'index.html'))) {
    console.log('5. Creating emergency HTML...');
    const emergencyHTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Professional PDF Editor</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background: #1e1e1e;
            color: #fff;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
        }
        .container {
            text-align: center;
        }
        h1 {
            color: #4CAF50;
        }
        .status {
            background: #333;
            padding: 20px;
            border-radius: 8px;
            margin-top: 20px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Professional PDF Editor</h1>
        <div class="status">
            <p>Application is loading...</p>
            <p>If you see this message, the renderer build needs attention.</p>
            <p>Please check the console for errors.</p>
        </div>
    </div>
    <script>
        console.log('Emergency HTML loaded. Renderer bundle missing.');
        if (window.electronAPI) {
            console.log('Electron API available');
        } else {
            console.log('Electron API not available');
        }
    </script>
</body>
</html>`;
    
    fs.writeFileSync(path.join(distDir, 'index.html'), emergencyHTML);
    console.log('   ✓ Emergency HTML created');
}

// Step 6: Verify
console.log('\n6. Verification...');
const files = fs.readdirSync(distDir);
console.log('Files in dist:');
files.forEach(file => {
    const stats = fs.statSync(path.join(distDir, file));
    if (stats.isFile()) {
        console.log(`   - ${file} (${(stats.size / 1024).toFixed(2)} KB)`);
    } else {
        console.log(`   - ${file}/ (directory)`);
    }
});

// Step 7: Fix package.json main field
console.log('\n7. Fixing package.json...');
const packageJsonPath = path.join(rootDir, 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

if (packageJson.main !== 'dist/main.js') {
    packageJson.main = 'dist/main.js';
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    console.log('   ✓ Updated main entry point');
}

console.log('\n==============================');
console.log('EMERGENCY BUILD COMPLETE');
console.log('==============================');
console.log('\nYou can now try:');
console.log('  npm start');
console.log('  or');
console.log('  electron dist/main.js');
console.log('\nIf the app starts but features don\'t work, check:');
console.log('  1. Console for errors (Ctrl+Shift+I in app)');
console.log('  2. That all JavaScript bundles loaded');
console.log('  3. Network tab for failed resource loads');
