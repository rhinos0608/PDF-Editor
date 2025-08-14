# Development Guide

**Last Updated**: August 14, 2025  
**Enhanced With**: Electron Best Practices Research & Security Audit Findings  
**Status**: Pre-Alpha Development with Security Foundation

## Table of Contents
- [Prerequisites](#prerequisites)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Build Process](#build-process)
- [Testing](#testing)
- [Debugging](#debugging)
- [Performance Optimization](#performance-optimization)
- [Deployment](#deployment)

## Prerequisites

### ⚠️ Critical Security Requirements

Based on comprehensive Electron security research findings:

1. **Context Isolation**: MUST be enabled in all environments
2. **Node Integration**: MUST remain disabled, even during development
3. **IPC Validation**: ALL IPC messages must be validated
4. **CSP Headers**: Must be configured even in development
5. **Sandbox Mode**: Should be enabled for all renderer processes

### Required Software

| Software | Version | Purpose |
|----------|---------|---------|
| Node.js | 18.0+ | JavaScript runtime |
| npm/yarn | 8.0+/1.22+ | Package management |
| Git | 2.30+ | Version control |
| VS Code | Latest | Recommended IDE |
| Python | 3.8+ | Required for node-gyp |

### Recommended VS Code Extensions

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-typescript-tslint-plugin",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense",
    "burkeholland.simple-react-snippets",
    "msjsdiag.debugger-for-chrome"
  ]
}
```

## Development Setup

### 1. Clone the Repository

```bash
# Clone the repository
git clone https://github.com/your-org/pdf-editor.git
cd pdf-editor

# Create your feature branch
git checkout -b feature/your-feature-name
```

### 2. Install Dependencies

```bash
# Install all dependencies
npm install

# If you encounter issues with native modules
npm run rebuild

# Install global development tools (optional)
npm install -g electron typescript eslint
```

### 3. Environment Configuration

Create a `.env.development` file in the root directory:

```env
# Development Environment Variables
NODE_ENV=development
ELECTRON_IS_DEV=1
# GPU Settings - Based on hardware detection research
ELECTRON_DISABLE_GPU=0  # Set to 1 only if GPU issues detected
ELECTRON_FORCE_SOFTWARE_RENDERING=0
# Security Settings - NEVER change these
ELECTRON_ENABLE_CONTEXT_ISOLATION=1
ELECTRON_DISABLE_NODE_INTEGRATION=1
ELECTRON_ENABLE_SANDBOX=1
# Debugging
DEBUG=electron:*
REACT_APP_API_URL=http://localhost:3000
REACT_APP_LOG_LEVEL=debug
# Performance Monitoring
ELECTRON_ENABLE_PERFORMANCE_MONITORING=1
```

### 4. IDE Configuration

#### VS Code Settings (.vscode/settings.json)

```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "files.exclude": {
    "node_modules": true,
    "dist": false,
    ".git": true
  },
  "search.exclude": {
    "node_modules": true,
    "dist": true,
    "package-lock.json": true
  }
}
```

#### Launch Configuration (.vscode/launch.json)

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Electron: Main",
      "type": "node",
      "request": "launch",
      "protocol": "inspector",
      "runtimeExecutable": "${workspaceRoot}/node_modules/.bin/electron",
      "args": ["."],
      "preLaunchTask": "npm: build:dev",
      "env": {
        "NODE_ENV": "development"
      }
    },
    {
      "name": "Electron: Renderer",
      "type": "chrome",
      "request": "attach",
      "port": 9223,
      "webRoot": "${workspaceFolder}",
      "timeout": 30000
    }
  ],
  "compounds": [
    {
      "name": "Electron: All",
      "configurations": ["Electron: Main", "Electron: Renderer"]
    }
  ]
}
```

## Development Workflow

### Starting Development Server

```bash
# Start development server with hot reload
npm run dev

# Start main process only
npm run dev:main

# Start renderer process only
npm run dev:renderer

# Start with debugging enabled
DEBUG=* npm run dev
```

### Development Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run test` | Run all tests |
| `npm run lint` | Run ESLint |
| `npm run format` | Format code with Prettier |
| `npm run type-check` | Run TypeScript type checking |
| `npm run clean` | Clean build artifacts |

### Hot Module Replacement (HMR)

The development environment supports HMR for the renderer process:

```typescript
// Renderer process HMR setup
if (module.hot) {
  module.hot.accept('./App', () => {
    const NextApp = require('./App').default;
    ReactDOM.render(<NextApp />, document.getElementById('root'));
  });
}
```

## Coding Standards

The project follows the following coding standards:

*   **TypeScript:** All code should be written in TypeScript.
*   **React:** All UI components should be written in React.
*   **CSS:** All styles should be written in CSS, using the BEM naming convention.
*   **Linting:** All code should be linted with ESLint.
*   **Formatting:** All code should be formatted with Prettier.

## Build Process

The project uses webpack to build the application. The webpack configuration is located in the `webpack.config.js` file.

## Testing

The Professional PDF Editor uses a comprehensive testing strategy to ensure that the application is of high quality.

### Test Structure

The tests are organized into the following structure:

```
tests/
├── unit/              # Unit tests
│   ├── services/     # Service tests
│   └── utils/        # Utility tests
├── integration/       # Integration tests
│   ├── api/         # API integration tests
│   └── ipc/         # IPC communication tests
├── e2e/              # End-to-end tests
│   ├── features/    # Feature tests
│   └── workflows/   # User workflow tests
└── fixtures/         # Test fixtures and mocks
```

### Unit Tests

Unit tests are used to test the individual units of the application, such as the services and the utility functions. Unit tests are written using the Jest testing framework.

### Integration Tests

Integration tests are used to test the integration between the different parts of the application, such as the API and the IPC communication. Integration tests are written using the Jest testing framework.

### End-to-End Tests

End-to-end tests are used to test the complete user workflows of the application. End-to-end tests are written using the Playwright testing framework.

### Running Tests

```bash
# Run all tests
npm test

# Run specific test suites
npm run test:unit
npm run test:integration
npm run test:e2e

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

### Writing Tests

#### Unit Test Example

```typescript
// PDFService.test.ts
import { PDFService } from '../src/renderer/services/PDFService';

describe('PDFService', () => {
  let service: PDFService;
  
  beforeEach(() => {
    service = new PDFService();
  });
  
  describe('loadPDF', () => {
    it('should load a valid PDF file', async () => {
      const mockFile = new File(['pdf content'], 'test.pdf');
      const result = await service.loadPDF(mockFile);
      
      expect(result).toBeDefined();
      expect(result.numPages).toBeGreaterThan(0);
    });
    
    it('should throw error for invalid file', async () => {
      const invalidFile = new File(['invalid'], 'test.txt');
      
      await expect(service.loadPDF(invalidFile))
        .rejects.toThrow('Invalid PDF file');
    });
  });
});
```

#### Integration Test Example

```typescript
// IPC.test.ts
import { ipcMain, ipcRenderer } from 'electron';

describe('IPC Communication', () => {
  it('should handle file open dialog', async () => {
    const mockPath = '/path/to/file.pdf';
    
    ipcMain.handle('open-file-dialog', async () => {
      return { path: mockPath, data: Buffer.from('pdf data') };
    });
    
    const result = await ipcRenderer.invoke('open-file-dialog');
    expect(result.path).toBe(mockPath);
  });
});
```

#### End-to-End Test Example

```typescript
// app.spec.ts
import { test, expect } from '@playwright/test';

test.describe('PDF Editor', () => {
  test('should open a PDF file', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.click('#open-pdf-button');
    // ...
  });
});
```

## Debugging

### Main Process Debugging

```bash
# Start with Node inspector
npm run debug:main

# Connect Chrome DevTools to chrome://inspect
# Or use VS Code debugger
```

### Renderer Process Debugging

1. **DevTools**: Press `Ctrl+Shift+I` or `Cmd+Option+I`
2. **React DevTools**: Install browser extension
3. **Redux DevTools**: Configure for state debugging

### Logging

```typescript
// Use Winston logger
import { logger } from './utils/logger';

logger.info('Application started', { 
  version: app.getVersion(),
  platform: process.platform 
});

logger.error('PDF load failed', { 
  error: error.message,
  stack: error.stack 
});

// Development console logging
if (process.env.NODE_ENV === 'development') {
  console.log('[DEBUG]', 'Detailed debug info');
}
```

### Common Debugging Scenarios

#### 1. IPC Communication Issues

```typescript
// Add logging to IPC handlers
ipcMain.handle('test-handler', async (event, ...args) => {
  console.log('[IPC] Received:', 'test-handler', args);
  
  try {
    const result = await processRequest(args);
    console.log('[IPC] Sending:', result);
    return result;
  } catch (error) {
    console.error('[IPC] Error:', error);
    throw error;
  }
});
```

#### 2. PDF Rendering Issues

```typescript
// Enable PDF.js debugging
window.pdfjsLib.GlobalWorkerOptions.workerSrc = 
  './node_modules/pdfjs-dist/build/pdf.worker.js';

// Add verbose logging
pdfjsLib.GlobalWorkerOptions.verbosity = pdfjsLib.VerbosityLevel.INFOS;
```

## Performance Optimization

### Profiling Tools

1. **Chrome DevTools Performance Tab**
   - Record performance traces
   - Analyze render performance
   - Identify bottlenecks

2. **React Profiler**
   ```tsx
   import { Profiler } from 'react';
   
   <Profiler id="PDFViewer" onRender={onRenderCallback}>
     <PDFViewer {...props} />
   </Profiler>
   ```

3. **Electron Performance Monitor**
   ```javascript
   const { app } = require('electron');
   app.commandLine.appendSwitch('enable-precise-memory-info');
   ```

### Optimization Techniques

#### 1. Lazy Loading

```typescript
// Lazy load heavy components
const PDFEditor = React.lazy(() => import('./components/PDFEditor'));

// Use with Suspense
<Suspense fallback={<LoadingSpinner />}>
  <PDFEditor />
</Suspense>
```

#### 2. Memoization

```typescript
// Memoize expensive computations
const expensiveValue = useMemo(() => {
  return computeExpensiveValue(props.data);
}, [props.data]);

// Memoize components
const MemoizedComponent = React.memo(Component, (prevProps, nextProps) => {
  return prevProps.id === nextProps.id;
});
```

#### 3. Virtual Scrolling

```typescript
// Implement virtual scrolling for large PDFs
import { FixedSizeList } from 'react-window';

<FixedSizeList
  height={600}
  itemCount={pageCount}
  itemSize={850}
  width="100%"
>
  {({ index, style }) => (
    <PDFPage 
      pageNumber={index + 1} 
      style={style} 
    />
  )}
</FixedSizeList>
```

## Deployment

The Professional PDF Editor can be deployed to a variety of environments, including Windows, macOS, and Linux.

### Building for Distribution

To build the application for distribution, you can use the following command:

```bash
# Build the application for distribution
npm run dist
```

This will create a distributable package for your current platform in the `dist` directory.

### Code Signing

Code signing is the process of digitally signing your application to prove that it has not been tampered with. Code signing is required for distributing your application on Windows and macOS.

To sign your application, you will need to obtain a code signing certificate from a certificate authority (CA).

Once you have a code signing certificate, you can configure it in your `electron-builder.yml` file.

#### Windows Code Signing

```json
// electron-builder.yml
win:
  certificateFile: "./certs/windows.pfx"
  certificatePassword: "${WINDOWS_CERT_PASSWORD}"
  signingHashAlgorithms: ["sha256"]
```

#### macOS Code Signing

```json
// electron-builder.yml
mac:
  category: "public.app-category.productivity"
  hardenedRuntime: true
  gatekeeperAssess: false
  entitlements: "./build/entitlements.mac.plist"
  entitlementsInherit: "./build/entitlements.mac.plist"
  identity: "${APPLE_IDENTITY}"
```

### Auto-Update

The Professional PDF Editor uses the `electron-updater` library to automatically update the application.

To configure auto-updates, you will need to set the `publish` option in your `electron-builder.yml` file.

```json
// electron-builder.yml
publish: {
  provider: 'github',
  owner: 'your-org',
  repo: 'pdf-editor'
}
```

### CI/CD Pipeline

The Professional PDF Editor uses a CI/CD pipeline to automatically build, test, and deploy the application.

The CI/CD pipeline is configured in the `.github/workflows/build.yml` file.

```yaml
# .github/workflows/build.yml
name: Build and Release

on:
  push:
    tags:
      - 'v*'

jobs:
  build:
    runs-on: ${{ matrix.os }}
    
    strategy:
      matrix:
        os: [ubuntu-latest, windows-latest, macos-latest]
    
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test
      
      - name: Build application
        run: npm run build
      
      - name: Package application
        run: npm run dist
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
      
      - name: Upload artifacts
        uses: actions/upload-artifact@v2
        with:
          name: ${{ matrix.os }}-build
          path: dist/
```

## Code Quality

The Professional PDF Editor uses a number of tools to ensure that the code is of high quality.

### Linting

The project uses ESLint to lint the code. ESLint is a tool that analyzes the code for potential errors and style issues.

To run the linter, you can use the following command:

```bash
# Run the linter
npm run lint
```

### Formatting

The project uses Prettier to format the code. Prettier is a tool that automatically formats the code to ensure that it is consistent and easy to read.

To format the code, you can use the following command:

```bash
# Format the code
npm run format
```

### Type Checking

The project uses TypeScript to type-check the code. TypeScript is a tool that analyzes the code for type errors.

To type-check the code, you can use the following command:

```bash
# Type-check the code
npm run type-check
```

## Troubleshooting

### Common Issues and Solutions

#### 1. Native Module Compilation Errors

```bash
# Rebuild native modules for Electron
npm run rebuild

# Or manually rebuild
./node_modules/.bin/electron-rebuild

# For specific module
npm rebuild module-name --runtime=electron --target=27.3.11
```

#### 2. PDF.js Worker Issues

```javascript
// Ensure worker is properly configured
pdfjsLib.GlobalWorkerOptions.workerSrc = 
  process.env.NODE_ENV === 'development'
    ? '/node_modules/pdfjs-dist/build/pdf.worker.js'
    : './pdf.worker.min.js';
```

#### 3. Memory Leaks

```typescript
// Proper cleanup in React components
useEffect(() => {
  const subscription = service.subscribe(handler);
  
  return () => {
    subscription.unsubscribe();
    service.cleanup();
  };
}, []);
```

## Resources

### Documentation

- [Electron Documentation](https://www.electronjs.org/docs)
- [React Documentation](https://reactjs.org/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [PDF.js Documentation](https://mozilla.github.io/pdf.js/)
- [pdf-lib Documentation](https://pdf-lib.js.org/)

### Tools and Libraries

- [Electron Forge](https://www.electronforge.io/)
- [Electron Builder](https://www.electron.build/)
- [Spectron](https://www.electronjs.org/spectron) - Testing framework
- [Electron DevTools Installer](https://github.com/MarshallOfSound/electron-devtools-installer)

### Community

- [Electron Discord](https://discord.gg/electron)
- [Stack Overflow - Electron](https://stackoverflow.com/questions/tagged/electron)
- [Reddit - r/electronjs](https://www.reddit.com/r/electronjs/)

---

This development guide provides comprehensive information for working with the Professional PDF Editor codebase. For specific feature implementation, refer to the feature-specific documentation.
