# Professional PDF Editor - Adobe-Class Documentation

## Table of Contents
1. [Overview](#overview)
2. [Core Features](#core-features)
3. [Architecture](#architecture)
4. [Technology Stack](#technology-stack)
5. [Installation & Setup](#installation--setup)
6. [User Guide](#user-guide)
7. [Developer Guide](#developer-guide)
8. [API Reference](#api-reference)
9. [Security](#security)
10. [Performance](#performance)
11. [Troubleshooting](#troubleshooting)

## Overview

The Professional PDF Editor is a comprehensive desktop application built with Electron, React, and TypeScript that provides Adobe-grade PDF editing capabilities. This application offers a professional dark-themed interface with advanced features including real-time text editing, annotations, OCR, digital signatures, and form management.

### Key Highlights

- **High Performance**: Optimized rendering engine with hardware acceleration
- **Enterprise Security**: Full encryption, digital signatures, and permission management
- **Professional UI**: Adobe-inspired dark theme with intuitive workflows
- **Cross-Platform**: Windows, macOS, and Linux support
- **Responsive Design**: Adaptive layout for various screen sizes
- **Extensible Architecture**: Service-based design for easy feature additions

## Core Features

### PDF Viewing & Navigation
- Smooth scrolling and zoom functionality
- Page navigation controls (first, previous, next, last)
- Thumbnail panel for quick page access
- Keyboard shortcuts for navigation

### Text Editing
- **Real PDF Text Editing**: Direct modification of actual PDF text content
- Text annotation tools
- Font and size customization
- Color selection for text elements

### Annotations
- Highlight, underline, and strikethrough tools
- Text notes and comments
- Drawing tools (freehand, shapes, arrows)
- Rectangle and circle annotations
- Ink and signature tools

### Page Management
- Insert and delete pages
- Rotate pages (90° increments)
- Reorder pages
- Split and merge PDFs
- Page numbering options

### Advanced Features
- **OCR (Optical Character Recognition)**: Extract text from scanned documents
- **Search & Replace**: Full-text search with context highlighting
- **Digital Signatures**: Add and verify digital signatures
- **Form Creation**: Create interactive PDF forms
- **Redaction**: Permanently remove sensitive content
- **Watermarking**: Add custom watermarks to documents
- **Bookmarks**: Create and manage document bookmarks
- **Compression**: Reduce file size while maintaining quality

### Export Options
- Export to text format
- Export to image formats (planned)
- Export to Word documents (planned)

## Architecture

### System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Professional PDF Editor                      │
├───────────────────────────┬─────────────────────────────────────┤
│      Main Process         │        Renderer Process             │
├───────────────────────────┼─────────────────────────────────────┤
│  • Electron Main          │  • React Application               │
│  • IPC Handlers           │  • UI Components                   │
│  • File System Access     │  • PDF Rendering                   │
│  • Native Dialogs         │  • User Interactions               │
│  • Window Management      │  • Service Layer                   │
│  • Security Controls      │  • Event Handling                  │
└───────────────────────────┴─────────────────────────────────────┘
                    ↑                    ↑
                    │     IPC Bridge     │
                    │    (Preload.js)    │
                    └────────────────────┘
```

### Component Architecture

1. **PDF Viewer Component**
   - Renders PDF pages using PDF.js
   - Handles text layer for selection
   - Manages annotation layer
   - Processes user interactions
   - Manages viewport transformations

2. **Toolbar Component**
   - Tool selection interface
   - Zoom controls
   - File operations
   - Quick actions

3. **Annotation Tools Component**
   - Annotation creation
   - Drawing tools
   - Text annotations
   - Shape tools

### Service Layer

1. **PDFService**
   - Load and parse PDF documents
   - Page manipulation (add, remove, rotate)
   - Document merging and splitting
   - Metadata management
   - Compression and optimization

2. **AnnotationService**
   - Create and manage annotations
   - Persist annotations to PDF
   - Import/export annotations
   - Annotation styling

3. **OCRService**
   - Text recognition from images
   - Multi-language support
   - Confidence scoring
   - Searchable PDF creation

4. **SecurityService**
   - PDF encryption/decryption
   - Digital signatures
   - Permission management
   - Certificate handling

5. **SearchService**
   - Full-text search across documents
   - Case-sensitive and regex search
   - Context highlighting
   - Search result navigation

## Technology Stack

### Core Technologies
- **Electron** (v27.3.11) - Desktop application framework
- **React** (v18.2.0) - UI library
- **TypeScript** (v5.9.2) - Type-safe JavaScript
- **PDF.js** (v3.11.0) - PDF rendering engine
- **pdf-lib** (v1.17.1) - PDF manipulation library

### UI & Styling
- **Material-UI** (v5.14.5) - Component library
- **React Toastify** (v9.1.3) - Notifications
- **FontAwesome** (v6.4.0) - Icon library
- **React Color** (v2.19.3) - Color picker

### Development Tools
- **Webpack** (v5.101.1) - Module bundler
- **Babel** (v7.28.0) - JavaScript compiler
- **ESLint** (v8.45.0) - Code linting
- **Jest** (v29.0.0) - Testing framework

### Additional Libraries
- **Tesseract.js** (v5.0.0) - OCR engine
- **Winston** (v3.10.0) - Logging
- **Electron Store** (v8.1.0) - Data persistence
- **Electron Updater** (v6.1.0) - Auto-updates

## Installation & Setup

### Prerequisites
- Node.js 18.0+
- npm 8.0+ or yarn 1.22+
- Git 2.30+

### Installation Steps

1. **Clone the Repository**
   ```bash
   git clone https://github.com/your-org/pdf-editor.git
   cd pdf-editor
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Development Setup**
   ```bash
   # Start development server with hot reload
   npm run dev
   
   # Or build and run
   npm run build
   npm start
   ```

4. **Production Build**
   ```bash
   # Create distributable packages
   npm run dist
   ```

## User Guide

### Quick Start

1. **First Time Setup**
   - Double-click `run-app.bat`
   - The script will automatically install dependencies and build the app
   - This may take a few minutes on first run

2. **Regular Use**
   - Just double-click `run-app.bat`
   - The app will start immediately if already built

### Toolbar Functions

#### File Operations
- **Open**: Load a PDF document
- **Save**: Save changes to the current document
- **Print**: Print the current document

#### Zoom Controls
- **Zoom In**: Increase magnification
- **Zoom Out**: Decrease magnification
- **Zoom Levels**: Select from predefined zoom percentages

#### Editing Tools
- **Select**: Default tool for navigation
- **Edit Text**: Direct editing of PDF text content
- **Add Text**: Add new text annotations
- **Highlight**: Highlight text selections
- **Draw**: Freehand drawing tool
- **Shapes**: Rectangle, circle, and arrow tools
- **Stamp**: Add stamp annotations
- **Signature**: Add digital signatures
- **Eraser**: Remove annotations
- **Note**: Add text notes
- **Link**: Add hyperlinks
- **Redact**: Permanently remove content
- **Watermark**: Add custom watermarks

### Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Open PDF | Ctrl+O |
| Save | Ctrl+S |
| Save As | Ctrl+Shift+S |
| Print | Ctrl+P |
| Undo | Ctrl+Z |
| Redo | Ctrl+Y |
| Find | Ctrl+F |
| Zoom In | Ctrl+Plus |
| Zoom Out | Ctrl+Minus |
| Reset Zoom | Ctrl+0 |
| Next Page | Page Down / → |
| Previous Page | Page Up / ← |
| First Page | Home |
| Last Page | End |
| Rotate Left | Ctrl+L |
| Rotate Right | Ctrl+R |
| Full Screen | F11 |

## Developer Guide

### Project Structure

```
pdf-editor/
├── src/
│   ├── main/                    # Main process (Node.js environment)
│   │   ├── main.ts             # Application entry point
│   │   └── preload.ts          # Preload script for IPC
│   │
│   ├── renderer/               # Renderer process (Browser environment)
│   │   ├── App.tsx             # Root React component
│   │   ├── index.tsx           # Renderer entry point
│   │   ├── components/         # React components
│   │   ├── services/          # Business logic services
│   │   ├── styles/             # CSS and styling
│   │   └── utils/              # Utility functions
│   │
│   └── types/                  # TypeScript type definitions
│
├── dist/                       # Built application
├── public/                      # Static assets
├── docs/                        # Documentation
└── config/                      # Configuration files
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

### Customization

#### Theming
The application supports both dark and light themes. Theme preferences are stored and can be toggled through the UI.

#### Adding New Features
1. Create new React components in `src/renderer/components/`
2. Implement business logic in `src/renderer/services/`
3. Add necessary styling in `src/renderer/styles/`
4. Register new tools in the toolbar component

## API Reference

### PDFService

#### Core Methods
```typescript
class PDFService {
  async loadPDF(data: Uint8Array): Promise<PDFDocumentProxy>
  async mergePDFs(pdfBuffers: Uint8Array[]): Promise<Uint8Array>
  async splitPDF(pdfBytes: Uint8Array, splitPage: number): Promise<{ first: Uint8Array; second: Uint8Array }>
  async rotatePages(pdfBytes: Uint8Array, rotation: number, pageNumbers?: number[]): Promise<Uint8Array>
  async compressPDF(pdfBytes: Uint8Array, quality: 'low' | 'medium' | 'high' = 'medium'): Promise<Uint8Array>
}
```

### AnnotationService

#### Core Methods
```typescript
class AnnotationService {
  createAnnotation(type: string, pageIndex: number, x: number, y: number, options: Partial<Annotation>): Annotation
  updateAnnotation(id: string, updates: Partial<Annotation>): Annotation | null
  deleteAnnotation(id: string): boolean
  applyAnnotationsToPDF(pdfBytes: Uint8Array): Promise<Uint8Array>
}
```

### OCRService

#### Core Methods
```typescript
class OCRService {
  async initialize(language: string = 'eng'): Promise<void>
  async performOCR(pdf: PDFDocumentProxy, pageNumber: number, language: string = 'eng'): Promise<OCRResult>
  async detectLanguage(pdf: PDFDocumentProxy, pageNumber: number): Promise<string>
}
```

## Security

### Security Features

1. **Context Isolation**
   - Enabled with secure preload bridge
   - Prevents renderer process access to Node.js APIs

2. **Content Security Policy (CSP)**
   - Strict policies for script, style, and resource loading
   - Prevents XSS attacks and unauthorized resource access

3. **PDF Encryption**
   - AES-256 encryption for sensitive documents
   - Password protection with strong hashing

4. **Digital Signatures**
   - PKI-based digital signatures
   - Certificate validation and verification

### Best Practices

1. Always validate user inputs
2. Use strong password requirements for encryption
3. Implement proper access controls
4. Regularly update dependencies
5. Audit code for security vulnerabilities

## Performance

### Optimization Techniques

1. **Virtual Scrolling**
   - Only render visible pages
   - Efficient memory usage for large documents

2. **Canvas Pooling**
   - Reuse canvas elements
   - Reduce garbage collection overhead

3. **Debouncing**
   - Throttle expensive operations
   - Improve UI responsiveness

4. **Web Workers**
   - Offload heavy processing
   - Prevent UI blocking

### Memory Management

1. **Page Caching**
   - Limited cache size
   - Automatic cleanup of unused pages

2. **Resource Cleanup**
   - Proper disposal of resources
   - Prevent memory leaks

## Troubleshooting

### Common Issues

#### PDF Loading Issues
- **Symptom**: "Failed to load PDF document"
- **Solution**: Check file permissions and ensure the file is not corrupted

#### OCR Processing Failures
- **Symptom**: "OCR processing failed"
- **Solution**: Ensure Tesseract.js is properly initialized and language data is available

#### Annotation Not Saving
- **Symptom**: Annotations disappear after saving
- **Solution**: Verify annotation service is properly applying annotations to PDF

#### Performance Issues
- **Symptom**: Slow rendering or UI lag
- **Solution**: Reduce zoom level, close unnecessary panels, or split large documents

### Support

For issues not covered in this documentation:
1. Check the error logs in the console (Ctrl+Shift+I)
2. Review the application logs in the logs directory
3. Submit an issue on the project repository

## Conclusion

The Professional PDF Editor provides a comprehensive solution for PDF document management with Adobe-grade features and a professional user interface. Its extensible architecture allows for easy addition of new features while maintaining high performance and security standards.