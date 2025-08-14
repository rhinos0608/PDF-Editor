#!/usr/bin/env node
/**
 * Unified Build Script for PDF Editor
 * Simplifies the complex build system with a single entry point
 */

import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import * as path from 'path';

// Configuration
const PROJECT_ROOT = path.resolve(__dirname, '..');
const DIST_DIR = path.join(PROJECT_ROOT, 'dist');
const SRC_DIR = path.join(PROJECT_ROOT, 'src');

interface BuildConfig {
  mode: 'development' | 'production';
  clean: boolean;
  watch: boolean;
}

async function cleanDist() {
  try {
    await fs.rm(DIST_DIR, { recursive: true, force: true });
    console.log('🧹 Cleaned dist directory');
  } catch (error) {
    console.warn('⚠️  Warning: Could not clean dist directory', error);
  }
}

async function buildMain(config: BuildConfig) {
  console.log('⚙️  Building main process...');
  
  return new Promise<void>((resolve, reject) => {
    const webpack = spawn(
      'node',
      [
        'node_modules/webpack/bin/webpack.js',
        '--config', 'webpack.main.config.js',
        '--mode', config.mode,
        ...(config.watch ? ['--watch'] : [])
      ],
      { cwd: PROJECT_ROOT, stdio: 'inherit' }
    );
    
    webpack.on('close', (code) => {
      if (code === 0) {
        console.log('✅ Main process built successfully');
        resolve();
      } else {
        reject(new Error(`Main process build failed with code ${code}`));
      }
    });
    
    webpack.on('error', (error) => {
      reject(new Error(`Main process build error: ${error.message}`));
    });
  });
}

async function buildRenderer(config: BuildConfig) {
  console.log('🌐 Building renderer...');
  
  return new Promise<void>((resolve, reject) => {
    const webpack = spawn(
      'node',
      [
        'node_modules/webpack/bin/webpack.js',
        '--config', 'webpack.renderer.config.js',
        '--mode', config.mode,
        ...(config.watch ? ['--watch'] : [])
      ],
      { cwd: PROJECT_ROOT, stdio: 'inherit' }
    );
    
    webpack.on('close', (code) => {
      if (code === 0) {
        console.log('✅ Renderer built successfully');
        resolve();
      } else {
        reject(new Error(`Renderer build failed with code ${code}`));
      }
    });
    
    webpack.on('error', (error) => {
      reject(new Error(`Renderer build error: ${error.message}`));
    });
  });
}

async function copyStaticAssets() {
  console.log('📦 Copying static assets...');
  
  try {
    // Copy public directory
    const publicDir = path.join(PROJECT_ROOT, 'public');
    const distPublicDir = path.join(DIST_DIR, 'public');
    
    await fs.cp(publicDir, distPublicDir, { recursive: true });
    console.log('✅ Static assets copied');
  } catch (error) {
    console.warn('⚠️  Warning: Could not copy all static assets', error);
  }
}

async function build(config: BuildConfig) {
  console.log(`🏗️  Building PDF Editor in ${config.mode} mode...`);
  
  try {
    // 1. Clean if requested
    if (config.clean) {
      await cleanDist();
    }
    
    // 2. Ensure dist directory exists
    await fs.mkdir(DIST_DIR, { recursive: true });
    
    // 3. Build main process
    await buildMain(config);
    
    // 4. Build renderer
    await buildRenderer(config);
    
    // 5. Copy static assets
    await copyStaticAssets();
    
    console.log('🎉 Build completed successfully!');
  } catch (error) {
    console.error('💥 Build failed:', error);
    process.exit(1);
  }
}

// Parse command line arguments
function parseArgs(): BuildConfig {
  const args = process.argv.slice(2);
  const config: BuildConfig = {
    mode: 'production',
    clean: false,
    watch: false
  };
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    switch (arg) {
      case '--dev':
      case '-d':
        config.mode = 'development';
        break;
      case '--clean':
      case '-c':
        config.clean = true;
        break;
      case '--watch':
      case '-w':
        config.watch = true;
        break;
      case '--help':
      case '-h':
        console.log(`
PDF Editor Build Script

Usage: npm run build [--dev] [--clean] [--watch]

Options:
  --dev, -d     Build in development mode
  --clean, -c   Clean dist directory before building
  --watch, -w   Watch for changes and rebuild
  --help, -h    Show this help message
        `);
        process.exit(0);
        break;
    }
  }
  
  return config;
}

// Main execution
if (require.main === module) {
  const config = parseArgs();
  build(config).catch((error) => {
    console.error('Fatal build error:', error);
    process.exit(1);
  });
}

export { build, BuildConfig };