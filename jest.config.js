/**
 * Jest Configuration for Professional PDF Editor
 * Comprehensive testing setup with security-focused testing
 */

module.exports = {
  // Test environment
  testEnvironment: 'node',
  
  // Roots for test discovery
  roots: ['<rootDir>/__tests__', '<rootDir>/tests'],
  
  // Test file patterns
  testMatch: [
    '<rootDir>/__tests__/**/*.test.[jt]s',
    '<rootDir>/tests/**/*.test.[jt]s'
  ],
  
  // File extensions to consider
  moduleFileExtensions: ['js', 'jsx', 'json', 'ts', 'tsx'],
  
  // Transform files  
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
    '^.+\\.(js|jsx)$': 'babel-jest'
  },
  
  // TypeScript configuration
  preset: 'ts-jest',
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.json',
      isolatedModules: true
    }
  },
  
  // Module name mapping
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@main/(.*)$': '<rootDir>/src/main/$1',
    '^@renderer/(.*)$': '<rootDir>/src/renderer/$1',
    '^@common/(.*)$': '<rootDir>/src/common/$1'
  },
  
  // Setup files
  setupFilesAfterEnv: [
    '<rootDir>/tests/setup.js'
  ],
  
  // Coverage configuration
  collectCoverage: true,
  coverageDirectory: '<rootDir>/coverage',
  coverageReporters: [
    'text',
    'text-summary',
    'html',
    'lcov',
    'json'
  ],
  
  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    },
    // Higher thresholds for security-critical modules
    './src/main/': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90
    },
    './src/renderer/services/SecurityService.ts': {
      branches: 95,
      functions: 95,
      lines: 95,
      statements: 95
    }
  },
  
  // Files to collect coverage from
  collectCoverageFrom: [
    'src/**/*.{ts,tsx,js,jsx}',
    '!src/**/*.d.ts',
    '!src/**/index.ts',
    '!src/**/__tests__/**',
    '!src/**/*.test.{ts,tsx,js,jsx}',
    '!src/**/*.spec.{ts,tsx,js,jsx}',
    '!node_modules/**',
    '!dist/**',
    '!coverage/**'
  ],
  
  // Test environment variables
  testEnvironmentOptions: {
    NODE_ENV: 'test'
  },
  
  // Module directories
  moduleDirectories: ['node_modules', '<rootDir>'],
  
  // Files to ignore
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/coverage/',
    '/release/'
  ],
  
  // Transform ignore patterns
  transformIgnorePatterns: [
    'node_modules/(?!(pdfjs-dist|pdf-lib)/)'
  ],
  
  // Verbose output
  verbose: true,
  
  // Test timeout (30 seconds for e2e tests)
  testTimeout: 60000,
  
  // Report configuration
  reporters: ['default'],
  
  // Error handling
  errorOnDeprecated: true,
  
  // Cache
  cache: true,
  cacheDirectory: '<rootDir>/.jest-cache',
  
  // Clear mocks
  clearMocks: true,
  restoreMocks: true,
  
  // Notify on failures - disabled for CI
  notify: false,
  
  // Max worker processes
  maxWorkers: 1,
  
  // Force exit after tests complete
  forceExit: true
};