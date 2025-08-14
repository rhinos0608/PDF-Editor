# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Primary Launch Commands

**One-click launch (Recommended):**
```batch
START.bat                # Main launcher with diagnostics
SMART-START.bat         # Intelligent launcher with auto-fix
EMERGENCY-START.bat     # Force start bypassing checks
```

**Development mode:**
```batch
RUN-DEV.bat            # Development mode launcher  
npm run start-dev      # Development with hot reload
npm run dev            # Webpack dev server
```

**Build commands:**
```bash
npm run build          # Main build command
node build-master-v5.js # Robust build with recovery
node build.js          # Standard build script
```

## Application Architecture

### Electron Multi-Process Structure
- **Main Process**: `src/main/main.ts` - Window management, IPC handlers, file operations, security
- **Preload Script**: `src/main/preload.ts` - Secure IPC bridge between main and renderer
- **Renderer Process**: `src/renderer/` - React application with PDF processing

### Technology Stack
- **Framework**: Electron 27 + React 18 + TypeScript 5
- **PDF Processing**: PDF.js (rendering) + pdf-lib (editing)
- **Build System**: Webpack with separate configs for each process
- **UI Framework**: Custom Adobe-style dark theme components
- **State Management**: React hooks with centralized app state

### Core Services Architecture
Located in `src/renderer/services/`:
- `PDFService.ts` - PDF manipulation, file I/O operations
- `AnnotationService.ts` - Drawing tools, highlights, text annotations
- `SearchService.ts` - Full-text search with result highlighting
- `OCRService.ts` - Text recognition using Tesseract.js
- `SecurityService.ts` - Document encryption, signatures, permissions

## Critical Build System Details

### Multi-Level Recovery System
The project implements a sophisticated build recovery cascade:

1. **Level 1**: Standard webpack build via npm scripts
2. **Level 2**: Direct build.js execution with error handling
3. **Level 3**: Emergency build using minimal dependencies
4. **Level 4**: Diagnostic mode that identifies and reports specific issues

### Build Output Structure
```
dist/
├── main/
│   ├── main.js       # Electron main process
│   └── preload.js    # Secure IPC bridge
└── renderer/
    ├── index.html    # Entry point with injected scripts
    ├── renderer.js   # React application bundle
    ├── vendors.js    # Node modules bundle
    └── pdfjs.js      # PDF.js library bundle
```

### Webpack Configuration Files
- `webpack.main.config.js` - Main process bundling with Node.js target
- `webpack.renderer.config.js` - Renderer React app with web target
- `webpack.preload.config.js` - Preload security bridge
- `webpack.simple.config.js` - Minimal fallback configuration

## GPU Handling and Performance

### GPU Acceleration Issues
The application has extensive GPU compatibility handling:
- Conditional GPU acceleration disable via environment variables
- Multiple fallback rendering strategies for different GPU configurations  
- Software rendering mode for systems with GPU driver issues
- Hardware acceleration flags for PDF.js rendering optimization

## IPC Communication Patterns

### Critical IPC Handlers
Main process must register these handlers after window creation:
- `open-file-dialog` - File picker and PDF loading
- `save-file-dialog` - Save dialog with path selection
- `save-file` - Write PDF data to file system
- `get-preferences` - Load user settings from electron-store
- `set-preferences` - Save user settings
- `add-recent-file` - Update recent files list

### Communication Flow
```
Renderer → preload.js → IPC → main.js → Response → preload.js → Renderer
```

## Known Issues and Recovery Strategies

### Common Build Problems
1. **Missing main.js**: Run `node build-master-v5.js --clean`
2. **IPC handlers not registered**: Check main process initialization
3. **White screen**: Verify webpack bundles are loading in renderer
4. **GPU errors**: Set `ELECTRON_DISABLE_GPU=1` environment variable

### Launch Issues Resolution
- **Primary**: Use `SMART-START.bat` for diagnostic-guided launch
- **Emergency**: Use `EMERGENCY-START.bat` for force start
- **Clean build**: Delete `dist/` folder and rebuild
- **Dependencies**: Run `FIX-DEPENDENCIES.bat` for npm issues

### Development Environment Setup
- Dev server runs on `http://localhost:8080`
- Fallbacks to built files if dev server unavailable
- Hot reload only works for renderer process (main requires restart)
- Mock electronAPI provided for web-only testing

## Security Configuration

- **Context Isolation**: Enabled with secure preload bridge
- **Sandbox Mode**: Enabled for renderer process security
- **CSP Headers**: Configured for PDF.js and local resources
- **Node Integration**: Disabled in renderer, enabled in main only
- **File System Access**: Restricted to specific whitelisted operations

## Suggestions Folder Insights

Based on the extensive documentation in `/suggestions/`:

### Build System Evolution
The project has evolved through 18+ iterations of build system improvements, with key patterns:
- **Recovery Cascade Pattern**: Multiple fallback strategies for failed builds
- **Diagnostic Intelligence**: Auto-detection and reporting of build issues  
- **User Experience First**: One-click solutions that hide complexity
- **Self-Healing Systems**: Automatic detection and repair of common issues

### Critical Success Patterns from Session Analytics
1. **IPC Registration Timing**: Handlers must be registered after window creation
2. **Memory Leak Prevention**: Remove existing listeners before adding new ones
3. **Path Resolution Intelligence**: Multiple search paths with graceful fallbacks
4. **Build Verification**: Comprehensive checking of output structure

### Grimoire Evolution Lessons
The project incorporates advanced patterns:
- **Complete IPC Setup Pattern**: Systematic handler registration and verification
- **Channel Health Checks**: Automated verification of IPC communication channels
- **Development Mode Handling**: Proper mock API setup for web-only testing
- **GPU Compatibility Matrix**: Extensive fallback strategies for hardware issues

## File Organization and Maintenance

### Critical Directories
```
src/
├── main/           # Electron main process code
├── renderer/       # React application code
│   ├── components/ # UI components with Adobe styling
│   ├── services/   # Business logic and PDF operations
│   └── styles/     # CSS with dark theme support
└── types/          # TypeScript definitions

dist/               # Built files (generated, not committed)
public/             # Static assets and icons
suggestions/        # Project evolution documentation and analytics
archive/            # Historical build scripts and deprecated files
```

### Development Best Practices
- Always test in both Electron and web environments
- Maintain Adobe design consistency across all components
- Use TypeScript strictly - resolve all compilation errors
- Test IPC communication after any main process changes
- Verify GPU compatibility on different hardware configurations

## Next Development Priorities

Based on session analytics, focus areas for continued development:
1. **Form Editor Implementation** - Visual form field creation and editing
2. **Digital Signature System** - Drawing pad, storage, certificate support
3. **Advanced OCR Integration** - Multi-language text recognition
4. **Performance Optimization** - Large PDF handling and memory management