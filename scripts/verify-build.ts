#!/usr/bin/env node
/**
 * Build Verification Script
 * Verifies that the build process completes successfully
 */

import * as fs from 'fs';
import * as path from 'path';
import { spawn } from 'child_process';

// Configuration
const PROJECT_ROOT = path.resolve(__dirname, '..');
const DIST_DIR = path.join(PROJECT_ROOT, 'dist');
const PACKAGE_JSON = path.join(PROJECT_ROOT, 'package.json');

interface BuildResult {
  success: boolean;
  duration: number;
  filesCreated: string[];
  errors: string[];
  warnings: string[];
}

async function verifyBuild(): Promise<BuildResult> {
  const result: BuildResult = {
    success: true,
    duration: 0,
    filesCreated: [],
    errors: [],
    warnings: []
  };

  console.log('🏗️  Verifying PDF Editor build...');

  // Check if package.json exists
  if (!fs.existsSync(PACKAGE_JSON)) {
    result.errors.push('❌ package.json not found');
    result.success = false;
    return result;
  }

  // Check if dist directory exists
  if (!fs.existsSync(DIST_DIR)) {
    result.errors.push('❌ dist directory not found - build may not have completed');
    result.success = false;
    return result;
  }

  // Measure build time
  const startTime = Date.now();

  // Run build command
  try {
    console.log('🔨 Running build process...');
    
    const buildProcess = spawn('node', ['scripts/build.ts'], {
      cwd: PROJECT_ROOT,
      stdio: 'pipe'
    });

    let stdout = '';
    let stderr = '';

    buildProcess.stdout.on('data', (data) => {
      stdout += data.toString();
      // Uncomment to see build output in real-time
      // console.log(data.toString());
    });

    buildProcess.stderr.on('data', (data) => {
      stderr += data.toString();
      // Uncomment to see build errors in real-time
      // console.error(data.toString());
    });

    await new Promise<void>((resolve, reject) => {
      buildProcess.on('close', (code) => {
        if (code === 0) {
          console.log('✅ Build process completed successfully');
          resolve();
        } else {
          console.log(`❌ Build process failed with code ${code}`);
          reject(new Error(`Build failed with code ${code}`));
        }
      });

      buildProcess.on('error', (error: any) => {
        console.log(`❌ Build process error: ${error.message}`);
        reject(error);
      });
    });

    // Calculate build duration
    result.duration = Date.now() - startTime;

    // Check for warnings
    if (stderr.toLowerCase().includes('warning')) {
      result.warnings.push('⚠️  Build completed with warnings');
      console.log('⚠️  Build completed with warnings');
    }

    // Check if dist directory was created
    if (!fs.existsSync(DIST_DIR)) {
      result.errors.push('❌ dist directory not found after build');
      result.success = false;
      return result;
    }

    // List files created in dist directory
    const distFiles = fs.readdirSync(DIST_DIR, { recursive: true });
    result.filesCreated = distFiles.map(file => file.toString());

    console.log(`📁 ${distFiles.length} files created in dist directory`);

    // Check for main process build files
    const mainBuildFiles = [
      path.join(DIST_DIR, 'main', 'main.js'),
      path.join(DIST_DIR, 'main', 'preload.js')
    ];

    for (const file of mainBuildFiles) {
      if (!fs.existsSync(file)) {
        result.errors.push(`❌ Main process build file not found: ${path.relative(PROJECT_ROOT, file)}`);
        result.success = false;
      } else {
        console.log(`✅ Main process build file found: ${path.relative(PROJECT_ROOT, file)}`);
      }
    }

    // Check for renderer build files
    const rendererBuildFiles = [
      path.join(DIST_DIR, 'renderer', 'index.html'),
      path.join(DIST_DIR, 'renderer', 'bundle.js')
    ];

    // Look for bundle files (they might have hashes in the name)
    const rendererDir = path.join(DIST_DIR, 'renderer');
    if (fs.existsSync(rendererDir)) {
      const rendererFiles = fs.readdirSync(rendererDir);
      const bundleFiles = rendererFiles.filter(file => file.endsWith('.js') && file.includes('bundle'));
      
      if (bundleFiles.length === 0) {
        result.errors.push('❌ No renderer bundle files found');
        result.success = false;
      } else {
        console.log(`✅ ${bundleFiles.length} renderer bundle files found`);
        bundleFiles.forEach(file => {
          console.log(`  📄 ${file}`);
        });
      }
      
      // Check for index.html
      if (!rendererFiles.includes('index.html')) {
        result.errors.push('❌ index.html not found in renderer directory');
        result.success = false;
      } else {
        console.log('✅ index.html found in renderer directory');
      }
    } else {
      result.errors.push('❌ Renderer directory not found in dist');
      result.success = false;
    }

    // Summary
    if (result.success) {
      result.success = true;
      console.log(`🎉 Build verification completed successfully in ${result.duration}ms`);
    } else {
      result.success = false;
      console.log('❌ Build verification failed');
    }

  } catch (error: any) {
    result.errors.push(`❌ Build process failed: ${error.message}`);
    result.success = false;
    result.duration = Date.now() - startTime;
  }

  return result;
}

async function main() {
  console.log('🔍 PDF Editor Build Verification');
  console.log('================================');

  const result = await verifyBuild();

  console.log('\n📊 Build Verification Results:');
  console.log('============================');

  console.log(`⏱️  Duration: ${result.duration}ms`);
  console.log(`📁 Files created: ${result.filesCreated.length}`);
  console.log(`✅ Success: ${result.success ? 'Yes' : 'No'}`);

  if (result.warnings.length > 0) {
    console.log('\n⚠️  Warnings:');
    result.warnings.forEach(warning => console.log(`  ${warning}`));
  }

  if (result.errors.length > 0) {
    console.log('\n❌ Errors:');
    result.errors.forEach(error => console.log(`  ${error}`));
  }

  if (result.success) {
    console.log('\n🎉 Build verification passed!');
    console.log('✅ The application is ready for distribution');
  } else {
    console.log('\n❌ Build verification failed!');
    console.log('❌ Please fix the issues before distributing the application');
    process.exit(1);
  }
}

// Run verification
if (require.main === module) {
  main().catch((error: any) => {
    console.error('_fatal verification error:', error);
    process.exit(1);
  });
}

export { verifyBuild, main };