# Development Guide

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
ELECTRON_DISABLE_GPU=0
DEBUG=electron:*
REACT_APP_API_URL=http://localhost:3000
REACT_APP_LOG_LEVEL=debug
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

## Project Structure

### Source Code Organization

```
src/
├── main/                 # Main process (Node.js environment)
│   ├── main.ts          # Application entry point
│   ├── preload.ts       # Preload script for IPC
│   ├── handlers/        # IPC handlers
│   ├── services/        # Main process services
│   └── utils/           # Utility functions
│
├── renderer/            # Renderer process (Browser environment)
│   ├── App.tsx         # Root React component
│   ├── index.tsx       # Renderer entry point
│   ├── components/     # React components
│   │   ├── common/    # Shared components
│   │   ├── layout/    # Layout components
│   │   └── features/  # Feature-specific components
│   ├── services/      # Business logic services
│   ├── hooks/         # Custom React hooks
│   ├── store/         # State management
│   ├── styles/        # CSS and styling
│   └── utils/         # Utility functions
│
└── types/              # TypeScript type definitions
    ├── electron.d.ts  # Electron API types
    ├── global.d.ts    # Global type declarations
    └── services.d.ts  # Service type definitions
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

### TypeScript Guidelines

#### 1. Type Definitions

```typescript
// ✅ Good: Explicit types
interface PDFDocument {
  id: string;
  title: string;
  pages: number;
  metadata: DocumentMetadata;
}

function loadPDF(path: string): Promise<PDFDocument> {
  // Implementation
}

// ❌ Bad: Any types
function loadPDF(path: any): any {
  // Implementation
}
```

#### 2. Async/Await Pattern

```typescript
// ✅ Good: Async/await with error handling
async function processPDF(file: File): Promise<ProcessResult> {
  try {
    const data = await readFile(file);
    const pdf = await parsePDF(data);
    return { success: true, pdf };
  } catch (error) {
    logger.error('PDF processing failed', error);
    return { success: false, error: error.message };
  }
}

// ❌ Bad: Nested callbacks
function processPDF(file, callback) {
  readFile(file, (err, data) => {
    if (err) return callback(err);
    parsePDF(data, (err, pdf) => {
      if (err) return callback(err);
      callback(null, pdf);
    });
  });
}
```

### React Best Practices

#### 1. Component Structure

```typescript
// ✅ Good: Functional component with hooks
interface ToolbarProps {
  currentTool: string;
  onToolChange: (tool: string) => void;
}

const Toolbar: React.FC<ToolbarProps> = ({ currentTool, onToolChange }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const handleToolSelect = useCallback((tool: string) => {
    onToolChange(tool);
    setIsExpanded(false);
  }, [onToolChange]);
  
  return (
    <div className="toolbar">
      {/* Component JSX */}
    </div>
  );
};
```

#### 2. Custom Hooks

```typescript
// Custom hook for PDF operations
function usePDFOperations(initialPDF?: PDFDocument) {
  const [pdf, setPDF] = useState(initialPDF);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const loadPDF = useCallback(async (file: File) => {
    setLoading(true);
    setError(null);
    try {
      const loadedPDF = await pdfService.load(file);
      setPDF(loadedPDF);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, []);
  
  return { pdf, loading, error, loadPDF };
}
```

### CSS/Styling Guidelines

```scss
// ✅ Good: BEM naming convention
.pdf-viewer {
  &__canvas {
    width: 100%;
    height: auto;
  }
  
  &__controls {
    display: flex;
    gap: 1rem;
  }
  
  &--fullscreen {
    position: fixed;
    inset: 0;
  }
}

// ✅ Good: CSS Variables for theming
:root {
  --color-primary: #007bff;
  --color-secondary: #6c757d;
  --spacing-unit: 8px;
  --border-radius: 4px;
}

.button {
  background: var(--color-primary);
  padding: calc(var(--spacing-unit) * 2);
  border-radius: var(--border-radius);
}
```

## Build Process

### Development Build

```bash
# Build for development (with source maps)
npm run build:dev

# Watch mode for continuous building
npm run build:watch

# Build specific modules
npm run build:main    # Main process only
npm run build:renderer # Renderer process only
```

### Production Build

```bash
# Full production build
npm run build

# Platform-specific builds
npm run build:win    # Windows
npm run build:mac    # macOS
npm run build:linux  # Linux

# Build and package
npm run dist
```

### Build Configuration

#### Webpack Configuration Overview

```javascript
// webpack.renderer.config.js
module.exports = {
  mode: process.env.NODE_ENV || 'development',
  entry: {
    renderer: './src/renderer/index.tsx',
    vendors: ['react', 'react-dom', 'pdfjs-dist']
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      },
      {
        test: /\.(png|jpg|gif|svg|pdf)$/,
        use: ['file-loader']
      }
    ]
  },
  optimization: {
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vendors: {
          test: /[\\/]node_modules[\\/]/,
          priority: -10
        }
      }
    }
  }
};
```

## Testing

### Test Structure

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

### Building for Distribution

```bash
# Clean previous builds
npm run clean

# Build the application
npm run build

# Create distributable packages
npm run dist

# Platform-specific distributions
npm run dist:win    # Windows installer
npm run dist:mac    # macOS DMG
npm run dist:linux  # Linux AppImage
```

### Code Signing

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

### Auto-Update Configuration

```typescript
// main.ts - Auto-updater setup
import { autoUpdater } from 'electron-updater';

autoUpdater.setFeedURL({
  provider: 'github',
  owner: 'your-org',
  repo: 'pdf-editor'
});

autoUpdater.checkForUpdatesAndNotify();

autoUpdater.on('update-available', () => {
  dialog.showMessageBox({
    type: 'info',
    title: 'Update available',
    message: 'A new version is available. It will be downloaded in the background.',
    buttons: ['OK']
  });
});
```

### CI/CD Pipeline

#### GitHub Actions Workflow

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
