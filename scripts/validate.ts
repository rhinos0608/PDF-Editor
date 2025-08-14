#!/usr/bin/env node
/**
 * PDF Editor Validation Script
 * Validates the current state of the PDF Editor application
 */

import * as fs from 'fs';
import * as path from 'path';

// Configuration
const PROJECT_ROOT = path.resolve(__dirname, '..');
const SRC_DIR = path.join(PROJECT_ROOT, 'src');
const DIST_DIR = path.join(PROJECT_ROOT, 'dist');
const PACKAGE_JSON = path.join(PROJECT_ROOT, 'package.json');

interface ValidationResult {
  success: boolean;
  issues: string[];
  recommendations: string[];
  summary: string;
}

async function validateProjectStructure(): Promise<ValidationResult> {
  const result: ValidationResult = {
    success: true,
    issues: [],
    recommendations: [],
    summary: ''
  };

  console.log('🔍 Validating PDF Editor project structure...');

  // Check if package.json exists
  if (!fs.existsSync(PACKAGE_JSON)) {
    result.issues.push('❌ package.json not found');
    result.success = false;
  } else {
    console.log('✅ package.json found');
  }

  // Check if src directory exists
  if (!fs.existsSync(SRC_DIR)) {
    result.issues.push('❌ src directory not found');
    result.success = false;
  } else {
    console.log('✅ src directory found');
  }

  // Check if main process files exist
  const mainFiles = [
    path.join(SRC_DIR, 'main', 'main.ts'),
    path.join(SRC_DIR, 'main', 'preload.ts')
  ];

  for (const file of mainFiles) {
    if (!fs.existsSync(file)) {
      result.issues.push(`❌ Main process file not found: ${file}`);
      result.success = false;
    } else {
      console.log(`✅ Main process file found: ${path.relative(PROJECT_ROOT, file)}`);
    }
  }

  // Check if renderer files exist
  const rendererFiles = [
    path.join(SRC_DIR, 'renderer', 'App.tsx'),
    path.join(SRC_DIR, 'renderer', 'index.tsx')
  ];

  for (const file of rendererFiles) {
    if (!fs.existsSync(file)) {
      result.issues.push(`❌ Renderer file not found: ${file}`);
      result.success = false;
    } else {
      console.log(`✅ Renderer file found: ${path.relative(PROJECT_ROOT, file)}`);
    }
  }

  // Check if new state management files exist
  const stateFiles = [
    path.join(SRC_DIR, 'renderer', 'state', 'document', 'documentStore.ts'),
    path.join(SRC_DIR, 'renderer', 'state', 'ui', 'uiStore.ts'),
    path.join(SRC_DIR, 'renderer', 'state', 'app', 'appStore.ts'),
    path.join(SRC_DIR, 'renderer', 'state', 'rootStore.ts')
  ];

  for (const file of stateFiles) {
    if (!fs.existsSync(file)) {
      result.issues.push(`❌ State management file not found: ${file}`);
      result.success = false;
    } else {
      console.log(`✅ State management file found: ${path.relative(PROJECT_ROOT, file)}`);
    }
  }

  // Check if new utility files exist
  const utilFiles = [
    path.join(SRC_DIR, 'renderer', 'utils', 'safeArrayBuffer.ts')
  ];

  for (const file of utilFiles) {
    if (!fs.existsSync(file)) {
      result.issues.push(`❌ Utility file not found: ${file}`);
      result.success = false;
    } else {
      console.log(`✅ Utility file found: ${path.relative(PROJECT_ROOT, file)}`);
    }
  }

  // Check if new script files exist
  const scriptFiles = [
    path.join(PROJECT_ROOT, 'scripts', 'build.ts'),
    path.join(PROJECT_ROOT, 'scripts', 'dev.ts'),
    path.join(PROJECT_ROOT, 'scripts', 'test.ts')
  ];

  for (const file of scriptFiles) {
    if (!fs.existsSync(file)) {
      result.issues.push(`❌ Script file not found: ${file}`);
      result.success = false;
    } else {
      console.log(`✅ Script file found: ${path.relative(PROJECT_ROOT, file)}`);
    }
  }

  // Check if new test files exist
  const testFiles = [
    path.join(PROJECT_ROOT, '__tests__', 'integration', 'pdf-merging.test.ts')
  ];

  for (const file of testFiles) {
    if (!fs.existsSync(file)) {
      result.issues.push(`❌ Test file not found: ${file}`);
      result.success = false;
    } else {
      console.log(`✅ Test file found: ${path.relative(PROJECT_ROOT, file)}`);
    }
  }

  // Check if documentation files exist
  const docFiles = [
    path.join(PROJECT_ROOT, 'PRODUCTION_READINESS_PLAN.md')
  ];

  for (const file of docFiles) {
    if (!fs.existsSync(file)) {
      result.issues.push(`❌ Documentation file not found: ${file}`);
      result.success = false;
    } else {
      console.log(`✅ Documentation file found: ${path.relative(PROJECT_ROOT, file)}`);
    }
  }

  // Summary
  if (result.success) {
    result.summary = '✅ All required files found - project structure is valid';
  } else {
    result.summary = '❌ Project structure validation failed - missing required files';
  }

  return result;
}

async function validatePackageJson(): Promise<ValidationResult> {
  const result: ValidationResult = {
    success: true,
    issues: [],
    recommendations: [],
    summary: ''
  };

  console.log('\n🔍 Validating package.json...');

  try {
    const packageJsonContent = fs.readFileSync(PACKAGE_JSON, 'utf8');
    const packageJson = JSON.parse(packageJsonContent);

    // Check for required scripts
    const requiredScripts = [
      'start',
      'dev',
      'build',
      'test',
      'lint',
      'format'
    ];

    for (const script of requiredScripts) {
      if (!packageJson.scripts || !packageJson.scripts[script]) {
        result.issues.push(`❌ Required script not found: ${script}`);
        result.success = false;
      } else {
        console.log(`✅ Required script found: ${script}`);
      }
    }

    // Check for simplified scripts
    const simplifiedScripts = [
      'build:dev',
      'build:prod',
      'test:watch',
      'test:coverage'
    ];

    for (const script of simplifiedScripts) {
      if (!packageJson.scripts || !packageJson.scripts[script]) {
        result.recommendations.push(`⚠️  Recommended script not found: ${script}`);
      } else {
        console.log(`✅ Recommended script found: ${script}`);
      }
    }

    // Check for required dependencies
    const requiredDeps = [
      'react',
      'react-dom',
      'pdf-lib',
      'pdfjs-dist',
      'zustand'
    ];

    for (const dep of requiredDeps) {
      if ((!packageJson.dependencies || !packageJson.dependencies[dep]) &&
          (!packageJson.devDependencies || !packageJson.devDependencies[dep])) {
        result.issues.push(`❌ Required dependency not found: ${dep}`);
        result.success = false;
      } else {
        console.log(`✅ Required dependency found: ${dep}`);
      }
    }

    // Summary
    if (result.success) {
      result.summary = '✅ package.json is valid';
    } else {
      result.summary = '❌ package.json validation failed';
    }

  } catch (error: any) {
    result.issues.push(`❌ Failed to parse package.json: ${(error as Error).message}`);
    result.success = false;
    result.summary = '❌ package.json validation failed';
  }

  return result;
}

async function validateBuildSystem(): Promise<ValidationResult> {
  const result: ValidationResult = {
    success: true,
    issues: [],
    recommendations: [],
    summary: ''
  };

  console.log('\n🔍 Validating build system...');

  // Check if webpack config files exist
  const webpackConfigs = [
    path.join(PROJECT_ROOT, 'webpack.main.config.js'),
    path.join(PROJECT_ROOT, 'webpack.renderer.config.js')
  ];

  for (const config of webpackConfigs) {
    if (!fs.existsSync(config)) {
      result.issues.push(`❌ Webpack config not found: ${config}`);
      result.success = false;
    } else {
      console.log(`✅ Webpack config found: ${path.relative(PROJECT_ROOT, config)}`);
    }
  }

  // Check if tsconfig.json exists
  const tsconfig = path.join(PROJECT_ROOT, 'tsconfig.json');
  if (!fs.existsSync(tsconfig)) {
    result.issues.push('❌ tsconfig.json not found');
    result.success = false;
  } else {
    console.log('✅ tsconfig.json found');
  }

  // Check if jest config exists
  const jestConfig = path.join(PROJECT_ROOT, 'jest.config.js');
  if (!fs.existsSync(jestConfig)) {
    result.issues.push('❌ jest.config.js not found');
    result.success = false;
  } else {
    console.log('✅ jest.config.js found');
  }

  // Summary
  if (result.success) {
    result.summary = '✅ Build system is properly configured';
  } else {
    result.summary = '❌ Build system validation failed';
  }

  return result;
}

async function main() {
  console.log('🚀 PDF Editor Validation Script');
  console.log('================================');

  const results: ValidationResult[] = [];

  // Validate project structure
  results.push(await validateProjectStructure());

  // Validate package.json
  results.push(await validatePackageJson());

  // Validate build system
  results.push(await validateBuildSystem());

  // Overall summary
  console.log('\n📊 Validation Summary:');
  console.log('====================');

  let overallSuccess = true;
  let totalIssues = 0;
  let totalRecommendations = 0;

  for (const result of results) {
    console.log(result.summary);
    if (!result.success) {
      overallSuccess = false;
    }
    totalIssues += result.issues.length;
    totalRecommendations += result.recommendations.length;

    // Print issues
    if (result.issues.length > 0) {
      console.log('Issues:');
      for (const issue of result.issues) {
        console.log(`  ${issue}`);
      }
    }

    // Print recommendations
    if (result.recommendations.length > 0) {
      console.log('Recommendations:');
      for (const recommendation of result.recommendations) {
        console.log(`  ${recommendation}`);
      }
    }

    console.log('');
  }

  if (overallSuccess) {
    console.log('🎉 All validations passed!');
    console.log(`✅ ${results.length} validation checks completed successfully`);
    console.log(`💡 ${totalRecommendations} recommendations for improvement`);
  } else {
    console.log('❌ Some validations failed!');
    console.log(`❌ ${totalIssues} issues found`);
    console.log(`💡 ${totalRecommendations} recommendations for improvement`);
    process.exit(1);
  }

  console.log('\n📝 Next steps:');
  console.log('  1. Run "npm run build" to build the application');
  console.log('  2. Run "npm run dev" to start the development server');
  console.log('  3. Run "npm test" to run the test suite');
  console.log('  4. Run "npm run lint" to check for code quality issues');
}

// Run validation
if (require.main === module) {
  main().catch((error: any) => {
    console.error('_fatal validation error:', error);
    process.exit(1);
  });
}

export { validateProjectStructure, validatePackageJson, validateBuildSystem, main };