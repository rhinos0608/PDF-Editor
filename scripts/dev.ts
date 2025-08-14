#!/usr/bin/env node
/**
 * Development Server Script for PDF Editor
 * Simplifies the development workflow
 */

import { spawn } from 'child_process';
import * as path from 'path';

// Configuration
const PROJECT_ROOT = path.resolve(__dirname, '..');

interface DevConfig {
  port: number;
  open: boolean;
  verbose: boolean;
}

async function startDevServer(config: DevConfig) {
  console.log('🚀 Starting PDF Editor Development Server...');
  
  // Start webpack dev server
  const webpackDevServer = spawn(
    'npx',
    [
      'webpack',
      'serve',
      '--config', 'webpack.renderer.config.js',
      '--mode', 'development',
      '--port', config.port.toString(),
      ...(config.open ? ['--open'] : []),
      ...(config.verbose ? ['--verbose'] : [])
    ],
    { cwd: PROJECT_ROOT, stdio: 'inherit' }
  );
  
  // Start main process in watch mode
  const mainWatcher = spawn(
    'npx',
    [
      'webpack',
      '--config', 'webpack.main.config.js',
      '--mode', 'development',
      '--watch'
    ],
    { cwd: PROJECT_ROOT, stdio: 'inherit' }
  );
  
  // Handle process termination
  const cleanup = () => {
    console.log('\n🛑 Shutting down development server...');
    webpackDevServer.kill();
    mainWatcher.kill();
    process.exit(0);
  };
  
  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
  
  webpackDevServer.on('error', (error) => {
    console.error('❌ Webpack dev server error:', error);
    process.exit(1);
  });
  
  mainWatcher.on('error', (error) => {
    console.error('❌ Main process watcher error:', error);
    process.exit(1);
  });
  
  console.log(`📡 Development server running on http://localhost:${config.port}`);
  console.log('🔄 Watching for changes...');
}

// Parse command line arguments
function parseArgs(): DevConfig {
  const args = process.argv.slice(2);
  const config: DevConfig = {
    port: 8080,
    open: false,
    verbose: false
  };
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    switch (arg) {
      case '--port':
      case '-p':
        const port = parseInt(args[++i]);
        if (!isNaN(port) && port > 0 && port < 65536) {
          config.port = port;
        } else {
          console.warn(`⚠️  Invalid port "${args[i]}", using default ${config.port}`);
        }
        break;
      case '--open':
      case '-o':
        config.open = true;
        break;
      case '--verbose':
      case '-v':
        config.verbose = true;
        break;
      case '--help':
      case '-h':
        console.log(`
PDF Editor Development Server

Usage: npm run dev [--port PORT] [--open] [--verbose]

Options:
  --port PORT, -p PORT  Port to run the server on (default: 8080)
  --open, -o           Open browser automatically
  --verbose, -v        Enable verbose logging
  --help, -h           Show this help message
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
  startDevServer(config).catch((error) => {
    console.error('Fatal dev server error:', error);
    process.exit(1);
  });
}

export { startDevServer, DevConfig };
