# API Reference

**Generated from TypeScript Types**  
**Version**: 0.1.0-alpha  
**Last Updated**: August 2025

---

## Overview

This document provides a comprehensive API reference for the Professional PDF Editor's TypeScript services and interfaces. The API is organized into service modules, each handling specific aspects of PDF manipulation and application functionality.

⚠️ **Note**: This is pre-alpha software. APIs are subject to change without notice.

---

## Core Services

### PDFService

The primary service for PDF document operations.

#### Class: `PDFService`

```typescript
class PDFService {
  // State Management
  private currentPDF: PDFDocument | null = null;
  private originalBytes: Uint8Array | null = null;
  private isModified: boolean = false;

  // Core Methods
  setCurrentPDF(pdfDoc: PDFDocument, originalBytes: Uint8Array): void;
  getCurrentPDF(): PDFDocument;
  markModified(): void;
  hasUnsavedChanges(): boolean;
  saveCurrentPDF(): Promise<Uint8Array>;
  
  // PDF Operations
  loadPDF(data: Uint8Array): Promise<PDFDocumentProxy>;
  createPDF(): Promise<PDFDocument>;
  mergePDFs(pdfBuffers: Uint8Array[]): Promise<Uint8Array>;
  splitPDF(pdfBytes: Uint8Array, splitPage: number): Promise<SplitResult>;
  
  // Document Manipulation
  addWatermark(pdfBytes: Uint8Array, text: string, options?: WatermarkOptions): Promise<Uint8Array>;
  addPageNumbers(pdfBytes: Uint8Array, options?: PageNumberOptions): Promise<Uint8Array>;
  rotatePage(pdfBytes: Uint8Array, pageIndex: number, degrees: number): Promise<Uint8Array>;
  
  // Form Operations
  createForm(): PDFForm;
}
```

#### Interfaces

```typescript
interface SplitResult {
  firstHalf: Uint8Array;
  secondHalf: Uint8Array;
  firstHalfPages: number;
  secondHalfPages: number;
}

interface WatermarkOptions {
  fontSize?: number;
  opacity?: number;
  rotation?: number;
  color?: { r: number; g: number; b: number };
}

interface PageNumberOptions {
  position?: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
  fontSize?: number;
  startPage?: number;
  format?: string;
}
```

---

### AnnotationService

Service for handling PDF annotations and drawing operations.

#### Class: `AnnotationService`

```typescript
class AnnotationService {
  // Annotation Management
  createAnnotation(type: AnnotationType, data: AnnotationData): Promise<Annotation>;
  updateAnnotation(id: string, data: Partial<AnnotationData>): Promise<Annotation>;
  deleteAnnotation(id: string): Promise<boolean>;
  getAnnotations(pageIndex?: number): Promise<Annotation[]>;
  
  // Drawing Operations
  addHighlight(pageIndex: number, rect: Rectangle, color: string): Promise<Annotation>;
  addTextAnnotation(pageIndex: number, position: Point, text: string): Promise<Annotation>;
  addDrawing(pageIndex: number, path: Point[], strokeOptions: StrokeOptions): Promise<Annotation>;
}
```

#### Types

```typescript
type AnnotationType = 'highlight' | 'text' | 'drawing' | 'stamp' | 'link';

interface Annotation {
  id: string;
  type: AnnotationType;
  pageIndex: number;
  data: AnnotationData;
  created: Date;
  modified: Date;
}

interface AnnotationData {
  position?: Point;
  bounds?: Rectangle;
  content?: string;
  style?: AnnotationStyle;
}

interface Point {
  x: number;
  y: number;
}

interface Rectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface StrokeOptions {
  color: string;
  width: number;
  opacity?: number;
}
```

---

### OCRService

Service for Optical Character Recognition operations.

#### Class: `OCRService`

```typescript
class OCRService {
  // OCR Operations
  extractText(imageData: ImageData | Uint8Array): Promise<OCRResult>;
  recognizeText(canvas: HTMLCanvasElement, options?: OCROptions): Promise<string>;
  
  // Language Management
  loadLanguage(languageCode: string): Promise<void>;
  getAvailableLanguages(): string[];
  
  // Progress Tracking
  onProgress(callback: (progress: OCRProgress) => void): void;
}
```

#### Types

```typescript
interface OCRResult {
  text: string;
  confidence: number;
  words: OCRWord[];
  lines: OCRLine[];
}

interface OCRWord {
  text: string;
  confidence: number;
  bbox: Rectangle;
}

interface OCRLine {
  text: string;
  confidence: number;
  words: OCRWord[];
  bbox: Rectangle;
}

interface OCROptions {
  language?: string;
  tessOptions?: Record<string, any>;
}

interface OCRProgress {
  status: string;
  progress: number;
}
```

---

### SearchService

Service for PDF content search and navigation.

#### Class: `SearchService`

```typescript
class SearchService {
  // Search Operations
  search(query: string, options?: SearchOptions): Promise<SearchResult[]>;
  findNext(): Promise<SearchResult | null>;
  findPrevious(): Promise<SearchResult | null>;
  
  // Highlighting
  highlightResults(results: SearchResult[]): void;
  clearHighlights(): void;
  
  // Navigation
  getCurrentResultIndex(): number;
  getTotalResults(): number;
}
```

#### Types

```typescript
interface SearchOptions {
  caseSensitive?: boolean;
  wholeWords?: boolean;
  regex?: boolean;
  pageRange?: { start: number; end: number };
}

interface SearchResult {
  text: string;
  pageIndex: number;
  position: Rectangle;
  context: string;
  index: number;
}
```

---

### SecurityService

Service for PDF security and encryption operations.

#### Class: `SecurityService`

```typescript
class SecurityService {
  // Encryption
  encryptPDF(pdfBytes: Uint8Array, password: string, permissions?: PDFPermissions): Promise<Uint8Array>;
  decryptPDF(pdfBytes: Uint8Array, password: string): Promise<Uint8Array>;
  
  // Permissions
  setPermissions(pdfBytes: Uint8Array, permissions: PDFPermissions): Promise<Uint8Array>;
  getPermissions(pdfBytes: Uint8Array): Promise<PDFPermissions>;
  
  // Validation
  isEncrypted(pdfBytes: Uint8Array): boolean;
  validatePassword(pdfBytes: Uint8Array, password: string): Promise<boolean>;
}
```

#### Types

```typescript
interface PDFPermissions {
  print?: boolean;
  modify?: boolean;
  copy?: boolean;
  annotate?: boolean;
  fillForms?: boolean;
  extractForAccessibility?: boolean;
  assemble?: boolean;
  printHighQuality?: boolean;
}
```

---

## Utility Functions

### PDF Utilities (`src/renderer/utils/pdfUtils.ts`)

```typescript
// Validation
function validatePDFBytes(pdfBytes: Uint8Array): boolean;

// Safe Operations
function createSafePDFBytes(data: Uint8Array): Uint8Array;
function createSafeArrayBuffer(uint8Array: Uint8Array): ArrayBuffer;

// Loading
function loadPDFSafely(data: Uint8Array, options?: any): Promise<PDFDocumentProxy>;
```

---

## Event System

### Application Events

```typescript
// Window Events
interface WindowEvents {
  'file-opened': (filePath: string) => void;
  'file-saved': (filePath: string) => void;
  'document-modified': () => void;
  'zoom-changed': (zoom: number) => void;
  'page-changed': (pageNumber: number) => void;
}

// PDF Events
interface PDFEvents {
  'pdf-loaded': (pdf: PDFDocumentProxy) => void;
  'pdf-error': (error: Error) => void;
  'annotation-added': (annotation: Annotation) => void;
  'annotation-updated': (annotation: Annotation) => void;
  'annotation-deleted': (annotationId: string) => void;
}
```

---

## Error Handling

### Error Types

```typescript
class PDFError extends Error {
  code: string;
  context?: any;
  
  constructor(message: string, code: string, context?: any);
}

class ValidationError extends PDFError {
  constructor(message: string, context?: any);
}

class SecurityError extends PDFError {
  constructor(message: string, context?: any);
}

class NetworkError extends PDFError {
  constructor(message: string, context?: any);
}
```

### Error Recovery

```typescript
interface ErrorInfo {
  errorType: string;
  userMessage: string;
  shouldRetry: boolean;
  technicalDetails: string;
}

function handlePDFOperationError(error: any, operation: string, context?: any): ErrorInfo;
```

---

## Configuration

### Application Configuration

```typescript
interface AppConfig {
  // Display Settings
  theme: 'light' | 'dark' | 'auto';
  zoom: {
    default: number;
    min: number;
    max: number;
    step: number;
  };
  
  // PDF Settings
  pdf: {
    enableWorker: boolean;
    workerSrc: string;
    cMapUrl: string;
    maxImageSize: number;
  };
  
  // Security Settings
  security: {
    enableSandbox: boolean;
    allowEval: boolean;
    cspLevel: 'strict' | 'moderate' | 'relaxed';
  };
}
```

---

## Development APIs

### Logger Service

```typescript
class Logger {
  debug(message: string, ...args: any[]): void;
  info(message: string, ...args: any[]): void;
  warn(message: string, ...args: any[]): void;
  error(message: string, error?: Error, ...args: any[]): void;
}
```

### Performance Monitoring

```typescript
interface PerformanceMetrics {
  startupTime: number;
  pdfLoadTime: number;
  renderTime: number;
  memoryUsage: number;
  operationCounts: Record<string, number>;
}

class PerformanceMonitor {
  startTiming(operation: string): string;
  endTiming(timerId: string): number;
  recordMetric(name: string, value: number): void;
  getMetrics(): PerformanceMetrics;
}
```

---

## Version Information

This API reference covers version **0.1.0-alpha** of the Professional PDF Editor. 

### Stability Guarantees

- 🚫 **Breaking Changes**: Expected in any release
- ⚠️ **API Compatibility**: Not guaranteed
- 🔄 **Interface Changes**: Likely during alpha phase
- 📝 **Documentation**: Updated with major changes

### Migration Notes

As this is pre-alpha software, migration guides will be provided starting with the beta release phase.

---

## Examples

### Basic PDF Loading

```typescript
const pdfService = new PDFService();
const fileBytes = await readFileAsBytes(filePath);
const pdfDocument = await pdfService.loadPDF(fileBytes);
pdfService.setCurrentPDF(pdfDocument, fileBytes);
```

### Adding Annotations

```typescript
const annotationService = new AnnotationService();
const highlight = await annotationService.addHighlight(
  0, // page index
  { x: 100, y: 200, width: 200, height: 20 },
  '#ffff00' // yellow
);
```

### Searching Content

```typescript
const searchService = new SearchService();
const results = await searchService.search('important text', {
  caseSensitive: false,
  wholeWords: true
});
```

---

*This API reference is automatically generated from TypeScript definitions and updated with each release. For the most current information, refer to the source code and inline documentation.*