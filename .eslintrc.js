module.exports = {
  root: true,
  env: {
    browser: true,
    node: true,
    es2022: true,
  },
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  plugins: [
    '@typescript-eslint',
    'react',
    'react-hooks',
  ],
  rules: {
    // General code quality
    'no-console': 'off',
    'no-debugger': 'warn',
    'no-unused-vars': 'off', // Use TypeScript version instead
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    'prefer-const': 'error',
    'no-var': 'error',
    'eqeqeq': 'error',
    'curly': 'error',

    // TypeScript specific
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-empty-function': 'warn',

    // React specific
    'react/jsx-uses-react': 'error',
    'react/jsx-uses-vars': 'error',
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',

    // Style (less strict for now)
    'semi': ['warn', 'always'],
    'quotes': ['warn', 'single', { allowTemplateLiterals: true, avoidEscape: true }],
  },
  ignorePatterns: [
    'dist/**/*',
    'node_modules/**/*',
    'archive/**/*',
    'build/**/*',
    '.jest-cache/**/*',
    '*.config.js',
    'dev-start.js',
    'build*.js',
    'webpack.*.js',
  ],
  overrides: [
    {
      files: ['src/main/**/*.{js,ts}'],
      env: {
        node: true,
        browser: false,
      },
      globals: {
        require: 'readonly',
        module: 'readonly',
        exports: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
      },
    },
    {
      files: ['src/renderer/**/*.{js,jsx,ts,tsx}'],
      env: {
        browser: true,
        node: false,
      },
      globals: {
        electronAPI: 'readonly',
      },
    },
    {
      files: ['**/*.test.{js,ts,tsx}', '**/*.spec.{js,ts,tsx}', 'tests/**/*'],
      env: {
        jest: true,
      },
      globals: {
        describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        jest: 'readonly',
      },
    },
  ],
};