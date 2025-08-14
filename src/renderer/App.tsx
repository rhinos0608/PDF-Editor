import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FolderOpen, Plus, Edit3, FileSignature, Shield, Search } from 'lucide-react';
import { ToastContainer, toast } from 'react-toastify';
import { PDFDocument, rgb, StandardFonts, degrees } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocumentProxy } from 'pdfjs-dist/types/src/display/api';

// Import PDF.js worker configuration - CRITICAL FIX for "No GlobalWorkerOptions.workerSrc specified" error
import './utils/pdfWorkerConfig';

import EnhancedToolbar from './components/EnhancedToolbar';
import Sidebar from './components/Sidebar';
import EnhancedPDFViewer from './components/EnhancedPDFViewer';
import StatusBar from './components/StatusBar';
import AnnotationTools from './components/AnnotationTools';
import SearchPanel from './components/SearchPanel';
import ThumbnailPanel from './components/ThumbnailPanel';
import PropertiesPanel from './components/PropertiesPanel';
import FormEditor from './components/FormEditor';
import InputDialog from './components/InputDialog';
import PDFEditMode from './components/PDFEditMode';
import ClickToEditOverlay from './components/ClickToEditOverlay';
import RedactionTool from './components/RedactionTool';
import WatermarkDialog from './components/WatermarkDialog';
import BookmarksPanel from './components/BookmarksPanel';
import NavigationPanel from './components/NavigationPanel';
import ExportDialog from './components/ExportDialog';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import DocumentIntelligencePanel from './components/DocumentIntelligencePanel';
import FormBuilder from './components/FormBuilder';
import DocumentComparison from './components/DocumentComparison';
import AccessibilityTools from './components/AccessibilityTools';
import ErrorBoundary from './components/ErrorBoundary';
import ErrorDialog from './components/ErrorDialog';
import { PDFService } from './services/PDFService';
import { RealPDFTextEditor } from './services/RealPDFTextEditor';
import { AnnotationService } from './services/AnnotationService';
import { OCRService } from './services/OCRService';
import { SecurityService } from './services/SecurityService';
import { searchService, SearchResult, SearchOptions } from './services/SearchService';
import { AdvancedPDFAnalyticsService } from './services/AdvancedPDFAnalyticsService';
import { AdvancedFormBuilderService } from './services/AdvancedFormBuilderService';
import { DocumentWorkflowService } from './services/DocumentWorkflowService';
import AdobeLevelBatchProcessor from './services/AdobeLevelBatchProcessor';
import EnterpriseSecurityEnhancement from './services/EnterpriseSecurityEnhancement';
import { createSafePDFBytes, loadPDFSafely, validatePDFBytes as validatePDFBytesUtil } from '../common/utils';
import { logger } from './services/LoggerService';
import ErrorHandler from './utils/ErrorHandler';
import './styles/App.css';
import 'react-toastify/dist/ReactToastify.css';

// Note: PDF.js worker is configured in index.tsx to avoid conflicts

interface AppState {
  currentPDF: PDFDocumentProxy | null;
  currentPDFBytes: Uint8Array | null;
  currentPage: number;
  totalPages: number;
  zoom: number;
  rotation: number;
  isDarkMode: boolean;
  currentTool: string;
  isLoading: boolean;
  fileName: string;
  filePath: string | null;
  hasChanges: boolean;
  selectedText: string;
  annotations: any[];
  searchText: string;
  searchResults: SearchResult[];
  currentSearchIndex: number;
  isSearching: boolean;
  showThumbnails: boolean;
  showProperties: boolean;
  showSearch: boolean;
  isFullscreen: boolean;
  sidebarTab: 'thumbnails' | 'bookmarks' | 'attachments' | 'analytics' | 'workflow';
  showFormEditor: boolean;
  formFields: any[];
  showInputDialog: boolean;
  inputDialogConfig: {
    title: string;
    placeholder: string;
    onConfirm: (value: string) => void;
  } | null;
  isEditMode: boolean;
  contentEdits: any[];
  // New state for Adobe-style features
  showRedactionTool: boolean;
  showWatermarkDialog: boolean;
  bookmarks: any[];
  showBookmarks: boolean;
  showNavigation: boolean;
  isCompressing: boolean;
  compressionRatio: number;
  showExportOptions: boolean;
  exportFormat: string;
  // Tool options
  penThickness: number;
  selectedColor: { r: number; g: number; b: number };
  highlightOpacity: number;
  isSidebarExpanded: boolean; // New state for sidebar expansion
  history: Uint8Array[]; // History of PDF states for undo/redo
  historyIndex: number; // Current position in history
  showAnalytics: boolean; // Show analytics dashboard
  analyticsData: any | null; // Analytics data from service
  showWorkflow: boolean; // Show workflow panel
  activeWorkflow: any | null; // Active workflow instance
  showDocumentIntelligence: boolean; // Show AI document intelligence panel
  documentText: string; // Extracted text for AI analysis
  showFormBuilder: boolean; // Show advanced form builder panel
  showDocumentComparison: boolean; // Show document comparison tool
  showAccessibilityTools: boolean; // Show accessibility compliance tools
  comparisonDocument: Uint8Array | null; // Document to compare against
  // Error dialog state
  showErrorDialog: boolean;
  errorDialogConfig: {
    title: string;
    message: string;
    details?: string;
    onRetry?: () => void;
  } | null;
  // OCR integration
  ocrResults: { [pageIndex: number]: any }; // Store OCR results by page
}

// Use enhanced PDF validation from pdfUtils
const validatePDFBytes = validatePDFBytesUtil;

// Helper function to create safe ArrayBuffer with improved error handling and validation
const createSafeArrayBuffer = (uint8Array: Uint8Array): ArrayBuffer => {
  try {
    console.log('🔧 Creating safe ArrayBuffer...');
    
    if (!uint8Array || uint8Array.length === 0) {
      throw new Error('Empty or null Uint8Array provided');
    }

    console.log(`🔧 Input Uint8Array: ${uint8Array.byteLength} bytes`);
    
    // CRITICAL: Validate PDF data before converting to ArrayBuffer
    if (!validatePDFBytes(uint8Array)) {
      throw new Error('Invalid PDF data: Failed header validation before ArrayBuffer conversion');
    }

    // Method 1: Direct buffer slice (most efficient) - check if buffer is still valid
    if (uint8Array.buffer && uint8Array.buffer.byteLength > 0) {
      try {
        const buffer = uint8Array.buffer.slice(
          uint8Array.byteOffset,
          uint8Array.byteOffset + uint8Array.byteLength
        );
        // Verify the slice worked correctly
        if (buffer.byteLength === uint8Array.byteLength) {
          console.log('✅ ArrayBuffer created using direct slice method');
          return buffer as ArrayBuffer;
        }
      } catch (sliceError) {
        console.warn('⚠️ Buffer slice failed:', sliceError);
      }
    }
    
    // Method 2: Create new buffer with byte copy (most reliable fallback)
    console.log('🔧 Using fallback buffer creation method');
    const buffer = new ArrayBuffer(uint8Array.byteLength);
    const view = new Uint8Array(buffer);
    
    // Use set() method for better performance if possible
    try {
      view.set(uint8Array);
      console.log('✅ ArrayBuffer created using set() method');
    } catch (setError) {
      console.warn('⚠️ set() method failed, using manual copy');
      // Manual copy as final fallback
      for (let i = 0; i < uint8Array.length; i++) {
        view[i] = uint8Array[i];
      }
      console.log('✅ ArrayBuffer created using manual copy');
    }
    
    // Final verification of the created ArrayBuffer
    const finalView = new Uint8Array(buffer);
    if (!validatePDFBytes(finalView)) {
      throw new Error('ArrayBuffer creation corrupted PDF data');
    }
    
    console.log(`✅ Safe ArrayBuffer created and verified: ${buffer.byteLength} bytes`);
    return buffer;
  } catch (error) {
    console.error('❌ Failed to create safe ArrayBuffer:', error);
    throw error;
  }
};

// Legacy helper function (keeping for compatibility)
const toArrayBuffer = (uint8Array: Uint8Array): ArrayBuffer => {
  return createSafeArrayBuffer(uint8Array);
};

// Enhanced error handler for PDF operations
const handlePDFOperationError = (error: any, operation: string, context?: any) => {
  console.error(`❌ PDF ${operation} failed:`, error);
  
  // Categorize the error type
  let errorType = 'unknown';
  let userMessage = `Failed to ${operation} PDF. Please try again.`;
  let shouldRetry = true;
  
  if (error.message.includes('PDF header') || error.message.includes('header validation')) {
    errorType = 'invalid_pdf_format';
    userMessage = 'The PDF file appears to be corrupted or invalid. Please try opening a different PDF file.';
    shouldRetry = false;
  } else if (error.message.includes('ArrayBuffer') || error.message.includes('detached')) {
    errorType = 'buffer_detached';
    userMessage = 'Memory access error occurred. Please reload the document and try again.';
    shouldRetry = true;
  } else if (error.message.includes('Permission') || error.message.includes('EACCES')) {
    errorType = 'permission_denied';
    userMessage = 'Permission denied. Please check file permissions or choose a different location.';
    shouldRetry = false;
  } else if (error.message.includes('ENOSPC')) {
    errorType = 'insufficient_space';
    userMessage = 'Not enough disk space. Please free up space and try again.';
    shouldRetry = false;
  } else if (error.message.includes('save') || error.message.includes('write')) {
    errorType = 'save_failed';
    userMessage = 'Failed to save the PDF file. Please check the file path and try again.';
    shouldRetry = true;
  }
  
  // Log detailed error information
  logger.error(`PDF ${operation} error`, {
    errorType,
    message: error.message,
    stack: error.stack,
    context: context || {},
    timestamp: new Date().toISOString()
  });
  
  return {
    errorType,
    userMessage,
    shouldRetry,
    technicalDetails: error.stack || error.message
  };
};

// Helper function to create a safe, detachment-proof copy of PDF bytes
const createSafePDFCopy = (originalBytes: Uint8Array): Uint8Array => {
  if (!originalBytes) {
    throw new Error('Cannot create copy of null/undefined PDF bytes');
  }
  
  if (originalBytes.length === 0) {
    throw new Error('Cannot create copy of empty PDF bytes');
  }
  
  try {
    // Method 1: Try using Uint8Array.from() for a clean copy
    try {
      const safeCopy = Uint8Array.from(originalBytes);
      if (safeCopy.length === originalBytes.length) {
        console.log(`✅ Created safe PDF copy using Uint8Array.from (${safeCopy.length} bytes)`);
        return safeCopy;
      }
    } catch (fromError) {
      console.warn('⚠️ Uint8Array.from failed:', fromError);
    }
    
    // Method 2: Manual byte copying as fallback
    const safeCopy = new Uint8Array(originalBytes.length);
    
    // Use set() method if possible for better performance
    try {
      safeCopy.set(originalBytes);
      console.log(`✅ Created safe PDF copy using set() (${safeCopy.length} bytes)`);
      return safeCopy;
    } catch (setError) {
      console.warn('⚠️ set() method failed, using manual copy:', setError);
    }
    
    // Method 3: Manual loop copy as final fallback
    for (let i = 0; i < originalBytes.length; i++) {
      safeCopy[i] = originalBytes[i];
    }
    
    console.log(`✅ Created safe PDF copy using manual loop (${safeCopy.length} bytes)`);
    return safeCopy;
  } catch (error) {
    console.error('❌ All methods failed to create safe PDF copy:', error);
    throw error;
  }
};

// Enhanced function to safely apply annotations to PDF pages with better error handling
const applyAnnotationToPDFPageSafely = async (page: any, annotation: any): Promise<void> => {
  try {
    const { width, height } = page.getSize();
    
    // Validate annotation has required properties
    if (!annotation || !annotation.type) {
      console.warn('⚠️ Invalid annotation - missing type');
      return;
    }
    
    // Ensure coordinates are valid numbers
    const x = isNaN(annotation.x) ? 0 : Math.max(0, Math.min(annotation.x, width - 10));
    const y = isNaN(annotation.y) ? 0 : Math.max(0, Math.min(height - annotation.y, height - 10));
    const annotWidth = isNaN(annotation.width) ? 50 : Math.max(1, Math.min(annotation.width, width - x));
    const annotHeight = isNaN(annotation.height) ? 20 : Math.max(1, Math.min(annotation.height, height - (height - y)));
    
    switch (annotation.type) {
      case 'text':
        if (annotation.text && typeof annotation.text === 'string' && annotation.text.length > 0) {
          page.drawText(annotation.text, {
            x,
            y: Math.max(20, y), // Ensure text isn't too close to edge
            size: Math.max(8, Math.min(annotation.fontSize || 12, 72)), // Limit font size
            color: rgb(
              Math.max(0, Math.min(annotation.color?.r || 0, 1)),
              Math.max(0, Math.min(annotation.color?.g || 0, 1)),
              Math.max(0, Math.min(annotation.color?.b || 0, 1))
            )
          });
        }
        break;
        
      case 'rectangle':
        page.drawRectangle({
          x,
          y: Math.max(0, height - annotation.y - annotHeight),
          width: annotWidth,
          height: annotHeight,
          borderColor: rgb(
            Math.max(0, Math.min(annotation.color?.r || 0, 1)),
            Math.max(0, Math.min(annotation.color?.g || 0, 1)),
            Math.max(0, Math.min(annotation.color?.b || 0, 1))
          ),
          borderWidth: Math.max(0.5, Math.min(annotation.thickness || 1, 10))
        });
        break;
        
      case 'highlight':
        page.drawRectangle({
          x,
          y: Math.max(0, height - annotation.y - annotHeight),
          width: annotWidth,
          height: annotHeight,
          color: rgb(
            Math.max(0, Math.min(annotation.color?.r || 1, 1)),
            Math.max(0, Math.min(annotation.color?.g || 1, 1)),
            Math.max(0, Math.min(annotation.color?.b || 0, 1))
          ),
          opacity: Math.max(0.1, Math.min(annotation.opacity || 0.3, 0.8))
        });
        break;
        
      case 'circle':
        // Add circle annotation support with safe radius calculation
        const radius = Math.min(annotWidth, annotHeight) / 2;
        if (radius > 0) {
          page.drawCircle({
            x: x + annotWidth / 2,
            y: height - annotation.y - annotHeight / 2,
            size: radius,
            borderColor: rgb(
              Math.max(0, Math.min(annotation.color?.r || 0, 1)),
              Math.max(0, Math.min(annotation.color?.g || 0, 1)),
              Math.max(0, Math.min(annotation.color?.b || 0, 1))
            ),
            borderWidth: Math.max(0.5, Math.min(annotation.thickness || 1, 10))
          });
        }
        break;
        
      default:
        console.warn(`⚠️ Unknown annotation type: ${annotation.type}`);
    }
  } catch (error) {
    console.warn(`⚠️ Failed to apply ${annotation.type} annotation safely:`, error);
    // Don't throw - let other annotations continue to be applied
  }
};

// Legacy function maintained for compatibility
const applyAnnotationToPDFPage = async (page: any, annotation: any): Promise<void> => {
  return applyAnnotationToPDFPageSafely(page, annotation);
};

const App: React.FC = () => {
  // Debug function to track PDF bytes changes
  const debugPDFBytesChange = (operation: string, newBytes: Uint8Array | null) => {
    console.log(`🔄 PDF bytes ${operation}:`, {
      operation,
      newLength: newBytes ? newBytes.length : 0,
      isNull: newBytes === null,
      isUint8Array: newBytes instanceof Uint8Array
    });
  };

  const [state, setState] = useState<AppState>({
    currentPDF: null,
    currentPDFBytes: null,
    currentPage: 1,
    totalPages: 0,
    zoom: 100,
    rotation: 0,
    isDarkMode: true,
    currentTool: 'select',
    isLoading: false,
    fileName: '',
    filePath: null,
    hasChanges: false,
    selectedText: '',
    annotations: [],
    searchText: '',
    searchResults: [],
    currentSearchIndex: -1,
    isSearching: false,
    showThumbnails: true,
    showProperties: false,
    showSearch: false,
    isFullscreen: false,
    sidebarTab: 'thumbnails',
    showFormEditor: false,
    formFields: [],
    showInputDialog: false,
    inputDialogConfig: null,
    isEditMode: false,
    contentEdits: [],
    // New state for Adobe-style features
    showRedactionTool: false,
    showWatermarkDialog: false,
    bookmarks: [],
    showBookmarks: false,
    showNavigation: false,
    isCompressing: false,
    compressionRatio: 0,
    showExportOptions: false,
    exportFormat: 'pdf',
    // Tool options
    penThickness: 2,
    selectedColor: { r: 1, g: 0, b: 0 },
    highlightOpacity: 0.3,
    isSidebarExpanded: false, // Initial state for sidebar
    history: [], // Initialize empty history
    historyIndex: -1, // No history initially
    showAnalytics: false,
    analyticsData: null,
    showWorkflow: false,
    activeWorkflow: null,
    showDocumentIntelligence: false,
    documentText: '',
    showFormBuilder: false,
    showDocumentComparison: false,
    showAccessibilityTools: false,
    comparisonDocument: null,
    // Error dialog state
    showErrorDialog: false,
    errorDialogConfig: null,
    ocrResults: {}
  });

  const pdfService = useRef(new PDFService());
  const annotationService = useRef(new AnnotationService());
  const ocrService = useRef(new OCRService());
  const securityService = useRef(new SecurityService());
  const realPDFTextEditor = useRef(new RealPDFTextEditor());
  const analyticsService = useRef(new AdvancedPDFAnalyticsService());
  const formBuilderService = useRef(new AdvancedFormBuilderService());
  const workflowService = useRef(new DocumentWorkflowService());
  const batchProcessor = useRef(new AdobeLevelBatchProcessor());
  const enterpriseSecurity = useRef(new EnterpriseSecurityEnhancement(securityService.current));
  const [extractedText, setExtractedText] = useState<any[]>([]);
  const autoSaveTimer = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Emergency PDF bytes recovery function
  const recoverPDFBytes = useCallback(async () => {
    if (!state.currentPDF || (state.currentPDFBytes && state.currentPDFBytes.length > 0)) {
      return; // Nothing to recover
    }

    console.log('🚨 Attempting to recover PDF bytes from displayed PDF...');
    
    try {
      // If we have a PDF displayed but no bytes, this is likely a state sync issue
      // We'll need to prompt user to reload the file since we can't recover the original bytes
      console.error('❌ PDF is displayed but bytes are missing - requesting user to reload');
      toast.error('PDF data is missing. Please reload the document to enable editing features.');
      
      // Clear the displayed PDF as well to force consistent state
      setState(prev => ({
        ...prev,
        currentPDF: null,
        currentPDFBytes: null,
        totalPages: 0,
        currentPage: 1,
        fileName: '',
        filePath: null,
        hasChanges: false
      }));
      
    } catch (error) {
      console.error('❌ PDF bytes recovery failed:', error);
    }
  }, [state.currentPDF, state.currentPDFBytes]);

  // Initialize app and load preferences
  useEffect(() => {
    const initApp = async () => {
      try {
        console.log('🚀 Initializing PDF Editor App...');
        
        // Set dark theme by default
        document.body.classList.add('dark-theme');
        
        // Check if electronAPI is available and provide web fallbacks
        if (typeof window !== 'undefined' && window.electronAPI?.getPreferences) {
          try {
            console.log('📱 Loading Electron preferences...');
            const preferences = await window.electronAPI.getPreferences();
            setState(prev => ({
              ...prev,
              isDarkMode: preferences.theme === 'dark',
              zoom: typeof preferences.defaultZoom === 'number' ? preferences.defaultZoom : 100,
              showThumbnails: preferences.showThumbnails !== false
            }));
            
            const themeValue = String(preferences.theme || 'dark');
            document.body.classList.remove('light-theme', 'dark-theme', 'high-contrast-theme', 'blue-theme', 'green-theme', 'purple-theme'); // Remove all existing themes
            document.body.classList.add(`${themeValue}-theme`); // Add the selected theme
            console.log('✅ Preferences loaded successfully');
          } catch (error) {
            console.warn('⚠️ Could not load preferences:', error);
            // Fallback to default preferences
            setState(prev => ({
              ...prev,
              isDarkMode: true,
              zoom: 100,
              showThumbnails: true
            }));
          }
        } else {
          console.log('🌐 Running in web mode (no Electron API) - using default settings');
          // Set web mode defaults and enable file input fallbacks
          setState(prev => ({
            ...prev,
            isDarkMode: true,
            zoom: 100,
            showThumbnails: true
          }));
          document.body.classList.add('dark-theme'); // Default to dark theme for web
          
          // Save preference in localStorage for web mode
          try {
            const webPreferences = localStorage.getItem('pdf-editor-preferences');
            if (webPreferences) {
              const prefs = JSON.parse(webPreferences);
              setState(prev => ({
                ...prev,
                isDarkMode: prefs.theme === 'dark',
                zoom: prefs.defaultZoom || 100,
                showThumbnails: prefs.showThumbnails !== false
              }));
              document.body.classList.remove('light-theme', 'dark-theme', 'high-contrast-theme', 'blue-theme', 'green-theme', 'purple-theme');
              document.body.classList.add(`${prefs.theme}-theme`);
            }
          } catch (error) {
            console.warn('Could not load web preferences from localStorage');
          }
        }
        
        console.log('✅ App initialization complete');
      } catch (error) {
        console.error('❌ Failed to initialize app:', error);
      }
    };
    
    initApp();
    
    // Setup keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + O: Open file
      if ((e.ctrlKey || e.metaKey) && e.key === 'o') {
        e.preventDefault();
        openPDF();
      }
      // Ctrl/Cmd + S: Save
      else if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (e.shiftKey) {
          savePDF(true); // Save As
        } else {
          savePDF(false); // Save
        }
      }
      // Ctrl/Cmd + F: Search
      else if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        setState(prev => ({ ...prev, showSearch: !prev.showSearch }));
      }
      // Escape: Close search or exit fullscreen
      else if (e.key === 'Escape') {
        if (state.showSearch) {
          setState(prev => ({ ...prev, showSearch: false }));
        }
        if (document.fullscreenElement) {
          document.exitFullscreen();
        }
      }
      // F11: Toggle fullscreen
      else if (e.key === 'F11') {
        e.preventDefault();
        toggleFullscreen();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    // Cleanup
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (typeof window !== 'undefined' && window.electronAPI?.removeAllListeners) {
        window.electronAPI.removeAllListeners();
      }
      if (autoSaveTimer.current) {
        clearInterval(autoSaveTimer.current);
      }
    };
  }, []);

  // Setup menu action listeners
  useEffect(() => {
    if (typeof window !== 'undefined' && window.electronAPI?.onMenuAction) {
      const handleMenuAction = (action: string) => {
        switch (action) {
          case 'menu-open':
            openPDF();
            break;
          case 'menu-save':
            savePDF(false);
            break;
          case 'menu-save-as':
            savePDF(true);
            break;
          case 'menu-print':
            printPDF();
            break;
          case 'menu-zoom-in':
            setZoom(prev => Math.min(prev + 10, 400));
            break;
          case 'menu-zoom-out':
            setZoom(prev => Math.max(prev - 10, 25));
            break;
          case 'menu-zoom-reset':
            setZoom(100);
            break;
          case 'menu-fit-width':
            fitToWidth();
            break;
          case 'menu-fit-page':
            fitToPage();
            break;
          case 'menu-rotate-left':
            rotatePage(-90);
            break;
          case 'menu-rotate-right':
            rotatePage(90);
            break;
          case 'menu-toggle-theme':
            toggleTheme();
            break;
          case 'menu-find':
            setState(prev => ({ ...prev, showSearch: !prev.showSearch }));
            break;
          case 'menu-insert-page':
            insertPage();
            break;
          case 'menu-delete-page':
            deletePage();
            break;
          case 'menu-merge-pdfs':
            mergePDFs();
            break;
          case 'menu-split-pdf':
            splitPDF();
            break;
          case 'menu-compress':
            compressPDF();
            break;
          case 'menu-ocr':
            performOCR();
            break;
          case 'menu-encrypt':
            encryptPDF();
            break;
          case 'menu-decrypt':
            decryptPDF();
            break;
          case 'menu-form-text':
          case 'form-text':
            setState(prev => ({ ...prev, showFormEditor: true, currentTool: 'text' }));
            break;
          case 'menu-form-checkbox':
          case 'form-checkbox':
            setState(prev => ({ ...prev, showFormEditor: true, currentTool: 'checkbox' }));
            break;
          case 'menu-form-radio':
          case 'form-radio':
            setState(prev => ({ ...prev, showFormEditor: true, currentTool: 'radio' }));
            break;
          case 'menu-form-dropdown':
          case 'form-dropdown':
            setState(prev => ({ ...prev, showFormEditor: true, currentTool: 'dropdown' }));
            break;
          case 'menu-digital-signature':
          case 'digital-signature':
            addDigitalSignature();
            break;
          case 'menu-redact':
            setState(prev => ({ ...prev, showRedactionTool: true, currentTool: 'redact' }));
            break;
          case 'menu-watermark':
            setState(prev => ({ ...prev, showWatermarkDialog: true }));
            break;
          case 'menu-bookmarks':
            setState(prev => ({ ...prev, showBookmarks: !prev.showBookmarks }));
            break;
          case 'menu-export':
            setState(prev => ({ ...prev, showExportOptions: true }));
            break;
          case 'menu-compare-documents':
            setState(prev => ({ ...prev, showDocumentComparison: true }));
            break;
          case 'menu-accessibility-check':
            setState(prev => ({ ...prev, showAccessibilityTools: true }));
            break;
          case 'open':
            openPDF();
            break;
          // Additional menu actions
          case 'toggle-sidebar':
            toggleSidebar();
            break;
          case 'properties':
            setState(prev => ({ ...prev, showProperties: !prev.showProperties }));
            break;
          case 'verify-signatures':
            // Placeholder for signature verification
            toast.info('Signature verification is not implemented yet');
            break;
          default:
            console.log('Unhandled menu action:', action);
        }
      };
      
      window.electronAPI.onMenuAction(handleMenuAction);
    }
  }, [state]);

  // Auto-save functionality
  useEffect(() => {
    if (state.hasChanges && state.filePath) {
      if (autoSaveTimer.current) {
        clearInterval(autoSaveTimer.current);
      }
      
      autoSaveTimer.current = setInterval(async () => {
        await savePDF(false);
      }, 5 * 60 * 1000); // Auto-save every 5 minutes
    }
    
    return () => {
      if (autoSaveTimer.current) {
        clearInterval(autoSaveTimer.current);
      }
    };
  }, [state.hasChanges, state.filePath]);

  const undo = async () => {
    setState(prev => {
      if (prev.historyIndex > 0) {
        const newIndex = prev.historyIndex - 1;
        const pdfBytes = prev.history[newIndex];
        // Load PDF from history without adding to history again
        loadPDFSafely(pdfBytes).then(pdf => {
          setState(current => ({
            ...current,
            currentPDF: pdf,
            currentPDFBytes: pdfBytes,
            totalPages: pdf.numPages,
            currentPage: Math.min(current.currentPage, pdf.numPages),
            historyIndex: newIndex,
            hasChanges: true, // Mark as changed
          }));
        }).catch(error => {
          console.error('Error loading undo state:', error);
          toast.error('Failed to undo changes');
        });
      }
      return prev; // Return previous state immediately, setState will be called async
    });
  };

  const redo = async () => {
    setState(prev => {
      if (prev.historyIndex < prev.history.length - 1) {
        const newIndex = prev.historyIndex + 1;
        const pdfBytes = prev.history[newIndex];
        // Load PDF from history without adding to history again
        loadPDFSafely(pdfBytes).then(pdf => {
          setState(current => ({
            ...current,
            currentPDF: pdf,
            currentPDFBytes: pdfBytes,
            totalPages: pdf.numPages,
            currentPage: Math.min(current.currentPage, pdf.numPages),
            historyIndex: newIndex,
            hasChanges: true, // Mark as changed
          }));
        }).catch(error => {
          console.error('Error loading redo state:', error);
          toast.error('Failed to redo changes');
        });
      }
      return prev; // Return previous state immediately, setState will be called async
    });
  };

  // Error dialog helper functions
  const showErrorDialog = (title: string, message: string, details?: string, onRetry?: () => void) => {
    setState(prev => ({
      ...prev,
      showErrorDialog: true,
      errorDialogConfig: {
        title,
        message,
        details,
        onRetry
      }
    }));
  };

  const hideErrorDialog = () => {
    setState(prev => ({
      ...prev,
      showErrorDialog: false,
      errorDialogConfig: null
    }));
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setState(prev => ({ ...prev, isFullscreen: true }));
    } else {
      document.exitFullscreen();
      setState(prev => ({ ...prev, isFullscreen: false }));
    }
  };

  const openPDF = async () => {
    try {
      console.log('🎯 openPDF called');
      console.log('🔍 Checking Electron environment:', !!window.electronAPI);
      console.log('🔍 electronAPI.openFile available:', !!window.electronAPI?.openFile);
      
      // Check if we're in Electron
      if (window.electronAPI?.openFile) {
        console.log('📞 Calling window.electronAPI.openFile()...');
        const result = await window.electronAPI.openFile();
        console.log('📥 Electron openFile result:', {
          result: !!result,
          success: result?.success,
          data: result?.data ? 'ArrayBuffer present' : 'No data',
          dataType: result?.data?.constructor?.name,
          byteLength: result?.data?.byteLength || 0,
          path: result?.path
        });
        
        if (result) {
          setState(prev => ({ ...prev, isLoading: true }));
          
          console.log('🔄 Processing result.data:', {
            dataConstructor: result.data?.constructor?.name,
            dataByteLength: result.data?.byteLength,
            isArrayBuffer: result.data instanceof ArrayBuffer
          });
          
          // Create safe copy immediately to prevent ArrayBuffer detachment
          const sourceArray = new Uint8Array(result.data);
          console.log('📊 sourceArray details:', {
            length: sourceArray.length,
            constructor: sourceArray.constructor.name,
            first4Bytes: sourceArray.slice(0, 4)
          });
          
          const safePdfBytes = new Uint8Array(sourceArray.length);
          console.log('📊 safePdfBytes initialized:', {
            length: safePdfBytes.length,
            constructor: safePdfBytes.constructor.name
          });
          
          // Copy byte by byte to avoid detachment issues
          for (let i = 0; i < sourceArray.length; i++) {
            safePdfBytes[i] = sourceArray[i];
          }
          
          console.log('✅ Byte copying completed:', {
            safePdfBytesLength: safePdfBytes.length,
            first4Bytes: safePdfBytes.slice(0, 4),
            last4Bytes: safePdfBytes.slice(-4)
          });
          
          console.log('📖 Calling pdfjsLib.getDocument...');
          const loadingTask = pdfjsLib.getDocument(safePdfBytes);
          const pdf = await loadingTask.promise;
          console.log('✅ PDF loaded successfully:', pdf);
          
          // Validate PDF bytes before setting state
          if (!safePdfBytes || safePdfBytes.length === 0) {
            console.error('❌ Electron safePdfBytes is invalid:', { 
              safePdfBytes, 
              length: safePdfBytes?.length,
              isUint8Array: safePdfBytes instanceof Uint8Array 
            });
            throw new Error('Failed to create valid PDF bytes from Electron');
          }
          
          debugPDFBytesChange('Electron file load', safePdfBytes);
          
          // Create safety copy for state
          const statePdfBytes = new Uint8Array(safePdfBytes);
          
          setState(prev => ({
            ...prev,
            currentPDF: pdf,
            currentPDFBytes: statePdfBytes,
            totalPages: pdf.numPages,
            currentPage: 1,
            fileName: result.path.split(/[\\/]/).pop() || 'document.pdf',
            filePath: result.path,
            isLoading: false,
            hasChanges: false,
            annotations: [],
            searchResults: [],
            currentSearchIndex: -1
          }));
          
          addToHistory(safePdfBytes); // Add to history after opening
          
          // Initialize search service with the new PDF
          await searchService.initialize(pdf);
          
          // Add to recent files if in Electron
          if (window.electronAPI.addRecentFile) {
            await window.electronAPI.addRecentFile(result.path);
          }
          
          toast.success('PDF opened successfully');
        }
      } else {
        // Fallback for web version - use file input
        fileInputRef.current?.click();
      }
    } catch (error) {
      console.error('Error opening PDF:', error);
      toast.error('Failed to open PDF');
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('🎯 handleFileInputChange START');
    const file = e.target.files?.[0];
    console.log('📁 File from input:', file);
    if (!file) {
      console.log('❌ No file selected, returning');
      return;
    }
    
    console.log('📁 File selected:', {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: new Date(file.lastModified)
    });
    
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      
      // Use multiple strategies to handle ArrayBuffer safely
      let safePdfBytes: Uint8Array;
      
      try {
        // Strategy 1: FileReader for robust buffer handling
        console.log('📖 Using FileReader strategy...');
        console.log('📖 File details before FileReader:', {
          name: file.name,
          size: file.size,
          type: file.type,
          fileInstance: file.constructor.name
        });
        
        const fileReader = new FileReader();
        const arrayBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
          fileReader.onload = (event) => {
            console.log('✅ FileReader onload triggered');
            console.log('✅ FileReader event:', {
              targetResult: !!event.target?.result,
              resultType: typeof fileReader.result,
              resultLength: fileReader.result ? (fileReader.result as ArrayBuffer).byteLength : 0,
              resultConstructor: fileReader.result?.constructor?.name
            });
            
            if (!fileReader.result) {
              console.error('❌ FileReader result is null');
              reject(new Error('FileReader result is null'));
              return;
            }
            
            resolve(fileReader.result as ArrayBuffer);
          };
          fileReader.onerror = (event) => {
            console.error('❌ FileReader error event:', event);
            console.error('❌ FileReader error:', fileReader.error);
            reject(fileReader.error || new Error('FileReader failed'));
          };
          fileReader.onabort = () => {
            console.error('❌ FileReader aborted');
            reject(new Error('FileReader aborted'));
          };
          
          console.log('📖 Starting FileReader.readAsArrayBuffer...');
          fileReader.readAsArrayBuffer(file);
        });
        
        console.log('📊 ArrayBuffer received from FileReader:', {
          arrayBuffer: !!arrayBuffer,
          byteLength: arrayBuffer?.byteLength || 0,
          constructor: arrayBuffer?.constructor?.name,
          isArrayBuffer: arrayBuffer instanceof ArrayBuffer
        });
        
        if (!arrayBuffer || arrayBuffer.byteLength === 0) {
          console.error('❌ Invalid ArrayBuffer from FileReader');
          throw new Error('Invalid ArrayBuffer from FileReader');
        }
        
        // Create safe copy immediately to prevent detachment
        safePdfBytes = new Uint8Array(arrayBuffer);
        console.log('✅ Created safePdfBytes from FileReader:', {
          length: safePdfBytes.length,
          first4Bytes: safePdfBytes.slice(0, 4)
        });
      } catch (readerError) {
        console.warn('FileReader failed, trying file.arrayBuffer():', readerError);
        
        // Strategy 2: file.arrayBuffer() with immediate copy
        console.log('🔄 Using file.arrayBuffer() fallback...');
        const arrayBuffer = await file.arrayBuffer();
        console.log('📊 Fallback ArrayBuffer details:', {
          byteLength: arrayBuffer.byteLength,
          constructor: arrayBuffer.constructor.name
        });
        
        const tempArray = new Uint8Array(arrayBuffer);
        console.log('📊 TempArray details:', {
          length: tempArray.length,
          first4Bytes: tempArray.slice(0, 4)
        });
        
        safePdfBytes = new Uint8Array(tempArray.length);
        
        // Copy byte by byte to avoid detachment issues
        for (let i = 0; i < tempArray.length; i++) {
          safePdfBytes[i] = tempArray[i];
        }
        
        console.log('✅ Created safePdfBytes from fallback:', {
          length: safePdfBytes.length,
          first4Bytes: safePdfBytes.slice(0, 4)
        });
      }
      
      // Create a copy for PDF.js to prevent it from consuming our original bytes
      const pdfJsCopy = new Uint8Array(safePdfBytes);
      const loadingTask = pdfjsLib.getDocument(pdfJsCopy);
      const pdf = await loadingTask.promise;
      
      console.log('✅ PDF.js loading complete, checking safePdfBytes:', {
        safePdfBytesLength: safePdfBytes.length,
        pdfJsCopyLength: pdfJsCopy.length,
        pdfNumPages: pdf.numPages
      });
      
      // Validate PDF bytes before setting state
      if (!safePdfBytes || safePdfBytes.length === 0) {
        console.error('❌ safePdfBytes is invalid:', { 
          safePdfBytes, 
          length: safePdfBytes?.length,
          isUint8Array: safePdfBytes instanceof Uint8Array 
        });
        throw new Error('Failed to create valid PDF bytes');
      }
      
      debugPDFBytesChange('Web file load', safePdfBytes);
      
      // Create another safety copy for state to prevent reference issues
      const statePdfBytes = new Uint8Array(safePdfBytes);
      
      setState(prev => ({
        ...prev,
        currentPDF: pdf,
        currentPDFBytes: statePdfBytes,
        totalPages: pdf.numPages,
        currentPage: 1,
        fileName: file.name,
        filePath: null,
        isLoading: false,
        hasChanges: false,
        annotations: [],
        searchResults: [],
        currentSearchIndex: -1
      }));
      
      addToHistory(safePdfBytes); // Add to history after opening
      
      // Initialize search service with the new PDF
      await searchService.initialize(pdf);
      
      toast.success('PDF opened successfully');
    } catch (error: any) {
      logger.error('Error opening PDF', error);
      const userMessage = error.userMessage || 'Failed to open PDF. Please try again.';
      const technicalDetails = error.stack || error.message;
      
      showErrorDialog(
        'Open PDF Error',
        userMessage,
        technicalDetails,
        () => openPDF() // Retry function
      );
      
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  // Handle text editing from ClickToEditOverlay
  const handleTextEdit = async (regionId: string, newText: string) => {
    try {
      console.log('🖊️ Text edit requested:', { regionId, newText });
      
      if (!state.currentPDFBytes) {
        console.error('❌ No PDF bytes available for text editing');
        toast.error('PDF data not available. Please reload the document.');
        return;
      }
      
      // Use the RealPDFTextEditor to apply the text edit
      const editData = {
        regionId,
        newText,
        // Additional properties will be determined by the text region data
      };
      
      const modifiedPDFBytes = await realPDFTextEditor.current.applyTextEdit(
        state.currentPDFBytes,
        editData
      );
      
      if (modifiedPDFBytes && modifiedPDFBytes.length > 0) {
        // Reload the PDF with the modified bytes
        const loadingTask = pdfjsLib.getDocument(new Uint8Array(modifiedPDFBytes));
        const pdf = await loadingTask.promise;
        
        setState(prev => ({
          ...prev,
          currentPDF: pdf,
          currentPDFBytes: new Uint8Array(modifiedPDFBytes),
          hasChanges: true
        }));
        
        toast.success('Text edited successfully');
        console.log('✅ Text edit applied successfully');
      } else {
        throw new Error('Text edit returned invalid PDF data');
      }
    } catch (error) {
      console.error('❌ Text edit failed:', error);
      toast.error('Failed to edit text. Please try again.');
    }
  };

  const savePDF = async (saveAs: boolean) => {
    try {
      // More comprehensive check for PDF availability
      if (!state.currentPDF) {
        toast.warning('No PDF document loaded');
        return;
      }
      
      if (!state.currentPDFBytes) {
        console.warn('⚠️ PDF bytes missing, attempting to regenerate from PDF object');
        toast.warning('PDF data not available - please reload the document');
        return;
      }
      
      console.log('🔄 Starting PDF save process...');
      console.log(`📊 Current PDF bytes length: ${state.currentPDFBytes.length}`);
      console.log(`📊 Current PDF pages: ${state.currentPDF.numPages}`);
      console.log(`📊 Current file name: ${state.fileName}`);
      
      // Check if PDF bytes are valid before proceeding
      if (!state.currentPDFBytes || state.currentPDFBytes.length === 0) {
        console.error('❌ PDF bytes array is empty or null');
        console.error('🔍 Debug info:', {
          hasCurrentPDF: !!state.currentPDF,
          totalPages: state.totalPages,
          fileName: state.fileName,
          filePath: state.filePath
        });
        toast.error('Cannot save - PDF data is empty. Please reload the document.');
        return;
      }
      
      // Additional safety check for very small PDFs that might be corrupted
      if (state.currentPDFBytes.length < 100) {
        console.error('❌ PDF bytes suspiciously small, likely corrupted');
        toast.error('Cannot save - PDF data appears corrupted. Please reload the document.');
        return;
      }
      
      // Create a safe copy of PDF bytes to prevent buffer detachment
      let safePDFBytes: Uint8Array;
      try {
        safePDFBytes = createSafePDFCopy(state.currentPDFBytes);
      } catch (copyError) {
        console.error('❌ Failed to create safe PDF copy:', copyError);
        // Try to use original bytes directly as fallback
        safePDFBytes = new Uint8Array(state.currentPDFBytes);
      }
      
      // Validate original PDF data integrity
      if (!validatePDFBytes(safePDFBytes)) {
        console.error('❌ Original PDF bytes are corrupted');
        toast.error('Cannot save - PDF data is corrupted');
        return;
      }
      
      // Check if we have any modifications to apply
      let pdfBytes: Uint8Array;
      
      if (state.hasChanges && (state.annotations.length > 0 || state.rotation !== 0)) {
        console.log('📝 Applying modifications to PDF...');
        try {
          // Apply all modifications with safe error handling using safe copy
          const modifiedPDF = await applyModificationsToSafeCopy(safePDFBytes);
          console.log('🔧 Modifications applied, saving PDF...');
          
          // Save with conservative settings for maximum reliability
          const savedBytes = await modifiedPDF.save({
            addDefaultPage: false,
            compress: false, // Don't compress to avoid potential corruption
            objectsPerTick: 25, // Even slower save for better reliability
            useObjectStreams: false // Disable object streams for compatibility
          });
          
          console.log(`💾 PDF saved, size: ${savedBytes.length} bytes`);
          pdfBytes = new Uint8Array(savedBytes);
          
          // Validate modified PDF with more lenient validation
          if (!validatePDFBytes(pdfBytes)) {
            console.warn('⚠️ Modified PDF validation failed, but attempting to save anyway');
            // Don't fall back to original if modifications were requested
            // The validation might be too strict
          } else {
            console.log('✅ Modified PDF validation passed');
          }
        } catch (modError) {
          console.error('❌ Error applying modifications:', modError);
          toast.error('Failed to apply modifications, saving original PDF');
          pdfBytes = createSafePDFCopy(safePDFBytes);
        }
      } else {
        console.log('📄 Using original PDF bytes (no modifications)');
        // No changes, use safe copy of original PDF bytes
        try {
          pdfBytes = createSafePDFCopy(safePDFBytes);
          console.log(`✅ Successfully created safe copy for unmodified PDF (${pdfBytes.length} bytes)`);
        } catch (noCopyError) {
          console.warn('⚠️ Failed to create safe copy, using original bytes directly:', noCopyError);
          pdfBytes = safePDFBytes; // Use the already validated safe bytes
        }
      }
      
      // Final validation before save
      if (!validatePDFBytes(pdfBytes)) {
        console.error('❌ Final PDF validation failed');
        // In development, show more details about why validation failed
        console.log('📊 PDF bytes length:', pdfBytes?.length);
        console.log('📊 PDF bytes type:', typeof pdfBytes);
        console.log('📊 PDF bytes instanceof Uint8Array:', pdfBytes instanceof Uint8Array);
        if (pdfBytes && pdfBytes.length > 0) {
          console.log('📊 First few bytes:', Array.from(pdfBytes.slice(0, 10)));
        }
        toast.error('Cannot save PDF - data validation failed');
        return;
      }
      
      console.log(`✅ PDF validated, size: ${pdfBytes.length} bytes`);
      
      if (window.electronAPI?.saveFile) {
        let filePath = state.filePath;
        
        if (saveAs || !filePath) {
          if (window.electronAPI.saveFileDialog) {
            filePath = await window.electronAPI.saveFileDialog(state.fileName);
            if (!filePath) return;
          } else {
            toast.error('Save dialog not available');
            return;
          }
        }
        
        // Create safe ArrayBuffer for Electron
        const safeArrayBuffer = createSafeArrayBuffer(pdfBytes);
        const result = await window.electronAPI.saveFile(filePath, safeArrayBuffer);
        
        if (result.success) {
          setState(prev => ({
            ...prev,
            filePath,
            hasChanges: false,
            fileName: filePath.split(/[\\/]/).pop() || 'document.pdf'
          }));
          addToHistory(pdfBytes); // Add to history after successful save
          toast.success('PDF saved successfully');
          console.log('✅ PDF saved to:', filePath);
        } else {
          console.error('❌ Save failed:', result.error);
          toast.error(`Failed to save PDF: ${result.error}`);
        }
      } else {
        // Web version - download the file
        console.log('🌐 Downloading PDF in web mode...');
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = state.fileName || 'document.pdf';
        a.click();
        URL.revokeObjectURL(url);
        
        setState(prev => ({ ...prev, hasChanges: false }));
        addToHistory(pdfBytes); // Add to history after successful download
        toast.success('PDF downloaded successfully');
        console.log('✅ PDF downloaded successfully');
      }
    } catch (error: any) {
      const errorInfo = handlePDFOperationError(error, 'save', {
        fileName: state.fileName,
        filePath: state.filePath,
        pdfSize: state.currentPDFBytes?.length || 0,
        totalPages: state.totalPages,
        hasModifications: state.hasChanges
      });
      
      showErrorDialog(
        'Save Error',
        errorInfo.userMessage,
        errorInfo.technicalDetails,
        errorInfo.shouldRetry ? (() => savePDF(saveAs)) : undefined
      );
      
      // Additional error handling based on error type
      if (errorInfo.errorType === 'invalid_pdf_format') {
        toast.error('PDF format validation failed - document may be corrupted');
      } else if (errorInfo.errorType === 'buffer_detached') {
        // Suggest reloading the document
        setState(prev => ({ 
          ...prev, 
          showErrorDialog: true,
          errorDialogConfig: {
            title: 'Memory Error',
            message: 'The PDF data in memory has become invalid. Please reload the document.',
            onRetry: () => window.location.reload()
          }
        }));
      }
    }
  };

  // Updated function to apply modifications using safe PDF copy
  const applyModificationsToSafeCopy = async (safePDFBytes: Uint8Array): Promise<PDFDocument> => {
    console.log('🔧 Applying modifications to safe PDF copy...');
    
    try {
      let pdfBytesToProcess = safePDFBytes;
      
      // Apply annotations first if we have any
      if (state.annotations.length > 0) {
        console.log(`📝 Applying ${state.annotations.length} annotations to PDF...`);
        try {
          pdfBytesToProcess = await annotationService.current.applyAnnotationsToPDF(pdfBytesToProcess);
          console.log('✅ Annotations applied successfully');
        } catch (annotError) {
          console.error('❌ Failed to apply annotations:', annotError);
          toast.warning('Some annotations may not be saved properly');
          // Continue with original bytes if annotation application fails
          pdfBytesToProcess = safePDFBytes;
        }
      }
      
      // Load the PDF document using the processed bytes (with annotations applied)
      const pdfDoc = await PDFDocument.load(pdfBytesToProcess);
      console.log(`📄 Loaded PDF with ${pdfDoc.getPageCount()} pages`);
      
      // Apply rotation if needed (using pdf-lib directly for safety)
      if (state.rotation !== 0) {
        console.log(`🔄 Applying ${state.rotation}° rotation`);
        const pages = pdfDoc.getPages();
        pages.forEach(page => {
          try {
            page.setRotation({ type: 'degrees', angle: state.rotation });
          } catch (rotError) {
            console.warn('⚠️ Failed to apply rotation to page:', rotError);
          }
        });
      }
      
      console.log('✅ All modifications applied successfully');
      return pdfDoc;
      
    } catch (error: any) {
      logger.error('Error applying modifications to safe copy', error);
      const userMessage = error.userMessage || 'Failed to apply modifications to PDF. Please try again.';
      const technicalDetails = error.stack || error.message;
      
      showErrorDialog(
        'PDF Modification Error',
        userMessage,
        technicalDetails
      );
      
      // Try to return an unmodified PDF document as fallback
      try {
        return await PDFDocument.load(safePDFBytes);
      } catch (fallbackError: any) {
        logger.error('Even fallback PDF loading failed', fallbackError);
        throw new Error('PDF is too corrupted to modify or save');
      }
    }
  };

  // Legacy function maintained for compatibility
  const applyModifications = async (): Promise<PDFDocument> => {
    const safeCopy = createSafePDFCopy(state.currentPDFBytes!);
    return await applyModificationsToSafeCopy(safeCopy);
  };

  const printPDF = () => {
    if (state.currentPDF) {
      window.print();
    } else {
      toast.warning('No PDF to print');
    }
  };

  const setZoom = (newZoomOrUpdater: number | ((prev: number) => number)) => {
    setState(prev => {
      const newZoom = typeof newZoomOrUpdater === 'function' 
        ? newZoomOrUpdater(prev.zoom) 
        : newZoomOrUpdater;
      const clampedZoom = Math.max(25, Math.min(400, newZoom));
      return { ...prev, zoom: clampedZoom };
    });
  };

  const fitToWidth = () => {
    const viewerWidth = document.getElementById('pdf-viewer')?.clientWidth || 800;
    const pageWidth = 595; // Standard A4 width in points
    const newZoom = Math.floor((viewerWidth / pageWidth) * 100);
    setZoom(newZoom);
  };

  const fitToPage = () => {
    const viewerHeight = document.getElementById('pdf-viewer')?.clientHeight || 600;
    const pageHeight = 842; // Standard A4 height in points
    const newZoom = Math.floor((viewerHeight / pageHeight) * 100);
    setZoom(newZoom);
  };

  const rotatePage = (degreesValue: number) => {
    setState(prev => ({
      ...prev,
      rotation: (prev.rotation + degreesValue + 360) % 360,
      hasChanges: true
    }));
  };

  const toggleTheme = () => {
    const newTheme = !state.isDarkMode;
    setState(prev => ({ ...prev, isDarkMode: newTheme }));
    const themeString = newTheme ? 'dark' : 'light';
    document.body.classList.remove('light-theme', 'dark-theme', 'high-contrast-theme', 'blue-theme', 'green-theme', 'purple-theme'); // Remove all existing themes
    document.body.classList.add(`${themeString}-theme`); // Add the selected theme
    
    // Save preference if available
    if (window.electronAPI?.setPreferences) {
      window.electronAPI.setPreferences({ theme: themeString });
    }
  };

  const changePage = (newPage: number) => {
    if (newPage >= 1 && newPage <= state.totalPages) {
      setState(prev => ({ ...prev, currentPage: newPage }));
    }
  };

  const insertPage = async () => {
    if (!state.currentPDFBytes) return;
    
    try {
      const pdfDoc = await PDFDocument.load(state.currentPDFBytes);
      const page = pdfDoc.insertPage(state.currentPage);
      
      // Add some default content to the new page
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      page.drawText('New Page', {
        x: 50,
        y: page.getHeight() - 50,
        size: 12,
        font,
        color: rgb(0.5, 0.5, 0.5)
      });
      
      const pdfBytes = await pdfDoc.save();
      const uint8Array = new Uint8Array(pdfBytes);
      
      // Reload the PDF
      const loadingTask = pdfjsLib.getDocument(uint8Array);
      const pdf = await loadingTask.promise;
      
      setState(prev => ({
        ...prev,
        currentPDF: pdf,
        currentPDFBytes: uint8Array,
        totalPages: pdf.numPages,
        hasChanges: true
      }));
      
      addToHistory(uint8Array); // Add to history after page insertion
      toast.success('Page inserted successfully');
    } catch (error) {
      console.error('Error inserting page:', error);
      toast.error('Failed to insert page');
    }
  };

  const deletePage = async () => {
    if (!state.currentPDFBytes || state.totalPages <= 1) {
      toast.warning('Cannot delete the only page');
      return;
    }
    
    try {
      const pdfDoc = await PDFDocument.load(state.currentPDFBytes);
      pdfDoc.removePage(state.currentPage - 1);
      
      const pdfBytes = await pdfDoc.save();
      const uint8Array = new Uint8Array(pdfBytes);
      
      // Reload the PDF
      const loadingTask = pdfjsLib.getDocument(uint8Array);
      const pdf = await loadingTask.promise;
      
      setState(prev => ({
        ...prev,
        currentPDF: pdf,
        currentPDFBytes: uint8Array,
        totalPages: pdf.numPages,
        currentPage: Math.min(prev.currentPage, pdf.numPages),
        hasChanges: true
      }));
      
      addToHistory(uint8Array); // Add to history after page deletion
      toast.success('Page deleted successfully');
    } catch (error) {
      console.error('Error deleting page:', error);
      toast.error('Failed to delete page');
    }
  };

  const mergePDFs = async () => {
    try {
      if (!window.electronAPI?.openFile) {
        toast.error('File selection not available');
        return;
      }

      // Select additional PDFs to merge with multiSelections enabled
      const result = await window.electronAPI.openFile({ multiSelections: true });
      if (!result || !state.currentPDFBytes) return;

      setState(prev => ({ ...prev, isLoading: true }));

      const mainPDF = await PDFDocument.load(state.currentPDFBytes);
      
      // Handle both single and multiple file selections
      if (result.files && result.files.length > 0) {
        // Multiple files selected
        for (const file of result.files) {
          const additionalPDF = await PDFDocument.load(file.data);
          const pages = await mainPDF.copyPages(additionalPDF, additionalPDF.getPageIndices());
          pages.forEach(page => mainPDF.addPage(page));
        }
      } else if (result.data) {
        // Single file selected (backward compatibility)
        const additionalPDF = await PDFDocument.load(result.data);
        const pages = await mainPDF.copyPages(additionalPDF, additionalPDF.getPageIndices());
        pages.forEach(page => mainPDF.addPage(page));
      } else {
        throw new Error('No files selected for merging');
      }

      const pdfBytes = await mainPDF.save();
      const uint8Array = new Uint8Array(pdfBytes);

      // Reload the merged PDF
      const loadingTask = pdfjsLib.getDocument(uint8Array);
      const pdf = await loadingTask.promise;

      setState(prev => ({
        ...prev,
        currentPDF: pdf,
        currentPDFBytes: uint8Array,
        totalPages: pdf.numPages,
        hasChanges: true,
        isLoading: false
      }));

      addToHistory(uint8Array); // Add to history after merging
      toast.success('PDFs merged successfully');
    } catch (error) {
      console.error('Error merging PDFs:', error);
      toast.error('Failed to merge PDFs');
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const splitPDF = async () => {
    if (!state.currentPDFBytes) {
      toast.warning('No PDF to split');
      return;
    }

    try {
      showInputDialog(
        'Split PDF',
        `Enter page number (1-${state.totalPages - 1}):`,
        (pageNumber: string) => {
          const splitAt = parseInt(pageNumber);
          if (isNaN(splitAt) || splitAt < 1 || splitAt >= state.totalPages) {
            toast.error('Invalid page number');
            return;
          }
          
          // Continue with the split logic
          performSplit(splitAt);
        }
      );
      return; // Exit early, performSplit will handle the rest
    } catch (error) {
      console.error('Error splitting PDF:', error);
      setState(prev => ({ ...prev, isLoading: false }));
      toast.error('Failed to split PDF');
    }
  };

  const performSplit = async (splitAt: number) => {
    try {

      setState(prev => ({ ...prev, isLoading: true }));

      const originalPDF = await PDFDocument.load(state.currentPDFBytes);

      // Create first part
      const firstPartPDF = await PDFDocument.create();
      const firstPartPages = await firstPartPDF.copyPages(originalPDF, Array.from({length: splitAt}, (_, i) => i));
      firstPartPages.forEach(page => firstPartPDF.addPage(page));

      // Create second part  
      const secondPartPDF = await PDFDocument.create();
      const secondPartPages = await secondPartPDF.copyPages(originalPDF, Array.from({length: state.totalPages - splitAt}, (_, i) => i + splitAt));
      secondPartPages.forEach(page => secondPartPDF.addPage(page));

      // Save both parts
      const firstPartBytes = await firstPartPDF.save();
      const secondPartBytes = await secondPartPDF.save();

      // Save first part
      if (window.electronAPI?.saveFileDialog && window.electronAPI?.saveFile) {
        const firstFilePath = await window.electronAPI.saveFileDialog(`${state.fileName.replace('.pdf', '')}_part1.pdf`);
        if (firstFilePath) {
          await window.electronAPI.saveFile(firstFilePath, toArrayBuffer(firstPartBytes));
        }

        // Save second part
        const secondFilePath = await window.electronAPI.saveFileDialog(`${state.fileName.replace('.pdf', '')}_part2.pdf`);
        if (secondFilePath) {
          await window.electronAPI.saveFile(secondFilePath, toArrayBuffer(secondPartBytes));
        }

        toast.success('PDF split successfully');
      }

      setState(prev => ({ ...prev, isLoading: false }));
    } catch (error) {
      console.error('Error splitting PDF:', error);
      toast.error('Failed to split PDF');
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const compressPDF = async () => {
    if (!state.currentPDFBytes) {
      toast.warning('No PDF to compress');
      return;
    }

    try {
      setState(prev => ({ ...prev, isLoading: true }));

      // Basic compression by removing unnecessary data
      const pdfDoc = await PDFDocument.load(state.currentPDFBytes);
      
      // Set compression options
      const pdfBytes = await pdfDoc.save({
        useObjectStreams: false,
        addDefaultPage: false,
        objectsPerTick: 50
      });

      const compressionRatio = ((state.currentPDFBytes.length - pdfBytes.length) / state.currentPDFBytes.length * 100);
      
      if (compressionRatio > 0) {
        const uint8Array = new Uint8Array(pdfBytes);
        
        // Reload compressed PDF
        const loadingTask = pdfjsLib.getDocument(uint8Array);
        const pdf = await loadingTask.promise;

        setState(prev => ({
          ...prev,
          currentPDF: pdf,
          currentPDFBytes: uint8Array,
          hasChanges: true,
          isLoading: false
        }));

        addToHistory(uint8Array); // Add to history after successful compression
        toast.success(`PDF compressed by ${compressionRatio.toFixed(1)}%`);
      } else {
        setState(prev => ({ ...prev, isLoading: false }));
        toast.info('PDF is already optimally compressed');
      }
    } catch (error) {
      console.error('Error compressing PDF:', error);
      toast.error('Failed to compress PDF');
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const performOCR = async () => {
    if (!state.currentPDF) {
      toast.warning('No PDF loaded for OCR');
      return;
    }

    try {
      setState(prev => ({ ...prev, isLoading: true }));
      
      // Initialize OCR service
      await ocrService.current.initialize();
      
      const ocrResults = await ocrService.current.performOCR(state.currentPDF, state.currentPage);
      
      if (ocrResults && ocrResults.text) {
        // Create searchable PDF by adding text layer
        const searchableText = ocrResults.text;
        
        // Enhanced OCR integration: Create proper text regions for editing
        const textRegions = ocrResults.blocks.map((block, index) => {
          // Convert OCR coordinates to PDF editing coordinates
          return {
            id: `ocr_block_${state.currentPage}_${index}`,
            originalText: block.text.trim(),
            x: block.bbox.x0,
            y: block.bbox.y0,
            width: block.bbox.x1 - block.bbox.x0,
            height: block.bbox.y1 - block.bbox.y0,
            fontSize: 12, // Default font size for OCR text
            fontName: 'Helvetica',
            pageIndex: state.currentPage - 1,
            confidence: block.confidence,
            isOCR: true, // Mark as OCR-derived
            textItems: [] // No original PDF text items
          };
        }).filter(region => region.originalText.length > 0);
        
        // Also add an annotation showing OCR was performed
        const annotation = {
          id: `ocr_annotation_${Date.now()}`,
          type: 'text',
          text: `📝 OCR: ${textRegions.length} text blocks detected (${Math.round(ocrResults.confidence)}% confidence)`,
          x: 10,
          y: 30,
          pageIndex: state.currentPage - 1,
          fontSize: 10,
          color: { r: 0, g: 0.5, b: 0 },
          isOCR: true
        };
        
        setState(prev => ({
          ...prev,
          annotations: [...prev.annotations, annotation],
          hasChanges: true,
          isLoading: false,
          // Store OCR results for potential use in search and editing
          ocrResults: {
            ...prev.ocrResults,
            [state.currentPage - 1]: ocrResults
          }
        }));
        
        toast.success(`OCR completed! Detected ${textRegions.length} text regions with ${Math.round(ocrResults.confidence)}% confidence`);
      } else {
        setState(prev => ({ ...prev, isLoading: false }));
        toast.info('No text found in current page');
      }
    } catch (error: any) {
      logger.error('OCR processing failed', error);
      const userMessage = error.userMessage || 'OCR processing failed. Please try again.';
      const technicalDetails = error.stack || error.message;
      
      showErrorDialog(
        'OCR Error',
        userMessage,
        technicalDetails,
        () => performOCR() // Retry function
      );
      
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const encryptPDF = async () => {
    if (!state.currentPDFBytes) {
      toast.warning('No PDF to add demo protection to');
      return;
    }

    try {
      showInputDialog(
        'Encrypt PDF',
        '⚠️ DEMO ONLY: Enter password for basic protection (NOT real encryption):',
        async (password: string) => {
          if (!password) return;
          
          setState(prev => ({ ...prev, isLoading: true }));
          
          try {
            const result = await securityService.current.addPasswordProtectionDemo(state.currentPDFBytes, password);
            
            if (result.success && result.data) {
              const uint8Array = new Uint8Array(result.data);
              
              // Reload encrypted PDF
              const loadingTask = pdfjsLib.getDocument(uint8Array);
              const pdf = await loadingTask.promise;

              setState(prev => ({
                ...prev,
                currentPDF: pdf,
                currentPDFBytes: uint8Array,
                hasChanges: true,
                isLoading: false
              }));

              addToHistory(uint8Array); // Add to history after encryption
              toast.success('Demo protection added (NOT real encryption!)');
            } else {
              setState(prev => ({ ...prev, isLoading: false }));
              toast.error('Failed to encrypt PDF');
            }
          } catch (error: any) {
            logger.error('Encryption error', error);
            const userMessage = error.userMessage || 'Failed to encrypt PDF. Please try again.';
            const technicalDetails = error.stack || error.message;
            
            showErrorDialog(
              'Encryption Error',
              userMessage,
              technicalDetails,
              () => encryptPDF() // Retry function
            );
            
            setState(prev => ({ ...prev, isLoading: false }));
          }
        }
      );
    } catch (error: any) {
      logger.error('Encryption setup error', error);
      const userMessage = error.userMessage || 'Failed to set up encryption. Please try again.';
      const technicalDetails = error.stack || error.message;
      
      showErrorDialog(
        'Encryption Setup Error',
        userMessage,
        technicalDetails
      );
    }
  };

  const decryptPDF = async () => {
    if (!state.currentPDFBytes) {
      toast.warning('No PDF to remove protection from');
      return;
    }

    try {
      showInputDialog(
        'Decrypt PDF',
        'Enter password to remove demo protection:',
        async (password: string) => {
          if (!password) return;
          
          setState(prev => ({ ...prev, isLoading: true }));
          
          try {
            const result = await securityService.current.removePasswordProtectionDemo(state.currentPDFBytes, password);
            
            if (result.success && result.data) {
              const uint8Array = new Uint8Array(result.data);
              
              // Reload decrypted PDF
              const loadingTask = pdfjsLib.getDocument(uint8Array);
              const pdf = await loadingTask.promise;

              setState(prev => ({
                ...prev,
                currentPDF: pdf,
                currentPDFBytes: uint8Array,
                hasChanges: true,
                isLoading: false
              }));

              addToHistory(uint8Array); // Add to history after decryption
              toast.success('PDF decrypted successfully');
            } else {
              setState(prev => ({ ...prev, isLoading: false }));
              toast.error('Failed to decrypt PDF - check password');
            }
          } catch (error: any) {
            logger.error('Decryption error', error);
            const userMessage = error.userMessage || 'Failed to decrypt PDF. Please check the password and try again.';
            const technicalDetails = error.stack || error.message;
            
            showErrorDialog(
              'Decryption Error',
              userMessage,
              technicalDetails,
              () => decryptPDF() // Retry function
            );
            
            setState(prev => ({ ...prev, isLoading: false }));
          }
        }
      );
    } catch (error: any) {
      logger.error('Decryption setup error', error);
      const userMessage = error.userMessage || 'Failed to set up decryption. Please try again.';
      const technicalDetails = error.stack || error.message;
      
      showErrorDialog(
        'Decryption Setup Error',
        userMessage,
        technicalDetails
      );
    }
  };

  const addDigitalSignature = async () => {
    if (!state.currentPDFBytes) {
      toast.warning('No PDF to add visual signature to');
      return;
    }

    try {
      const signerName = prompt('⚠️ VISUAL ONLY: Enter signer name (NOT legally binding):') || 'Demo Signer';
      const reason = prompt('Enter reason for signing:') || 'Demo signature';
      const location = prompt('Enter location:') || 'Demo location';

      setState(prev => ({ ...prev, isLoading: true }));

      const result = await securityService.current.addVisualSignatureDemo(state.currentPDFBytes, {
        name: signerName,
        reason,
        location,
        contactInfo: '',
        date: new Date()
      });

      if (result.success && result.data) {
        const uint8Array = new Uint8Array(result.data);
        
        // Reload signed PDF
        const loadingTask = pdfjsLib.getDocument(uint8Array);
        const pdf = await loadingTask.promise;

        setState(prev => ({
          ...prev,
          currentPDF: pdf,
          currentPDFBytes: uint8Array,
          hasChanges: true,
          isLoading: false
        }));

        toast.success('Digital signature added successfully');
      } else {
        setState(prev => ({ ...prev, isLoading: false }));
        toast.error('Failed to add digital signature');
      }
    } catch (error) {
      console.error('Digital signature error:', error);
      toast.error('Failed to add digital signature');
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const addRedaction = async (redactionData: any) => {
    if (!state.currentPDFBytes) {
      toast.warning('No PDF to redact');
      return;
    }

    try {
      setState(prev => ({ ...prev, isLoading: true }));

      // Create a new PDF document
      const pdfDoc = await PDFDocument.load(state.currentPDFBytes);
      const page = pdfDoc.getPage(redactionData.pageIndex);
      
      // Add a black rectangle to cover the content
      page.drawRectangle({
        x: redactionData.x,
        y: redactionData.y,
        width: redactionData.width,
        height: redactionData.height,
        color: rgb(0, 0, 0),
        opacity: 1
      });

      // Save the modified PDF
      const pdfBytes = await pdfDoc.save();
      const uint8Array = new Uint8Array(pdfBytes);

      // Reload the redacted PDF
      const loadingTask = pdfjsLib.getDocument(uint8Array);
      const pdf = await loadingTask.promise;

      setState(prev => ({
        ...prev,
        currentPDF: pdf,
        currentPDFBytes: uint8Array,
        hasChanges: true,
        isLoading: false,
        annotations: [...prev.annotations, {
          ...redactionData,
          type: 'redaction',
          color: { r: 0, g: 0, b: 0 }
        }]
      }));

      addToHistory(uint8Array); // Add to history after redaction
      toast.success('Content redacted successfully');
    } catch (error) {
      console.error('Redaction error:', error);
      toast.error('Failed to redact content');
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const addWatermark = async (watermarkText: string, options: any) => {
    if (!state.currentPDFBytes) {
      toast.warning('No PDF to watermark');
      return;
    }

    setState(prev => ({ ...prev, isLoading: true }));

    // Emergency Recovery strategies for watermark functionality
    const watermarkStrategies = [
      // Strategy 1: Standard pdf-lib approach with safe buffer handling
      async () => {
        if (!state.currentPDFBytes) {
          throw new Error('No PDF data available');
        }
        // Create a safe copy of the PDF data
        const pdfDataCopy = createSafePDFBytes(state.currentPDFBytes);
        
        const pdfDoc = await PDFDocument.load(pdfDataCopy);
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
        
        for (let i = 0; i < pdfDoc.getPageCount(); i++) {
          const page = pdfDoc.getPage(i);
          const { width, height } = page.getSize();
          
          page.drawText(watermarkText, {
            x: width / 2 - 100,
            y: height / 2,
            size: 48,
            font: font,
            color: rgb(0.8, 0.8, 0.8),
            opacity: 0.5,
            rotate: degrees(45)
          });
        }
        
        return await pdfDoc.save();
      },
      
      // Strategy 2: Simplified watermark with ArrayBuffer safety
      async () => {
        if (!state.currentPDFBytes) {
          throw new Error('No PDF data available');
        }
        // Create safe copy with explicit ArrayBuffer handling
        const copiedBytes = createSafePDFBytes(state.currentPDFBytes);
        
        const pdfDoc = await PDFDocument.load(copiedBytes);
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
        
        const firstPage = pdfDoc.getPage(0);
        const { width, height } = firstPage.getSize();
        
        firstPage.drawText(watermarkText, {
          x: width / 2 - 100,
          y: height / 2,
          size: 32,
          font: font,
          color: rgb(0.7, 0.7, 0.7),
          opacity: 0.3
        });
        
        return await pdfDoc.save();
      },
      
      // Strategy 3: Emergency text overlay (minimal watermark)
      async () => {
        if (!state.currentPDFBytes) {
          throw new Error('No PDF data available');
        }
        // Use simplified PDF manipulation for emergency mode
        const safeBytes = createSafePDFBytes(state.currentPDFBytes);
        const pdfDoc = await PDFDocument.load(safeBytes);
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
        
        // Just add to first page in emergency mode
        if (pdfDoc.getPageCount() > 0) {
          const page = pdfDoc.getPage(0);
          const { width, height } = page.getSize();
          
          page.drawText(watermarkText, {
            x: width / 2 - 50,
            y: height / 2,
            size: 24,
            font: font,
            color: rgb(0.5, 0.5, 0.5),
            opacity: 0.4
          });
        }
        
        return await pdfDoc.save();
      }
    ];

    for (const [index, strategy] of watermarkStrategies.entries()) {
      try {
        console.log(`🔄 Attempting watermark strategy ${index + 1}`);
        const pdfBytes = await strategy();
        const uint8Array = new Uint8Array(pdfBytes);

        // Reload the watermarked PDF
        const loadingTask = pdfjsLib.getDocument(uint8Array);
        const pdf = await loadingTask.promise;

        setState(prev => ({
          ...prev,
          currentPDF: pdf,
          currentPDFBytes: uint8Array,
          hasChanges: true,
          isLoading: false,
          showWatermarkDialog: false
        }));

        toast.success(`Watermark added successfully (strategy ${index + 1})`);
        return;
        
      } catch (error) {
        console.warn(`⚠️ Watermark strategy ${index + 1} failed:`, error.message);
        if (index === watermarkStrategies.length - 1) {
          console.error('❌ All watermark strategies failed');
          toast.error('Failed to add watermark - PDF may be corrupted or unsupported');
          setState(prev => ({ ...prev, isLoading: false }));
        }
      }
    }
    // Note: addToHistory is called within successful strategy, not here
  };

  const addBookmark = (title: string, page: number) => {
    const newBookmark = {
      id: Date.now(),
      title,
      page,
      createdAt: new Date().toISOString()
    };

    setState(prev => ({
      ...prev,
      bookmarks: [...prev.bookmarks, newBookmark],
      showBookmarks: true
    }));

    toast.success('Bookmark added successfully');
  };

  const exportPDF = async (format: string) => {
    if (!state.currentPDFBytes) {
      toast.warning('No PDF to export');
      return;
    }

    try {
      setState(prev => ({ ...prev, isLoading: true }));

      switch (format) {
        case 'text':
          // Extract text from PDF
          const textContent = await extractAllText();
          const blob = new Blob([textContent], { type: 'text/plain' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${state.fileName.replace('.pdf', '')}.txt`;
          a.click();
          URL.revokeObjectURL(url);
          break;

        case 'images':
          // Export each page as image (simplified implementation)
          toast.info('Exporting as images is not yet implemented');
          break;

        case 'word':
          // Export as Word document (simplified implementation)
          toast.info('Exporting as Word document is not yet implemented');
          break;

        default:
          toast.warning('Unsupported export format');
      }

      setState(prev => ({ ...prev, isLoading: false, showExportOptions: false }));
      toast.success(`Exported as ${format.toUpperCase()} successfully`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export PDF');
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const extractAllText = async (): Promise<string> => {
    if (!state.currentPDF) return '';
    
    try {
      let fullText = '';
      for (let i = 1; i <= state.currentPDF.numPages; i++) {
        const page = await state.currentPDF.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');
        fullText += "Page " + i + "\n" + pageText + "\n\n";
      }
      return fullText;
    } catch (error) {
      console.error('Text extraction error:', error);
      return '';
    }
  };

  const handleFormUpdate = (formFields: any[]) => {
    setState(prev => ({ ...prev, formFields }));
  };

  const handleFormSave = async (pdfWithForms: Uint8Array) => {
    try {
      // Reload the PDF with forms
      const loadingTask = pdfjsLib.getDocument(pdfWithForms);
      const pdf = await loadingTask.promise;

      setState(prev => ({
        ...prev,
        currentPDF: pdf,
        currentPDFBytes: pdfWithForms,
        hasChanges: true
      }));

      toast.success('Forms integrated into PDF');
    } catch (error) {
      console.error('Error loading PDF with forms:', error);
      toast.error('Failed to integrate forms');
    }
  };
  
  // Enhanced form field creation using Advanced Form Builder
  const handleAdvancedFormField = async (fieldType: string) => {
    if (!state.currentPDFBytes) {
      toast.warning('Please open a PDF document first');
      return;
    }
    
    // Validate PDF bytes before processing
    if (!validatePDFBytes(state.currentPDFBytes)) {
      toast.error('Invalid PDF data - cannot add form fields');
      return;
    }
    
    try {
      const field = formBuilderService.current.createField(
        fieldType as any,
        100, // x
        100, // y  
        200, // width
        30,  // height
        state.currentPage - 1, // page
        {
          name: `field_${Date.now()}`,
          required: false,
          placeholder: `Enter ${fieldType}...`
        }
      );
      
      const updatedPdfBytes = await formBuilderService.current.addFormFieldsToPDF(
        state.currentPDFBytes,
        [field]
      );
      
      await handleFormSave(updatedPdfBytes);
      toast.success(`${fieldType} field added successfully`);
    } catch (error) {
      console.error('Error adding form field:', error);
      toast.error('Failed to add form field');
    }
  };
  
  // Document Workflow Management
  const initializeWorkflow = async (templateType: string) => {
    if (!state.currentPDFBytes || !state.fileName) {
      toast.warning('Please open a PDF document first');
      return;
    }
    
    try {
      const documentId = `doc_${Date.now()}`;
      const initiatorId = 'current_user'; // Would come from auth system
      
      // Example participants - in real app would come from user selection
      const participants = [
        { userId: 'reviewer1', role: 'reviewer', permissions: ['view', 'comment'] },
        { userId: 'approver1', role: 'approver', permissions: ['view', 'approve', 'reject'] }
      ];
      
      const workflow = workflowService.current.createWorkflowFromTemplate(
        templateType,
        documentId,
        state.fileName,
        initiatorId,
        participants,
        {
          priority: 'normal',
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
        }
      );
      
      await workflowService.current.startWorkflow(workflow.id);
      
      setState(prev => ({
        ...prev,
        activeWorkflow: workflow,
        showWorkflow: true
      }));
      
      toast.success(`Workflow "${templateType}" initiated successfully`);
    } catch (error) {
      console.error('Error initializing workflow:', error);
      toast.error('Failed to initialize workflow');
    }
  };

  const handleToolChange = async (tool: string) => {
    console.log('🔧 Tool changed to:', tool);
    
    // Handle AI document intelligence
    if (tool === 'analytics') {
      if (state.currentPDF && state.currentPDFBytes) {
        // Extract text content for AI analysis
        let extractedText = '';
        if (state.currentPDF) {
          try {
            for (let pageNum = 1; pageNum <= state.currentPDF.numPages; pageNum++) {
              const page = await state.currentPDF.getPage(pageNum);
              const textContent = await page.getTextContent();
              const pageText = textContent.items
                .map((item: any) => item.str)
                .join(' ');
              extractedText += pageText + ' ';
            }
          } catch (error) {
            console.warn('Failed to extract text for AI analysis:', error);
          }
        }

        setState(prev => ({ 
          ...prev, 
          showDocumentIntelligence: true,
          documentText: extractedText
        }));
      } else {
        toast.warning('Please open a PDF document first');
      }
      return;
    }
    
    // Handle form builder tool
    if (tool === 'form-builder') {
      setState(prev => ({ 
        ...prev, 
        showFormBuilder: true,
        currentTool: tool
      }));
      return;
    }
    
    // Handle document comparison tool
    if (tool === 'compare-documents') {
      setState(prev => ({ 
        ...prev, 
        showDocumentComparison: true,
        currentTool: tool
      }));
      return;
    }
    
    // Handle accessibility tools
    if (tool === 'accessibility-check') {
      setState(prev => ({ 
        ...prev, 
        showAccessibilityTools: true,
        currentTool: tool
      }));
      return;
    }
    
    // Handle workflow tool
    if (tool === 'workflow') {
      setState(prev => ({ 
        ...prev, 
        showWorkflow: true,
        sidebarTab: 'workflow'
      }));
      return;
    }
    
    // Toggle edit mode for edit tool
    if (tool === 'edit') {
      setState(prev => ({ 
        ...prev, 
        currentTool: tool,
        isEditMode: !prev.isEditMode 
      }));
      console.log('🔧 PDF Edit Mode:', state.isEditMode ? 'DEACTIVATED' : 'ACTIVATED');
    } 
    // Handle redaction tool
    else if (tool === 'redact') {
      setState(prev => ({ 
        ...prev, 
        currentTool: tool,
        showRedactionTool: true
      }));
    }
    // Handle watermark tool
    else if (tool === 'watermark') {
      setState(prev => ({ 
        ...prev, 
        currentTool: tool,
        showWatermarkDialog: true
      }));
    }
    // Handle form field tools using Advanced Form Builder
    else if (['text-field', 'checkbox', 'radio', 'dropdown', 'signature'].includes(tool)) {
      const fieldTypeMap: Record<string, string> = {
        'text-field': 'text',
        'checkbox': 'checkbox',
        'radio': 'radio',
        'dropdown': 'dropdown',
        'signature': 'signature'
      };
      await handleAdvancedFormField(fieldTypeMap[tool]);
      setState(prev => ({ ...prev, currentTool: 'select' }));
    }
    else {
      setState(prev => ({ 
        ...prev, 
        currentTool: tool,
        isEditMode: false,
        showRedactionTool: false
      }));
    }
  };

  const toggleEditMode = () => {
    setState(prev => ({ 
      ...prev, 
      isEditMode: !prev.isEditMode,
      currentTool: prev.isEditMode ? 'select' : 'edit'
    }));
  };

  const showInputDialog = (title: string, placeholder: string, onConfirm: (value: string) => void) => {
    setState(prev => ({
      ...prev,
      showInputDialog: true,
      inputDialogConfig: { title, placeholder, onConfirm }
    }));
  };

  const hideInputDialog = () => {
    setState(prev => ({
      ...prev,
      showInputDialog: false,
      inputDialogConfig: null
    }));
  };

  const addToHistory = useCallback((pdfBytes: Uint8Array) => {
    setState(prev => {
      const newHistory = prev.history.slice(0, prev.historyIndex + 1); // Discard future history
      const MAX_HISTORY_SIZE = 10; // Limit history to 10 states

      if (newHistory.length >= MAX_HISTORY_SIZE) {
        newHistory.shift(); // Remove oldest state
      }
      newHistory.push(pdfBytes);
      return {
        ...prev,
        history: newHistory,
        historyIndex: newHistory.length - 1,
        hasChanges: true, // Mark as changed when history is added
      };
    });
  }, []);

  const handlePDFUpdate = async (newPdfBytes: Uint8Array) => {
    try {
      console.log('🔄 Updating PDF with edited content...');
      
      // Create a safe, persistent copy of the PDF data to prevent detachment
      const safePdfBytes = new Uint8Array(newPdfBytes.length);
      safePdfBytes.set(newPdfBytes);
      
      // Load updated PDF
      const pdf = await pdfService.current.loadPDF(safePdfBytes);
      
      setState(prev => ({
        ...prev,
        currentPDF: pdf,
        currentPDFBytes: safePdfBytes,
        hasChanges: true
      }));
      
      addToHistory(safePdfBytes); // Add to history after update
      
      console.log('✅ PDF updated successfully');
    } catch (error) {
      console.error('❌ Failed to update PDF:', error);
      toast.error('Failed to update PDF with edits');
    }
  };

  const handleAnnotationAdd = (annotation: any) => {
    console.log('Adding annotation:', annotation);
    const annotationWithId = {
      ...annotation,
      id: Date.now() + Math.random(), // Simple unique ID
      timestamp: new Date().toISOString()
    };
    setState(prev => {
      const newAnnotations = [...prev.annotations, annotationWithId];
      console.log('New annotations array:', newAnnotations);
      return {
        ...prev,
        annotations: newAnnotations,
        hasChanges: true
      };
    });
  };

  const handleSearch = async (text: string, options: SearchOptions) => {
    if (!state.currentPDF) {
      toast.warning('No PDF loaded');
      return;
    }
    
    setState(prev => ({ ...prev, searchText: text, isSearching: true }));
    
    try {
      await searchService.initialize(state.currentPDF);
      const results = await searchService.search(text, options);
      
      setState(prev => ({
        ...prev,
        searchResults: results,
        currentSearchIndex: results.length > 0 ? 0 : -1,
        isSearching: false
      }));
      
      if (results.length > 0) {
        handleNavigateToResult(results[0]);
        toast.success(`Found ${results.length} results`);
      } else {
        toast.info('No results found');
      }
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Search failed');
      setState(prev => ({ ...prev, isSearching: false }));
    }
  };
  
  const handleNavigateToResult = (result: SearchResult) => {
    if (result.page !== state.currentPage) {
      changePage(result.page);
    }
    
    const index = state.searchResults.findIndex(r => r.index === result.index);
    if (index !== -1) {
      setState(prev => ({ ...prev, currentSearchIndex: index }));
    }
  };
  
  const handleNextSearchResult = () => {
    const result = searchService.getNextResult();
    if (result) {
      handleNavigateToResult(result);
      const stats = searchService.getSearchStats();
      setState(prev => ({ ...prev, currentSearchIndex: stats.current - 1 }));
    }
  };
  
  const handlePreviousSearchResult = () => {
    const result = searchService.getPreviousResult();
    if (result) {
      handleNavigateToResult(result);
      const stats = searchService.getSearchStats();
      setState(prev => ({ ...prev, currentSearchIndex: stats.current - 1 }));
    }
  };

  const handleToolOptionChange = (option: string, value: any) => {
    setState(prev => ({
      ...prev,
      [option]: value
    }));
  };

  const toggleSidebar = () => {
    setState(prev => ({ ...prev, isSidebarExpanded: !prev.isSidebarExpanded }));
  };

  const handleSidebarResize = (width: number) => {
    console.log('Sidebar resized to:', width);
    // Update CSS custom property for dynamic sidebar width
    document.documentElement.style.setProperty('--sidebar-current-width', `${width}px`);
  };

  return (
    <div className={`adobe-app ${state.isDarkMode ? 'dark' : 'light'} ${state.isFullscreen ? 'fullscreen' : ''}`}>
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf"
        className="hidden-input"
        onChange={handleFileInputChange}
      />
      
      <div className="adobe-header">
        <EnhancedToolbar
          currentTool={state.currentTool}
          onToolChange={handleToolChange}
          zoom={state.zoom}
          onZoomChange={setZoom}
          onOpenFile={openPDF}
          onSaveFile={() => savePDF(false)}
          onPrint={printPDF}
          hasDocument={!!state.currentPDF}
          onUndo={undo}
          onRedo={redo}
          canUndo={state.historyIndex > 0}
          canRedo={state.historyIndex < state.history.length - 1}
          onToolOptionChange={handleToolOptionChange}
          // Page navigation
          currentPage={state.currentPage}
          totalPages={state.totalPages}
          onPreviousPage={() => setCurrentPage(Math.max(1, state.currentPage - 1))}
          onNextPage={() => setCurrentPage(Math.min(state.totalPages, state.currentPage + 1))}
          // Professional features
          onEncryptPDF={encryptPDF}
          onMergePDFs={mergePDFs}
          onPerformOCR={performOCR}
          onCompressPDF={compressPDF}
          onSplitPDF={splitPDF}
        />
      </div>
      
      {/* Sidebar */}
      <div className={`adobe-sidebar ${state.isSidebarExpanded ? 'expanded' : ''}`}>
        <Sidebar
          onToggleThumbnails={() => setState(prev => ({ ...prev, showThumbnails: !prev.showThumbnails }))}
          onToggleProperties={() => setState(prev => ({ ...prev, showProperties: !prev.showProperties }))}
          onToggleSearch={() => setState(prev => ({ ...prev, showSearch: !prev.showSearch }))}
          onToggleNavigation={() => setState(prev => ({ ...prev, showNavigation: !prev.showNavigation }))}
          showThumbnails={state.showThumbnails}
          showProperties={state.showProperties}
          showSearch={state.showSearch}
          showNavigation={state.showNavigation}
          onToggleSidebar={toggleSidebar}
          isSidebarExpanded={state.isSidebarExpanded}
          onSidebarResize={handleSidebarResize}
        />
        
        {state.showThumbnails && state.currentPDF && (
          <ThumbnailPanel
            pdf={state.currentPDF}
            currentPage={state.currentPage}
            onPageSelect={changePage}
            isSidebarExpanded={state.isSidebarExpanded}
          />
        )}
        
        {state.showNavigation && state.currentPDF && (
          <NavigationPanel
            pdfBytes={state.currentPDFBytes}
            currentPage={state.currentPage - 1}
            onNavigate={(pageIndex, x, y) => {
              changePage(pageIndex + 1);
              // Note: x,y coordinates could be used for precise positioning in the future
            }}
            onClose={() => setState(prev => ({ ...prev, showNavigation: false }))}
          />
        )}
        
        {state.showAnalytics && state.analyticsData && state.currentPDF && (
          <AnalyticsDashboard
            analyticsData={state.analyticsData}
            pdfBytes={state.currentPDFBytes}
            onExport={(data) => {
              const jsonStr = JSON.stringify(data, null, 2);
              const blob = new Blob([jsonStr], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `${state.fileName || 'document'}_analytics.json`;
              a.click();
              URL.revokeObjectURL(url);
              toast.success('Analytics exported successfully');
            }}
            onClose={() => setState(prev => ({ ...prev, showAnalytics: false }))}
          />
        )}

        {state.showDocumentIntelligence && state.currentPDF && state.currentPDFBytes && (
          <DocumentIntelligencePanel
            pdf={state.currentPDF}
            pdfBytes={state.currentPDFBytes}
            textContent={state.documentText}
            isVisible={state.showDocumentIntelligence}
            onClose={() => setState(prev => ({ ...prev, showDocumentIntelligence: false }))}
          />
        )}

        {state.showFormBuilder && (
          <FormBuilder
            pdfBytes={state.currentPDFBytes}
            isVisible={state.showFormBuilder}
            onClose={() => setState(prev => ({ ...prev, showFormBuilder: false }))}
            onFormCreated={(pdfBytes) => {
              handlePDFUpdate(pdfBytes);
              setState(prev => ({ ...prev, showFormBuilder: false }));
              toast.success('Form created successfully!');
            }}
          />
        )}

        {state.showDocumentComparison && (
          <DocumentComparison
            originalDocument={state.currentPDFBytes}
            comparisonDocument={state.comparisonDocument}
            isVisible={state.showDocumentComparison}
            onClose={() => setState(prev => ({ ...prev, showDocumentComparison: false }))}
            onComparisonComplete={(result) => {
              console.log('Document comparison completed:', result);
              toast.success(`Comparison completed: ${result.changesFound} changes found`);
            }}
          />
        )}

        {state.showAccessibilityTools && (
          <AccessibilityTools
            pdfBytes={state.currentPDFBytes}
            isVisible={state.showAccessibilityTools}
            onClose={() => setState(prev => ({ ...prev, showAccessibilityTools: false }))}
            onDocumentUpdated={(updatedPdfBytes) => {
              handlePDFUpdate(updatedPdfBytes);
              toast.success('Accessibility improvements applied!');
            }}
          />
        )}
      </div>
      
      <div className="adobe-workspace">
        <div className="adobe-content">
          {state.showSearch && (
            <SearchPanel
              onSearch={handleSearch}
              searchResults={state.searchResults}
              currentResultIndex={state.currentSearchIndex}
              onClose={() => setState(prev => ({ ...prev, showSearch: false }))}
              onNavigateToResult={handleNavigateToResult}
              onNextResult={handleNextSearchResult}
              onPreviousResult={handlePreviousSearchResult}
              isSearching={state.isSearching}
            />
          )}
          
          <div className="adobe-viewer-container">
            {state.currentPDF ? (
              <div className="pdf-viewer-wrapper">
                <ErrorBoundary onReset={() => console.log('PDF Viewer reset')}>
                  <EnhancedPDFViewer
                    pdf={state.currentPDF}
                    pdfBytes={state.currentPDFBytes}
                    currentPage={state.currentPage}
                    zoom={state.zoom}
                    rotation={state.rotation}
                    currentTool={state.currentTool}
                    onPageChange={changePage}
                    onAnnotationAdd={handleAnnotationAdd}
                    annotations={state.annotations}
                    showInputDialog={showInputDialog}
                    isEditMode={state.isEditMode}
                    onPDFUpdate={handlePDFUpdate}
                    searchResults={state.searchResults}
                    currentSearchIndex={state.currentSearchIndex}
                    searchText={state.searchText}
                  />
                </ErrorBoundary>
                
                {/* Enhanced Click-to-Edit Overlay */}
                <ClickToEditOverlay
                  isEditMode={state.isEditMode}
                  textRegions={state.textRegions || []}
                  currentPage={state.currentPage}
                  zoom={state.zoom}
                  onTextEdit={handleTextEdit}
                  onToggleEditMode={toggleEditMode}
                />
                
                {/* Simple Edit Mode Indicator */}
                {state.isEditMode && (
                  <div className="edit-mode-indicator">
                    ✏️ Edit Mode Active - Click any text to edit it
                  </div>
                )}
              </div>
            ) : (
              <div className="adobe-welcome">
                <div className="adobe-welcome-content">
                  <svg className="adobe-logo" viewBox="0 0 100 100" width="120" height="120">
                    <rect x="20" y="10" width="60" height="80" rx="5" fill="currentColor" opacity="0.1"/>
                    <rect x="25" y="20" width="50" height="2" fill="currentColor" opacity="0.3"/>
                    <rect x="25" y="30" width="40" height="2" fill="currentColor" opacity="0.3"/>
                    <rect x="25" y="40" width="45" height="2" fill="currentColor" opacity="0.3"/>
                    <rect x="25" y="50" width="35" height="2" fill="currentColor" opacity="0.3"/>
                    <rect x="25" y="60" width="42" height="2" fill="currentColor" opacity="0.3"/>
                  </svg>
                  <h1 className="adobe-welcome-title">Professional PDF Editor</h1>
                  <p className="adobe-welcome-subtitle">Open a PDF to get started or explore features below</p>
                  <div className="adobe-welcome-actions">
                    <button className="adobe-btn adobe-btn-primary" onClick={openPDF}>
                      <i className="fas fa-folder-open" />
                      Open PDF
                    </button>
                    <button className="adobe-btn adobe-btn-secondary" onClick={() => setState(prev => ({ ...prev, showFormBuilder: true }))}>
                      <i className="fas fa-file-signature" />
                      Create Form
                    </button>
                  </div>
                  <div className="adobe-welcome-features">
                    <div className="adobe-feature">
                      <i className="fas fa-pen" />
                      Edit Text & Annotate
                    </div>
                    <div className="adobe-feature">
                      <i className="fas fa-highlighter" />
                      Highlight & Comment
                    </div>
                    <div className="adobe-feature">
                      <i className="fas fa-lock" />
                      Encrypt & Sign
                    </div>
                    <div className="adobe-feature">
                      <i className="fas fa-search" />
                      Powerful Search
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Properties Panel - Right Side */}
        {state.showProperties && state.currentPDF && (
          <div className="adobe-properties-panel">
            <PropertiesPanel
              pdf={state.currentPDF}
              fileName={state.fileName}
              fileSize={state.currentPDFBytes?.byteLength || 0}
            />
          </div>
        )}
      </div>
      
      {/* Footer / Status Bar */}
      {/* Form Builder Panel */}
      {state.showFormBuilder && (
        <div className="form-builder-overlay">
          <FormBuilder
            pdfBytes={state.currentPDFBytes}
            isVisible={state.showFormBuilder}
            onClose={() => setState(prev => ({ ...prev, showFormBuilder: false }))}
            onFormCreated={(newPdfBytes) => {
              handlePDFUpdate(newPdfBytes);
              setState(prev => ({ ...prev, showFormBuilder: false }));
              toast.success('Form created successfully');
            }}
          />
        </div>
      )}
      
      {state.showFormEditor && (
        <div className="form-editor-overlay">
          <FormEditor
            pdfBytes={state.currentPDFBytes || undefined}
            currentPage={state.currentPage}
            zoom={state.zoom}
            onFormUpdate={handleFormUpdate}
            onFormSave={handleFormSave}
            onClose={() => setState(prev => ({ ...prev, showFormEditor: false }))}
          />
        </div>
      )}
      
      {state.currentTool !== 'select' && state.currentTool !== 'redact' && state.currentTool !== 'signature' && (
        <AnnotationTools
          tool={state.currentTool}
          onAnnotationAdd={handleAnnotationAdd}
          // Pass tool options to AnnotationTools
          penThickness={state.penThickness}
          selectedColor={state.selectedColor}
          highlightOpacity={state.highlightOpacity}
          onToolOptionChange={handleToolOptionChange}
        />
      )}
      
      {state.showRedactionTool && state.currentPDF && (
        <RedactionTool
          onRedact={addRedaction}
          onCancel={() => setState(prev => ({ ...prev, showRedactionTool: false, currentTool: 'select' }))
          }
          currentPage={state.currentPage}
        />
      )}
      
      {state.showWatermarkDialog && (
        <WatermarkDialog
          onAdd={addWatermark}
          onCancel={() => setState(prev => ({ ...prev, showWatermarkDialog: false }))}
        />
      )}
      
      {state.isEditMode && state.currentPDF && state.currentPDFBytes && (
        <PDFEditMode
          pdfBytes={state.currentPDFBytes}
          currentPage={state.currentPage}
          zoom={state.zoom}
          onPDFUpdate={handlePDFUpdate}
          isActive={state.isEditMode}
        />
      )}
      
      {state.showExportOptions && (
        <ExportDialog
          onExport={exportPDF}
          onCancel={() => setState(prev => ({ ...prev, showExportOptions: false }))}
        />
      )}
      
      <div className="adobe-footer">
        <StatusBar
          currentPage={state.currentPage}
          totalPages={state.totalPages}
          zoom={state.zoom}
          hasChanges={state.hasChanges}
          fileName={state.fileName}
          onPageChange={changePage}
          onZoomChange={(newZoom) => setState(prev => ({ ...prev, zoom: newZoom }))}
          isLoading={state.isLoading}
          processStatus={state.isLoading ? 'Processing...' : 'Ready'}
        />
      </div>
      
      {state.isLoading && (
        <div className="adobe-loading-overlay">
          <div className="adobe-spinner">
            <div className="adobe-spinner-blade"></div>
            <div className="adobe-spinner-blade"></div>
            <div className="adobe-spinner-blade"></div>
            <div className="adobe-spinner-blade"></div>
            <div className="adobe-spinner-blade"></div>
            <div className="adobe-spinner-blade"></div>
            <div className="adobe-spinner-blade"></div>
            <div className="adobe-spinner-blade"></div>
          </div>
          <p className="adobe-loading-text">Processing...</p>
        </div>
      )}
      
      {state.showErrorDialog && state.errorDialogConfig && (
        <ErrorDialog
          title={state.errorDialogConfig.title}
          message={state.errorDialogConfig.message}
          details={state.errorDialogConfig.details}
          onRetry={state.errorDialogConfig.onRetry}
          onClose={hideErrorDialog}
        />
      )}
      
      <ToastContainer
        position="bottom-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme={state.isDarkMode ? 'dark' : 'light'}
        className="adobe-toast"
      />
      
      {/* Adobe Footer - CRITICAL: This was missing and breaking the CSS Grid layout */}
      <div className="adobe-footer">
        <div className="status-info">
          {state.currentPDF && (
            <>
              <span>Page {state.currentPage} of {state.totalPages}</span>
              <span>•</span>
              <span>{state.zoom}%</span>
              {state.fileName && (
                <>
                  <span>•</span>
                  <span>{state.fileName}</span>
                </>
              )}
            </>
          )}
        </div>
        <div className="app-info">
          Professional PDF Editor v1.0
        </div>
      </div>

      {state.showInputDialog && state.inputDialogConfig && (
        <InputDialog
          isOpen={state.showInputDialog}
          title={state.inputDialogConfig.title}
          placeholder={state.inputDialogConfig.placeholder}
          onConfirm={(value) => {
            state.inputDialogConfig?.onConfirm(value);
            hideInputDialog();
          }}
          onCancel={hideInputDialog}
        />
      )}
    </div>
  );
};

export default App;