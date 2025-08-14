# API Reference

## Table of Contents
- [Main Process APIs](#main-process-apis)
- [Renderer Process APIs](#renderer-process-apis)
- [IPC Communication](#ipc-communication)
- [Service APIs](#service-apis)
- [Component APIs](#component-apis)
- [Type Definitions](#type-definitions)
- [Event System](#event-system)
- [Error Handling](#error-handling)

## Main Process APIs

### Window Management

#### `createWindow(options?: WindowOptions): BrowserWindow`

Creates a new application window.

```typescript
interface WindowOptions {
  width?: number;
  height?: number;
  x?: number;
  y?: number;
  fullscreen?: boolean;
  resizable?: boolean;
  minimizable?: boolean;
  maximizable?: boolean;
  closable?: boolean;
  alwaysOnTop?: boolean;
  skipTaskbar?: boolean;
}

// Example
const mainWindow = createWindow({
  width: 1400,
  height: 900,
  resizable: true
});
```

#### `getWindowState(): WindowState`

Returns the current window state.

```typescript
interface WindowState {
  x: number;
  y: number;
  width: number;
  height: number;
  isMaximized: boolean;
  isMinimized: boolean;
  isFullScreen: boolean;
}

// Example
const state = getWindowState();
console.log(`Window position: ${state.x}, ${state.y}`);
```

### File Operations

#### `openFileDialog(options?: OpenDialogOptions): Promise<OpenDialogResult>`

Opens a file selection dialog.

```typescript
interface OpenDialogOptions {
  title?: string;
  defaultPath?: string;
  buttonLabel?: string;
  filters?: FileFilter[];
  properties?: OpenDialogProperty[];
}

interface OpenDialogResult {
  canceled: boolean;
  filePaths: string[];
  bookmarks?: string[];
}

// Example
const result = await openFileDialog({
  title: 'Select PDF',
  filters: [
    { name: 'PDF Files', extensions: ['pdf'] },
    { name: 'All Files', extensions: ['*'] }
  ],
  properties: ['openFile']
});
```

#### `saveFileDialog(options?: SaveDialogOptions): Promise<SaveDialogResult>`

Opens a save file dialog.

```typescript
interface SaveDialogOptions {
  title?: string;
  defaultPath?: string;
  buttonLabel?: string;
  filters?: FileFilter[];
  message?: string;
  nameFieldLabel?: string;
  showsTagField?: boolean;
}

interface SaveDialogResult {
  canceled: boolean;
  filePath?: string;
  bookmark?: string;
}

// Example
const result = await saveFileDialog({
  title: 'Save PDF',
  defaultPath: 'document.pdf',
  filters: [
    { name: 'PDF Files', extensions: ['pdf'] }
  ]
});
```

## Renderer Process APIs

### PDF Service API

#### `PDFService`

Main service for PDF operations.

```typescript
class PDFService {
  /**
   * Load a PDF from various sources
   */
  async loadPDF(
    source: Uint8Array | string | File
  ): Promise<PDFDocumentProxy>;
  
  /**
   * Save PDF with modifications
   */
  async savePDF(
    pdf: PDFDocument,
    options?: SaveOptions
  ): Promise<Uint8Array>;
  
  /**
   * Merge multiple PDFs into one
   */
  async mergePDFs(
    pdfs: Uint8Array[],
    options?: MergeOptions
  ): Promise<Uint8Array>;
  
  /**
   * Split PDF into multiple documents
   */
  async splitPDF(
    pdf: Uint8Array,
    ranges: PageRange[]
  ): Promise<Uint8Array[]>;
  
  /**
   * Compress PDF to reduce file size
   */
  async compressPDF(
    pdf: Uint8Array,
    quality: CompressionQuality
  ): Promise<Uint8Array>;
  
  /**
   * Rotate pages in a PDF
   */
  async rotatePage(
    pdf: Uint8Array,
    pageNum: number,
    degrees: number
  ): Promise<Uint8Array>;
  
  /**
   * Extract text from PDF
   */
  async extractText(
    pdf: PDFDocumentProxy,
    pageNum?: number
  ): Promise<string>;
  
  /**
   * Get PDF metadata
   */
  async getMetadata(
    pdf: PDFDocumentProxy
  ): Promise<PDFMetadata>;
  
  /**
   * Update PDF metadata
   */
  async setMetadata(
    pdf: Uint8Array,
    metadata: Partial<PDFMetadata>
  ): Promise<Uint8Array>;
}

// Usage Example
const pdfService = new PDFService();

// Load a PDF
const pdf = await pdfService.loadPDF(fileData);
console.log(`Loaded PDF with ${pdf.numPages} pages`);

// Merge PDFs
const merged = await pdfService.mergePDFs([pdf1, pdf2], {
  insertBookmarks: true,
  preserveFormFields: true
});

// Compress PDF
const compressed = await pdfService.compressPDF(pdfData, 'medium');
```

### Annotation Service API

#### `AnnotationService`

Service for managing PDF annotations.

```typescript
class AnnotationService {
  /**
   * Create a new annotation
   */
  createAnnotation(
    type: AnnotationType,
    page: number,
    position: Position,
    options: AnnotationOptions
  ): Annotation;
  
  /**
   * Update existing annotation
   */
  updateAnnotation(
    id: string,
    updates: Partial<Annotation>
  ): void;
  
  /**
   * Delete annotation
   */
  deleteAnnotation(id: string): void;
  
  /**
   * Get all annotations for a page
   */
  getPageAnnotations(pageNum: number): Annotation[];
  
  /**
   * Apply annotations to PDF
   */
  async applyAnnotationsToPDF(
    pdf: Uint8Array
  ): Promise<Uint8Array>;
  
  /**
   * Export annotations to JSON
   */
  exportAnnotations(): AnnotationData[];
  
  /**
   * Import annotations from JSON
   */
  importAnnotations(data: AnnotationData[]): void;
}

// Usage Example
const annotationService = new AnnotationService();

// Create highlight annotation
const highlight = annotationService.createAnnotation(
  'highlight',
  1,
  { x: 100, y: 200 },
  {
    color: '#FFFF00',
    opacity: 0.5,
    bounds: { width: 200, height: 20 }
  }
);

// Create text annotation
const comment = annotationService.createAnnotation(
  'text',
  1,
  { x: 300, y: 400 },
  {
    content: 'Important note here',
    author: 'John Doe',
    icon: 'Comment'
  }
);
```

### OCR Service API

#### `OCRService`

Service for optical character recognition.

```typescript
class OCRService {
  /**
   * Initialize OCR engine
   */
  async initialize(options?: OCROptions): Promise<void>;
  
  /**
   * Perform OCR on a PDF page
   */
  async performOCR(
    pdf: PDFDocumentProxy,
    pageNum: number,
    options?: OCRPageOptions
  ): Promise<OCRResult>;
  
  /**
   * Create searchable PDF
   */
  async createSearchablePDF(
    pdf: Uint8Array,
    options?: SearchableOptions
  ): Promise<Uint8Array>;
  
  /**
   * Set OCR language
   */
  setLanguage(language: string | string[]): void;
  
  /**
   * Get available languages
   */
  getAvailableLanguages(): string[];
  
  /**
   * Get OCR progress
   */
  getProgress(): OCRProgress;
}

// Usage Example
const ocrService = new OCRService();

// Initialize with language
await ocrService.initialize({
  languages: ['eng', 'fra', 'deu'],
  workerPath: './workers/'
});

// Perform OCR on page
const result = await ocrService.performOCR(pdf, 1, {
  granularity: 'word',
  includeConfidence: true
});

console.log(`Extracted text: ${result.text}`);
console.log(`Confidence: ${result.confidence}%`);
```

### Security Service API

#### `SecurityService`

Service for PDF security operations.

```typescript
class SecurityService {
  /**
   * Encrypt a PDF document
   */
  async encryptPDF(
    pdf: Uint8Array,
    password: string,
    options?: EncryptionOptions
  ): Promise<ServiceResult>;
  
  /**
   * Decrypt a PDF document
   */
  async decryptPDF(
    pdf: Uint8Array,
    password: string
  ): Promise<ServiceResult>;
  
  /**
   * Add digital signature
   */
  async addDigitalSignature(
    pdf: Uint8Array,
    signature: SignatureData
  ): Promise<ServiceResult>;
  
  /**
   * Verify digital signatures
   */
  async verifySignatures(
    pdf: Uint8Array
  ): Promise<SignatureVerification[]>;
  
  /**
   * Set document permissions
   */
  async setPermissions(
    pdf: Uint8Array,
    permissions: DocumentPermissions
  ): Promise<ServiceResult>;
  
  /**
   * Check document security
   */
  async checkSecurity(
    pdf: Uint8Array
  ): Promise<SecurityInfo>;
}

// Usage Example
const securityService = new SecurityService();

// Encrypt PDF
const encrypted = await securityService.encryptPDF(
  pdfData,
  'secretPassword',
  {
    algorithm: 'AES-256',
    permissions: {
      printing: 'highResolution',
      modifying: false,
      copying: true,
      annotating: true
    }
  }
);

// Add digital signature
const signed = await securityService.addDigitalSignature(
  pdfData,
  {
    certificate: certificateData,
    reason: 'Document approval',
    location: 'New York',
    contactInfo: 'john@example.com'
  }
);
```

### Search Service API

#### `SearchService`

Service for searching within PDFs.

```typescript
class SearchService {
  /**
   * Initialize search for a PDF
   */
  async initialize(pdf: PDFDocumentProxy): Promise<void>;
  
  /**
   * Search for text in the PDF
   */
  async search(
    query: string,
    options?: SearchOptions
  ): Promise<SearchResult[]>;
  
  /**
   * Get next search result
   */
  getNextResult(): SearchResult | null;
  
  /**
   * Get previous search result
   */
  getPreviousResult(): SearchResult | null;
  
  /**
   * Highlight search results
   */
  highlightResults(results: SearchResult[]): void;
  
  /**
   * Clear search highlights
   */
  clearHighlights(): void;
  
  /**
   * Get search statistics
   */
  getSearchStats(): SearchStatistics;
}

// Usage Example
const searchService = new SearchService();

// Initialize with PDF
await searchService.initialize(pdfDocument);

// Search with options
const results = await searchService.search('invoice', {
  caseSensitive: false,
  wholeWord: true,
  regex: false,
  searchAllPages: true
});

console.log(`Found ${results.length} matches`);
results.forEach(result => {
  console.log(`Page ${result.page}: "${result.text}"`);
});
```

## IPC Communication

### IPC Channels

#### Main Process Handlers

```typescript
// File operations
ipcMain.handle('open-file-dialog', async (event, options) => {
  const result = await dialog.showOpenDialog(options);
  return result;
});

ipcMain.handle('save-file-dialog', async (event, options) => {
  const result = await dialog.showSaveDialog(options);
  return result;
});

ipcMain.handle('save-file', async (event, path, data) => {
  await fs.writeFile(path, Buffer.from(data));
  return { success: true };
});

// Preferences
ipcMain.handle('get-preferences', () => {
  return store.get('preferences', defaultPreferences);
});

ipcMain.handle('set-preferences', (event, preferences) => {
  store.set('preferences', preferences);
  return { success: true };
});

// Recent files
ipcMain.handle('get-recent-files', () => {
  return store.get('recentFiles', []);
});

ipcMain.handle('add-recent-file', (event, filePath) => {
  const recentFiles = store.get('recentFiles', []);
  const updated = [filePath, ...recentFiles.filter(f => f !== filePath)].slice(0, 10);
  store.set('recentFiles', updated);
  return updated;
});
```

#### Renderer Process API

```typescript
// Exposed via preload script
interface ElectronAPI {
  // File operations
  openFile(): Promise<FileData | null>;
  saveFile(path: string, data: ArrayBuffer): Promise<SaveResult>;
  saveFileDialog(defaultPath?: string): Promise<string | null>;
  
  // Preferences
  getPreferences(): Promise<Preferences>;
  setPreferences(prefs: Partial<Preferences>): Promise<void>;
  
  // Recent files
  getRecentFiles(): Promise<string[]>;
  addRecentFile(path: string): Promise<string[]>;
  
  // Menu actions
  onMenuAction(callback: (action: string) => void): void;
  removeAllListeners(): void;
}

// Usage in renderer
const result = await window.electronAPI.openFile();
if (result) {
  console.log(`Opened: ${result.path}`);
  // Process result.data
}
```

## Component APIs

### PDFViewer Component

```typescript
interface PDFViewerProps {
  // Required props
  pdf: PDFDocumentProxy;
  currentPage: number;
  
  // Display options
  zoom?: number;
  rotation?: number;
  fitMode?: 'width' | 'height' | 'page';
  
  // Interaction
  currentTool?: string;
  isEditMode?: boolean;
  readOnly?: boolean;
  
  // Callbacks
  onPageChange?: (page: number) => void;
  onAnnotationAdd?: (annotation: Annotation) => void;
  onTextSelect?: (text: string, bounds: Rectangle) => void;
  onPDFUpdate?: (pdfBytes: Uint8Array) => void;
  
  // Data
  annotations?: Annotation[];
  searchResults?: SearchResult[];
  formFields?: FormField[];
}

// Usage
<PDFViewer
  pdf={pdfDocument}
  currentPage={1}
  zoom={100}
  rotation={0}
  currentTool="highlight"
  onPageChange={handlePageChange}
  onAnnotationAdd={handleAnnotationAdd}
  annotations={annotations}
/>
```

### Toolbar Component

```typescript
interface ToolbarProps {
  // Tool selection
  currentTool: string;
  availableTools?: string[];
  onToolChange: (tool: string) => void;
  
  // Zoom controls
  zoom: number;
  zoomLevels?: number[];
  onZoomChange: (zoom: number) => void;
  
  // File operations
  onOpenFile: () => void;
  onSaveFile: () => void;
  onPrint?: () => void;
  
  // State
  hasDocument: boolean;
  hasChanges?: boolean;
  isLoading?: boolean;
  
  // Customization
  customTools?: ToolDefinition[];
  layout?: 'horizontal' | 'vertical';
}

// Usage
<Toolbar
  currentTool={currentTool}
  onToolChange={setCurrentTool}
  zoom={zoom}
  onZoomChange={setZoom}
  onOpenFile={openPDF}
  onSaveFile={savePDF}
  hasDocument={!!currentPDF}
/>
```

## Type Definitions

### Core Types

```typescript
// PDF Types
interface PDFDocument {
  id: string;
  title: string;
  author?: string;
  subject?: string;
  keywords?: string[];
  creator?: string;
  producer?: string;
  creationDate?: Date;
  modificationDate?: Date;
  pages: number;
  size: number;
  version: string;
}

interface PDFPage {
  number: number;
  width: number;
  height: number;
  rotation: number;
  annotations: Annotation[];
  text?: string;
}

// Annotation Types
type AnnotationType = 
  | 'text'
  | 'highlight'
  | 'underline'
  | 'strikethrough'
  | 'drawing'
  | 'shape'
  | 'stamp'
  | 'signature';

interface Annotation {
  id: string;
  type: AnnotationType;
  page: number;
  position: Position;
  bounds: Rectangle;
  content?: string;
  author?: string;
  color?: string;
  opacity?: number;
  createdAt: Date;
  modifiedAt?: Date;
  replies?: AnnotationReply[];
}

interface Position {
  x: number;
  y: number;
}

interface Rectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

// Form Types
interface FormField {
  id: string;
  type: 'text' | 'checkbox' | 'radio' | 'dropdown' | 'signature';
  name: string;
  value?: any;
  page: number;
  bounds: Rectangle;
  required?: boolean;
  readOnly?: boolean;
  options?: string[];
  validation?: ValidationRule[];
}

// Security Types
interface EncryptionOptions {
  algorithm: 'AES-128' | 'AES-256' | 'RC4-128';
  permissions?: DocumentPermissions;
  ownerPassword?: string;
  userPassword?: string;
}

interface DocumentPermissions {
  printing?: 'none' | 'lowResolution' | 'highResolution';
  modifying?: boolean;
  copying?: boolean;
  annotating?: boolean;
  fillingForms?: boolean;
  contentAccessibility?: boolean;
  documentAssembly?: boolean;
}

interface SignatureData {
  certificate: Uint8Array;
  privateKey?: Uint8Array;
  reason?: string;
  location?: string;
  contactInfo?: string;
  name?: string;
  date?: Date;
  appearance?: SignatureAppearance;
}

// Search Types
interface SearchOptions {
  caseSensitive?: boolean;
  wholeWord?: boolean;
  regex?: boolean;
  searchAllPages?: boolean;
  maxResults?: number;
}

interface SearchResult {
  page: number;
  index: number;
  text: string;
  bounds: Rectangle;
  context?: string;
}

// OCR Types
interface OCROptions {
  languages?: string[];
  workerPath?: string;
  corePath?: string;
  langPath?: string;
}

interface OCRResult {
  text: string;
  confidence: number;
  words?: OCRWord[];
  lines?: OCRLine[];
  blocks?: OCRBlock[];
}

interface OCRWord {
  text: string;
  confidence: number;
  bounds: Rectangle;
  baseline: number;
}
```

## Event System

### Application Events

```typescript
// Main process events
app.on('ready', () => {
  console.log('Application ready');
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on('before-quit', (event) => {
  // Save application state
  saveApplicationState();
});
```

### Window Events

```typescript
// Window lifecycle events
mainWindow.on('ready-to-show', () => {
  mainWindow.show();
});

mainWindow.on('closed', () => {
  mainWindow = null;
});

mainWindow.on('unresponsive', () => {
  console.log('Window became unresponsive');
});

mainWindow.on('responsive', () => {
  console.log('Window became responsive again');
});

// Window state events
mainWindow.on('maximize', () => {
  mainWindow.webContents.send('window-maximized');
});

mainWindow.on('minimize', () => {
  mainWindow.webContents.send('window-minimized');
});

mainWindow.on('resize', () => {
  const bounds = mainWindow.getBounds();
  mainWindow.webContents.send('window-resized', bounds);
});
```

### Custom Events

```typescript
// Event emitter for custom events
import { EventEmitter } from 'events';

class PDFEventEmitter extends EventEmitter {
  // Emit custom events
  emitPageChange(pageNum: number): void {
    this.emit('page-change', pageNum);
  }
  
  emitAnnotationAdd(annotation: Annotation): void {
    this.emit('annotation-add', annotation);
  }
  
  emitDocumentLoad(pdf: PDFDocument): void {
    this.emit('document-load', pdf);
  }
  
  emitDocumentSave(path: string): void {
    this.emit('document-save', path);
  }
}

// Usage
const pdfEvents = new PDFEventEmitter();

pdfEvents.on('page-change', (pageNum) => {
  console.log(`Changed to page ${pageNum}`);
});

pdfEvents.on('annotation-add', (annotation) => {
  console.log(`Added annotation: ${annotation.type}`);
});
```

## Error Handling

### Error Types

```typescript
// Custom error classes
class PDFError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'PDFError';
  }
}

class ValidationError extends Error {
  constructor(
    message: string,
    public field: string,
    public value: any
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

class SecurityError extends Error {
  constructor(
    message: string,
    public operation: string
  ) {
    super(message);
    this.name = 'SecurityError';
  }
}

// Service result type
interface ServiceResult {
  success: boolean;
  data?: any;
  error?: string;
  code?: string;
}
```

### Error Handling Patterns

```typescript
// Try-catch with specific error handling
async function loadPDF(file: File): Promise<PDFDocument> {
  try {
    const data = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument(data).promise;
    return pdf;
  } catch (error) {
    if (error.name === 'InvalidPDFException') {
      throw new PDFError('Invalid PDF file', 'INVALID_PDF', error);
    } else if (error.name === 'PasswordException') {
      throw new SecurityError('PDF is password protected', 'PASSWORD_REQUIRED');
    } else {
      throw new PDFError('Failed to load PDF', 'LOAD_ERROR', error);
    }
  }
}

// Global error handler
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  
  // Show user-friendly error message
  showErrorNotification({
    title: 'An error occurred',
    message: getErrorMessage(event.reason),
    level: 'error'
  });
  
  // Log to error tracking service
  errorTracker.log(event.reason);
});

// IPC error handling
ipcMain.handle('risky-operation', async (event, args) => {
  try {
    const result = await performRiskyOperation(args);
    return { success: true, data: result };
  } catch (error) {
    logger.error('Operation failed:', error);
    return { 
      success: false, 
      error: error.message,
      code: error.code || 'UNKNOWN_ERROR'
    };
  }
});
```

## Usage Examples

### Complete PDF Editing Workflow

```typescript
// Initialize services
const pdfService = new PDFService();
const annotationService = new AnnotationService();
const securityService = new SecurityService();

// Load and edit PDF
async function editPDFWorkflow() {
  try {
    // 1. Open file dialog
    const fileResult = await window.electronAPI.openFile();
    if (!fileResult) return;
    
    // 2. Load PDF
    const pdf = await pdfService.loadPDF(fileResult.data);
    console.log(`Loaded PDF: ${pdf.numPages} pages`);
    
    // 3. Add annotations
    const highlight = annotationService.createAnnotation(
      'highlight',
      1,
      { x: 100, y: 200 },
      { color: '#FFFF00' }
    );
    
    // 4. Apply annotations
    const annotatedPDF = await annotationService.applyAnnotationsToPDF(
      fileResult.data
    );
    
    // 5. Encrypt if needed
    const encrypted = await securityService.encryptPDF(
      annotatedPDF,
      'password123',
      { algorithm: 'AES-256' }
    );
    
    // 6. Save the result
    const savePath = await window.electronAPI.saveFileDialog('edited.pdf');
    if (savePath) {
      await window.electronAPI.saveFile(savePath, encrypted.data);
      console.log('PDF saved successfully');
    }
  } catch (error) {
    console.error('PDF editing failed:', error);
    showErrorDialog(error.message);
  }
}
```

### Batch Processing Example

```typescript
async function batchProcessPDFs(files: File[]) {
  const results = [];
  
  for (const file of files) {
    try {
      // Load PDF
      const pdfData = await file.arrayBuffer();
      const pdf = await pdfService.loadPDF(pdfData);
      
      // Process based on requirements
      let processed = new Uint8Array(pdfData);
      
      // Add watermark
      processed = await addWatermark(processed, 'CONFIDENTIAL');
      
      // Compress
      processed = await pdfService.compressPDF(processed, 'high');
      
      // Encrypt
      const encrypted = await securityService.encryptPDF(
        processed,
        generatePassword()
      );
      
      results.push({
        file: file.name,
        success: true,
        output: encrypted.data
      });
    } catch (error) {
      results.push({
        file: file.name,
        success: false,
        error: error.message
      });
    }
  }
  
  return results;
}
```

---

This API reference provides comprehensive documentation for all major APIs in the Professional PDF Editor application. For implementation details and examples, refer to the source code and development guide.
