const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('PDF Editor Build Diagnostic Tool');
console.log('=================================\n');

// Check Node/NPM versions
try {
    const nodeVersion = execSync('node --version', { encoding: 'utf8' }).trim();
    const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
    console.log(`✅ Node.js: ${nodeVersion}`);
    console.log(`✅ npm: ${npmVersion}`);
} catch (e) {
    console.log('❌ Node.js or npm not found');
}

// Check webpack installation
try {
    const webpackVersion = execSync('npx webpack --version', { encoding: 'utf8' }).trim();
    console.log(`✅ Webpack: ${webpackVersion}`);
} catch (e) {
    console.log('❌ Webpack not found');
}

console.log('\n--- Source Files Check ---');
const sourceFiles = [
    'src/main.js',
    'src/preload.js',
    'src/renderer/index.tsx',
    'src/renderer/index.html',
    'src/renderer/App.tsx'
];

sourceFiles.forEach(file => {
    const exists = fs.existsSync(path.join(__dirname, file));
    console.log(`${exists ? '✅' : '❌'} ${file}`);
});

console.log('\n--- Config Files Check ---');
const configFiles = [
    'webpack.main.config.js',
    'webpack.renderer.config.prod.js',
    'package.json',
    'tsconfig.json'
];

configFiles.forEach(file => {
    const exists = fs.existsSync(path.join(__dirname, file));
    console.log(`${exists ? '✅' : '❌'} ${file}`);
});

console.log('\n--- Testing Webpack Main Build ---');
try {
    // Clean dist
    const distPath = path.join(__dirname, 'dist');
    if (fs.existsSync(distPath)) {
        fs.rmSync(distPath, { recursive: true, force: true });
    }
    fs.mkdirSync(distPath);
    
    // Run webpack for main process
    console.log('Running: npx webpack --config webpack.main.config.js --mode production');
    const output = execSync('npx webpack --config webpack.main.config.js --mode production', {
        encoding: 'utf8',
        env: { ...process.env, NODE_ENV: 'production' }
    });
    
    console.log('Webpack output:', output.substring(0, 200));
    
    // Check what was created
    console.log('\n--- Checking dist directory ---');
    const distFiles = fs.readdirSync(distPath);
    if (distFiles.length === 0) {
        console.log('❌ No files in dist directory!');
    } else {
        distFiles.forEach(file => {
            const stats = fs.statSync(path.join(distPath, file));
            console.log(`✅ ${file} (${(stats.size / 1024).toFixed(2)} KB)`);
        });
    }
    
} catch (error) {
    console.log('❌ Build failed:', error.message);
    console.log('\nFull error:', error.toString());
}

console.log('\n--- Package.json main field ---');
const packageJson = require('./package.json');
console.log(`Main entry: ${packageJson.main}`);

console.log('\n--- Checking for TypeScript errors ---');
try {
    execSync('npx tsc --noEmit', { encoding: 'utf8' });
    console.log('✅ No TypeScript errors');
} catch (e) {
    console.log('⚠️ TypeScript has errors (non-blocking)');
}

console.log('\n=================================');
console.log('Diagnostic complete.');
