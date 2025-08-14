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

## Service APIs

The application should expose a number of services that can be used to interact with the application. These services should be designed to be modular and extensible, and they should be built on top of a `BaseService` class that provides common functionality, such as error handling and input validation.

### Core Services

The application should have the following core services:

*   **PDFService:** For PDF operations.
*   **AnnotationService:** For annotation handling.
*   **OCRService:** For OCR processing.
*   **SecurityService:** For security features.
*   **SearchService:** For search functionality.

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

The API uses a consistent error handling mechanism to ensure that errors are handled gracefully and that the user is always informed of what went wrong.

### Error Types

The API defines a number of custom error classes that are used to represent different types of errors.

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

The API uses a number of error handling patterns to ensure that errors are handled consistently.

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

## Security

The API is protected by a number of security measures to prevent unauthorized access and malicious attacks.

### Authentication

All API requests must be authenticated with a valid API key. The API key must be included in the `Authorization` header of the request.

### Authorization

The API uses a role-based access control (RBAC) system to authorize API requests. Each API key is assigned a role, and each role has a set of permissions. The API will only authorize requests that are made by users with the appropriate permissions.

### Input Validation

The API validates all input to prevent malicious attacks, such as SQL injection and cross-site scripting (XSS). The API uses a schema-based validation system to validate all input.

### Output Encoding

The API encodes all output to prevent cross-site scripting (XSS) attacks. The API uses a context-aware output encoding system to encode all output.

## Rate Limiting

The API is rate-limited to prevent abuse. The API uses a token bucket algorithm to rate-limit API requests. Each API key is assigned a bucket of tokens, and each API request consumes one token. If the bucket is empty, the API will return a `429 Too Many Requests` error.

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
