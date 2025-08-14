#!/usr/bin/env node
/**
 * Test Runner Script for PDF Editor
 * Simplifies testing workflow
 */

import { spawn } from 'child_process';
import * as path from 'path';

// Configuration
const PROJECT_ROOT = path.resolve(__dirname, '..');

interface TestConfig {
  watch: boolean;
  coverage: boolean;
  verbose: boolean;
  testPattern?: string;
}

async function runTests(config: TestConfig) {
  console.log('🧪 Running PDF Editor Tests...');
  
  const jestArgs = [
    '--config', 'jest.config.js',
    ...(config.watch ? ['--watch'] : []),
    ...(config.coverage ? ['--coverage'] : []),
    ...(config.verbose ? ['--verbose'] : []),
    ...(config.testPattern ? [config.testPattern] : [])
  ];
  
  const jest = spawn('npx', ['jest', ...jestArgs], {
    cwd: PROJECT_ROOT,
    stdio: 'inherit'
  });
  
  jest.on('close', (code) => {
    if (code === 0) {
      console.log('✅ Tests completed successfully!');
    } else {
      console.log(`❌ Tests failed with code ${code}`);
      process.exit(code || 1);
    }
  });
  
  jest.on('error', (error) => {
    console.error('❌ Test runner error:', error);
    process.exit(1);
  });
}

// Parse command line arguments
function parseArgs(): TestConfig {
  const args = process.argv.slice(2);
  const config: TestConfig = {
    watch: false,
    coverage: false,
    verbose: false
  };
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    switch (arg) {
      case '--watch':
      case '-w':
        config.watch = true;
        break;
      case '--coverage':
      case '-c':
        config.coverage = true;
        break;
      case '--verbose':
      case '-v':
        config.verbose = true;
        break;
      case '--help':
      case '-h':
        console.log(`
PDF Editor Test Runner

Usage: npm run test [--watch] [--coverage] [--verbose] [test-pattern]

Options:
  --watch, -w          Watch for file changes and re-run tests
  --coverage, -c       Collect coverage information
  --verbose, -v        Enable verbose logging
  --help, -h           Show this help message
  
Examples:
  npm run test                           # Run all tests once
  npm run test -- --watch                # Watch and re-run tests
  npm run test -- --coverage             # Run tests with coverage
  npm run test -- utils                  # Run tests matching "utils"
        `);
        process.exit(0);
        break;
      default:
        // Treat unrecognized arguments as test patterns
        if (!arg.startsWith('-')) {
          config.testPattern = arg;
        }
        break;
    }
  }
  
  return config;
}

// Main execution
if (require.main === module) {
  const config = parseArgs();
  runTests(config).catch((error) => {
    console.error('Fatal test runner error:', error);
    process.exit(1);
  });
}

export { runTests, TestConfig };