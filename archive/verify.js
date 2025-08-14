/**
 * Quick Verification Script
 * Checks if build is complete and ready to run
 */

const fs = require('fs');
const path = require('path');

console.log('\n🔍 PDF Editor - Quick Verification\n');
console.log('═'.repeat(40));

const checks = {
    'dist/main.js': '✅ Main process',
    'dist/preload.js': '✅ Preload script', 
    'dist/index.html': '✅ HTML entry',
    'dist/app.bundle.js': '✅ App bundle',
    'dist/vendor.bundle.js': '✅ Vendor bundle',
    'dist/pdf.worker.min.js': '✅ PDF worker'
};

let allGood = true;

for (const [file, label] of Object.entries(checks)) {
    if (fs.existsSync(file)) {
        const size = (fs.statSync(file).size / 1024).toFixed(2);
        console.log(`${label}: ${size} KB`);
    } else {
        console.log(`❌ Missing: ${file}`);
        allGood = false;
    }
}

console.log('═'.repeat(40));

if (allGood) {
    console.log('\n✨ All files present! Ready to run:');
    console.log('   npm start\n');
} else {
    console.log('\n⚠️ Some files missing. Run:');
    console.log('   npm run build\n');
}
