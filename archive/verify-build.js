/**
 * Quick Test Script for PDF Editor Build
 * Verifies all critical components are in place
 */

const fs = require('fs');
const path = require('path');

class BuildVerifier {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.successes = [];
  }

  verify() {
    console.log('🔍 Verifying PDF Editor Build...\n');

    // Check critical files
    this.checkFile('dist/main.js', 'Main process entry');
    this.checkFile('dist/preload.js', 'Preload script');
    this.checkFile('dist/index.html', 'Renderer HTML');
    
    // Check directories
    this.checkDirectory('dist/public', 'Public assets');
    this.checkDirectory('node_modules', 'Dependencies');
    
    // Check package.json
    this.checkPackageJson();
    
    // Report results
    this.report();
  }

  checkFile(filePath, description) {
    if (fs.existsSync(filePath)) {
      this.successes.push(`✓ ${description}: ${filePath}`);
    } else {
      this.errors.push(`✗ Missing: ${description} (${filePath})`);
    }
  }

  checkDirectory(dirPath, description) {
    if (fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory()) {
      const files = fs.readdirSync(dirPath);
      if (files.length > 0) {
        this.successes.push(`✓ ${description}: ${dirPath} (${files.length} items)`);
      } else {
        this.warnings.push(`⚠ Empty: ${description} (${dirPath})`);
      }
    } else {
      this.errors.push(`✗ Missing: ${description} (${dirPath})`);
    }
  }

  checkPackageJson() {
    try {
      const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      if (pkg.main === 'dist/main.js') {
        this.successes.push('✓ Package.json main field correct');
      } else {
        this.warnings.push(`⚠ Package.json main field: ${pkg.main} (should be dist/main.js)`);
      }
    } catch (error) {
      this.errors.push('✗ Could not read package.json');
    }
  }

  report() {
    console.log('\n📊 Verification Report:\n');
    
    if (this.successes.length > 0) {
      console.log('✅ Successes:');
      this.successes.forEach(s => console.log(`  ${s}`));
    }
    
    if (this.warnings.length > 0) {
      console.log('\n⚠️ Warnings:');
      this.warnings.forEach(w => console.log(`  ${w}`));
    }
    
    if (this.errors.length > 0) {
      console.log('\n❌ Errors:');
      this.errors.forEach(e => console.log(`  ${e}`));
      
      console.log('\n🔧 To fix: Run "node build-production.js"');
    } else {
      console.log('\n✨ Build verification passed! You can run:');
      console.log('  1. npm start - to test the app');
      console.log('  2. npm run dist - to create installer');
    }
  }
}

// Run verification
const verifier = new BuildVerifier();
verifier.verify();
