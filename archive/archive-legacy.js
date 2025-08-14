const fs = require('fs');
const path = require('path');

// Archive legacy files script
const rootDir = __dirname;
const archiveDir = path.join(rootDir, 'archive');

// Files to archive (legacy/redundant)
const filesToArchive = [
    // Old build scripts
    'build-production-fixed.bat',
    'build-production.bat',
    'build-production.js',
    'build-production.ps1',
    'build-smart.bat',
    'build.bat',
    'check-system.bat',
    'complete-setup.bat',
    'COMPLETE_SOLUTION.bat',
    'final-build-test.js',
    'final-test.bat',
    'PDF_EDITOR_PREMIUM.bat',
    'run-app.bat',
    'setup-icons.js',
    'setup.bat',
    'setup.ps1',
    'smart-build.js',
    'smart-diagnostic.bat',
    'start-dev.bat',
    'start-production.js',
    'start.bat',
    'test-build.js',
    'test-typescript.js',
    'test-webpack-build.bat',
    'verify-build.bat',
    'verify-build.js',
    'verify-production.js',
    'webpack.main.config.fixed.js',
    'ULTIMATE-FIX.bat',
    'build-production-master.bat',
    'start-app.bat',
    'diagnostic.js',
    'ultimate-fix.js',
    
    // Old documentation
    'BUILD_FIX_README.md',
    'BUILD_SOLUTION.md',
    'BUILD_SUCCESS.md',
    'PRODUCTION_READY.md'
];

// Files to keep (essential)
const filesToKeep = [
    // Core files
    'package.json',
    'package-lock.json',
    'tsconfig.json',
    '.eslintrc.json',
    '.prettierrc',
    '.gitignore',
    'LICENSE',
    'electron-builder.yml',
    
    // Working solutions
    'MASTER-FIX.bat',
    'complete-fix.js',
    'emergency-build.js',
    
    // Documentation
    'README.md',
    'USER_GUIDE.md',
    'QUICK_START.md',
    'CRITICAL_FIX_README.md',
    
    // Webpack configs
    'webpack.main.config.js',
    'webpack.renderer.config.js',
    'webpack.renderer.config.prod.js'
];

console.log('PDF Editor - Archive Legacy Files');
console.log('==================================\n');

// Ensure archive directory exists
if (!fs.existsSync(archiveDir)) {
    fs.mkdirSync(archiveDir, { recursive: true });
    console.log('Created archive directory');
}

// Move files to archive
let movedCount = 0;
let errorCount = 0;

console.log('\nArchiving legacy files...\n');

filesToArchive.forEach(file => {
    const sourcePath = path.join(rootDir, file);
    const destPath = path.join(archiveDir, file);
    
    if (fs.existsSync(sourcePath)) {
        try {
            fs.renameSync(sourcePath, destPath);
            console.log(`  ✓ Archived: ${file}`);
            movedCount++;
        } catch (error) {
            console.log(`  ✗ Failed to archive: ${file}`);
            errorCount++;
        }
    } else {
        // File might already be moved or doesn't exist
    }
});

// Create archive summary
const summary = `# Archive Summary
Date: ${new Date().toISOString()}
Files Archived: ${movedCount}
Errors: ${errorCount}

## Archived Files:
${filesToArchive.filter(f => fs.existsSync(path.join(archiveDir, f))).map(f => `- ${f}`).join('\n')}

## Essential Files Kept:
${filesToKeep.filter(f => fs.existsSync(path.join(rootDir, f))).map(f => `- ${f}`).join('\n')}
`;

fs.writeFileSync(path.join(archiveDir, 'ARCHIVE_SUMMARY.md'), summary);

console.log('\n==================================');
console.log(`Archive Complete!`);
console.log(`  Files archived: ${movedCount}`);
console.log(`  Errors: ${errorCount}`);
console.log(`  Archive location: ${archiveDir}`);
console.log('\nYour project is now clean and organized!');
console.log('\nEssential files remaining:');
console.log('  - MASTER-FIX.bat (main solution)');
console.log('  - complete-fix.js (comprehensive fix)');
console.log('  - emergency-build.js (fallback)');
console.log('  - Core project files');
console.log('\nRun MASTER-FIX.bat to build and start your application.');
