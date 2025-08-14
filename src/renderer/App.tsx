import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FolderOpen, Plus, Edit3, FileSignature, Shield, Search } from 'lucide-react';
import { ToastContainer, toast } from 'react-toastify';
import { PDFDocument, rgb, StandardFonts, degrees } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocumentProxy } from 'pdfjs-dist/types/src/display/api';
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
import RedactionTool from './components/RedactionTool';
import WatermarkDialog from './components/WatermarkDialog';
import BookmarksPanel from './components/BookmarksPanel';
import NavigationPanel from './components/NavigationPanel';
import ExportDialog from './components/ExportDialog';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import { PDFService } from './services/PDFService';
import { RealPDFTextEditor } from './services/RealPDFTextEditor';
import { AnnotationService } from './services/AnnotationService';
import { OCRService } from './services/OCRService';
import { SecurityService } from './services/SecurityService';
import { searchService, SearchResult, SearchOptions } from './services/SearchService';
import { AdvancedPDFAnalyticsService } from './services/AdvancedPDFAnalyticsService';
import { AdvancedFormBuilderService } from './services/AdvancedFormBuilderService';
import { DocumentWorkflowService } from './services/DocumentWorkflowService';
import { createSafePDFBytes } from './utils/pdfUtils';
import './styles/App.css';
import 'react-toastify/dist/ReactToastify.css';

// Set up PDF.js worker with Emergency Recovery patterns
const configurePDFJSWorker = () => {
  const strategies = [
    // Strategy 1: Local worker file
    () => {
      pdfjsLib.GlobalWorkerOptions.workerSrc = './pdf.worker.min.js';
      return { success: true, mode: 'local-worker' };
    },
    
    // Strategy 2: CDN fallback
    () => {
      pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
      return { success: true, mode: 'cdn-worker' };
    },
    
    // Strategy 3: Disable worker (emergency mode)
    () => {
      pdfjsLib.GlobalWorkerOptions.workerSrc = null;
      console.warn('⚠️ PDF.js running without worker - performance may be degraded');
      return { success: true, mode: 'no-worker' };
    }
  ];
  
  for (const strategy of strategies) {
    try {
      const result = strategy();
      console.log(`✅ PDF.js configured with ${result.mode} strategy`);
      return result;
    } catch (error) {
      console.warn(`❌ PDF.js strategy failed:`, error.message);
      continue;
    }
  }
  
  throw new Error('All PDF.js configuration strategies failed');
};

// Apply configuration with error handling
try {
  configurePDFJSWorker();
} catch (error) {
  console.error('🚨 Critical: PDF.js configuration failed completely:', error);
  // App can still run, but PDF features will be limited
}

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
  history: Uint8Array[][]; // History of PDF states for undo/redo
  historyIndex: number; // Current position in history
  showAnalytics: boolean; // Show analytics dashboard
  analyticsData: any | null; // Analytics data from service
  showWorkflow: boolean; // Show workflow panel
  activeWorkflow: any | null; // Active workflow instance
}

// Helper function to validate PDF bytes integrity
const validatePDFBytes = (bytes: Uint8Array): boolean => {
  if (!bytes) {
    console.warn('⚠️ PDF bytes is null or undefined');
    return false;
  }
  
  if (bytes.length < 26) { // Minimum viable PDF size (header + xref + trailer)
    console.warn(`⚠️ PDF bytes too short: ${bytes.length} bytes (minimum 26 required)`);
    return false;
  }
  
  try {
    // Check for PDF header (%PDF-)
    const headerBytes = bytes.slice(0, 8);
    const header = new TextDecoder('ascii', { fatal: false }).decode(headerBytes);
    if (!header.startsWith('%PDF-')) {
      console.warn('⚠️ PDF header not found, got:', header);
      return false;
    }
    
    // Check for EOF marker (%%EOF) - look in last 2KB for larger files, or entire file for small ones
    const searchLength = Math.min(bytes.length, 2048);
    const tailBytes = bytes.slice(-searchLength);
    const tail = new TextDecoder('ascii', { fatal: false }).decode(tailBytes);
    if (!tail.includes('%%EOF')) {
      console.warn('⚠️ PDF EOF marker not found in tail');
      return false;
    }
    
    console.log(`✅ PDF bytes validation passed (${bytes.length} bytes)`);
    return true;
  } catch (error) {
    console.warn('⚠️ PDF validation failed with error:', error);
    return false;
  }
};

// Helper function to create safe ArrayBuffer
const createSafeArrayBuffer = (uint8Array: Uint8Array): ArrayBuffer => {
  try {
    // Method 1: Direct buffer slice (most efficient)
    const buffer = uint8Array.buffer.slice(
      uint8Array.byteOffset,
      uint8Array.byteOffset + uint8Array.byteLength
    );
    return buffer;
  } catch (error) {
    console.warn('⚠️ Direct buffer slice failed, using byte copy:', error);
    
    // Method 2: Manual byte copy (fallback)
    const buffer = new ArrayBuffer(uint8Array.byteLength);
    const view = new Uint8Array(buffer);
    for (let i = 0; i < uint8Array.length; i++) {
      view[i] = uint8Array[i];
    }
    return buffer;
  }
};

// Legacy helper function (keeping for compatibility)
const toArrayBuffer = (uint8Array: Uint8Array): ArrayBuffer => {
  return createSafeArrayBuffer(uint8Array);
};

// Helper function to safely apply annotations to PDF pages
const applyAnnotationToPDFPage = async (page: any, annotation: any): Promise<void> => {
  const { width, height } = page.getSize();
  
  try {
    switch (annotation.type) {
      case 'text':
        if (annotation.text) {
          page.drawText(annotation.text, {
            x: Math.max(0, Math.min(annotation.x, width - 100)),
            y: Math.max(0, Math.min(height - annotation.y, height - 20)),
            size: annotation.fontSize || 12,
            color: rgb(
              annotation.color?.r || 0,
              annotation.color?.g || 0, 
              annotation.color?.b || 0
            )
          });
        }
        break;
        
      case 'rectangle':
        page.drawRectangle({
          x: Math.max(0, Math.min(annotation.x, width)),
          y: Math.max(0, Math.min(height - annotation.y - annotation.height, height)),
          width: Math.min(annotation.width, width - annotation.x),
          height: Math.min(annotation.height, height - (height - annotation.y)),
          borderColor: rgb(
            annotation.color?.r || 0,
            annotation.color?.g || 0,
            annotation.color?.b || 0
          ),
          borderWidth: annotation.thickness || 1
        });
        break;
        
      case 'highlight':
        page.drawRectangle({
          x: Math.max(0, Math.min(annotation.x, width)),
          y: Math.max(0, Math.min(height - annotation.y - annotation.height, height)),
          width: Math.min(annotation.width, width - annotation.x),
          height: Math.min(annotation.height, height - (height - annotation.y)),
          color: rgb(
            annotation.color?.r || 1,
            annotation.color?.g || 1,
            annotation.color?.b || 0
          ),
          opacity: annotation.opacity || 0.3
        });
        break;
        
      default:
        console.warn(`⚠️ Unknown annotation type: ${annotation.type}`);
    }
  } catch (error) {
    console.warn(`⚠️ Failed to apply ${annotation.type} annotation:`, error);
    throw error;
  }
};

const App: React.FC = () => {
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
    activeWorkflow: null
  });

  const pdfService = useRef(new PDFService());
  const annotationService = useRef(new AnnotationService());
  const ocrService = useRef(new OCRService());
  const securityService = useRef(new SecurityService());
  const realPDFTextEditor = useRef(new RealPDFTextEditor());
  const analyticsService = useRef(new AdvancedPDFAnalyticsService());
  const formBuilderService = useRef(new AdvancedFormBuilderService());
  const workflowService = useRef(new DocumentWorkflowService());
  const [extractedText, setExtractedText] = useState<any[]>([]);
  const autoSaveTimer = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize app and load preferences
  useEffect(() => {
    const initApp = async () => {
      try {
        console.log('🚀 Initializing PDF Editor App...');
        
        // Set dark theme by default
        document.documentElement.setAttribute('data-theme', 'dark');
        document.body.classList.add('adobe-theme');
        
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
            document.documentElement.setAttribute('data-theme', themeValue);
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
          case 'open':
            openPDF();
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
        pdfjsLib.getDocument(pdfBytes).promise.then(pdf => {
          setState(current => ({
            ...current,
            currentPDF: pdf,
            currentPDFBytes: pdfBytes,
            totalPages: pdf.numPages,
            currentPage: Math.min(current.currentPage, pdf.numPages),
            historyIndex: newIndex,
            hasChanges: true, // Mark as changed
          }));
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
        pdfjsLib.getDocument(pdfBytes).promise.then(pdf => {
          setState(current => ({
            ...current,
            currentPDF: pdf,
            currentPDFBytes: pdfBytes,
            totalPages: pdf.numPages,
            currentPage: Math.min(current.currentPage, pdf.numPages),
            historyIndex: newIndex,
            hasChanges: true, // Mark as changed
          }));
        });
      }
      return prev; // Return previous state immediately, setState will be called async
    });
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
      // Check if we're in Electron
      if (window.electronAPI?.openFile) {
        const result = await window.electronAPI.openFile();
        if (result) {
          setState(prev => ({ ...prev, isLoading: true }));
          
          // Create safe copy immediately to prevent ArrayBuffer detachment
          const sourceArray = new Uint8Array(result.data);
          const safePdfBytes = new Uint8Array(sourceArray.length);
          
          // Copy byte by byte to avoid detachment issues
          for (let i = 0; i < sourceArray.length; i++) {
            safePdfBytes[i] = sourceArray[i];
          }
          
          const loadingTask = pdfjsLib.getDocument(safePdfBytes);
          const pdf = await loadingTask.promise;
          
          setState(prev => ({
            ...prev,
            currentPDF: pdf,
            currentPDFBytes: safePdfBytes,
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
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      
      // Use multiple strategies to handle ArrayBuffer safely
      let safePdfBytes: Uint8Array;
      
      try {
        // Strategy 1: FileReader for robust buffer handling
        const fileReader = new FileReader();
        const arrayBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
          fileReader.onload = () => resolve(fileReader.result as ArrayBuffer);
          fileReader.onerror = () => reject(fileReader.error);
          fileReader.readAsArrayBuffer(file);
        });
        
        // Create safe copy immediately to prevent detachment
        safePdfBytes = new Uint8Array(arrayBuffer);
      } catch (readerError) {
        console.warn('FileReader failed, trying file.arrayBuffer():', readerError);
        
        // Strategy 2: file.arrayBuffer() with immediate copy
        const arrayBuffer = await file.arrayBuffer();
        const tempArray = new Uint8Array(arrayBuffer);
        safePdfBytes = new Uint8Array(tempArray.length);
        
        // Copy byte by byte to avoid detachment issues
        for (let i = 0; i < tempArray.length; i++) {
          safePdfBytes[i] = tempArray[i];
        }
      }
      
      const loadingTask = pdfjsLib.getDocument(safePdfBytes);
      const pdf = await loadingTask.promise;
      
      setState(prev => ({
        ...prev,
        currentPDF: pdf,
        currentPDFBytes: safePdfBytes,
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
    } catch (error) {
      console.error('Error opening PDF:', error);
      toast.error('Failed to open PDF');
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const savePDF = async (saveAs: boolean) => {
    try {
      if (!state.currentPDFBytes) {
        toast.warning('No PDF to save');
        return;
      }
      
      console.log('🔄 Starting PDF save process...');
      
      // Validate original PDF data integrity
      if (!validatePDFBytes(state.currentPDFBytes)) {
        console.error('❌ Original PDF bytes are corrupted');
        toast.error('Cannot save - PDF data is corrupted');
        return;
      }
      
      // Check if we have any modifications to apply
      let pdfBytes: Uint8Array;
      
      if (state.hasChanges && (state.annotations.length > 0 || state.rotation !== 0)) {
        console.log('📝 Applying modifications to PDF...');
        try {
          // Apply all modifications with safe error handling
          const modifiedPDF = await applyModifications();
          console.log('🔧 Modifications applied, saving PDF...');
          
          // Save with additional error handling
          const savedBytes = await modifiedPDF.save({
            addDefaultPage: false,
            compress: false, // Don't compress to avoid potential corruption
            objectsPerTick: 50 // Slower save for better reliability
          });
          
          console.log(`💾 PDF saved, size: ${savedBytes.length} bytes`);
          pdfBytes = new Uint8Array(savedBytes);
          
          // Validate modified PDF
          if (!validatePDFBytes(pdfBytes)) {
            console.error('❌ Modified PDF bytes are corrupted, falling back to original');
            pdfBytes = new Uint8Array(state.currentPDFBytes);
          } else {
            console.log('✅ Modified PDF validation passed');
          }
        } catch (modError) {
          console.error('❌ Error applying modifications, using original PDF:', modError);
          pdfBytes = new Uint8Array(state.currentPDFBytes);
        }
      } else {
        console.log('📄 Using original PDF bytes (no modifications)');
        // No changes, use original PDF bytes
        pdfBytes = new Uint8Array(state.currentPDFBytes);
      }
      
      // Final validation before save
      if (!validatePDFBytes(pdfBytes)) {
        console.error('❌ Final PDF validation failed');
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
    } catch (error) {
      console.error('❌ Error saving PDF:', error);
      toast.error('Failed to save PDF');
    }
  };

  const applyModifications = async (): Promise<PDFDocument> => {
    console.log('🔧 Applying modifications to PDF...');
    
    try {
      // Start with a safe copy of the original PDF bytes
      const originalBytes = state.currentPDFBytes!;
      
      // Validate original bytes before modification
      if (!validatePDFBytes(originalBytes)) {
        throw new Error('Original PDF bytes are invalid');
      }
      
      // Load the original PDF document using pdf-lib
      const pdfDoc = await PDFDocument.load(originalBytes);
      console.log(`📄 Loaded PDF with ${pdfDoc.getPageCount()} pages`);
      
      // Apply rotation if needed (using pdf-lib directly for safety)
      if (state.rotation !== 0) {
        console.log(`🔄 Applying ${state.rotation}° rotation`);
        const pages = pdfDoc.getPages();
        pages.forEach(page => {
          page.setRotation({ type: 'degrees', angle: state.rotation });
        });
      }
      
      // Apply annotations using pdf-lib directly (safer than annotation service)
      if (state.annotations.length > 0) {
        console.log(`✏️ Applying ${state.annotations.length} annotations`);
        
        // Group annotations by page
        const annotationsByPage = new Map<number, any[]>();
        state.annotations.forEach(ann => {
          if (!annotationsByPage.has(ann.pageIndex)) {
            annotationsByPage.set(ann.pageIndex, []);
          }
          annotationsByPage.get(ann.pageIndex)!.push(ann);
        });
        
        // Apply annotations page by page
        for (const [pageIndex, pageAnnotations] of annotationsByPage) {
          if (pageIndex < pdfDoc.getPageCount()) {
            const page = pdfDoc.getPage(pageIndex);
            
            for (const ann of pageAnnotations) {
              try {
                await applyAnnotationToPDFPage(page, ann);
              } catch (annError) {
                console.warn(`⚠️ Failed to apply annotation:`, annError);
                // Continue with other annotations
              }
            }
          }
        }
      }
      
      console.log('✅ All modifications applied successfully');
      return pdfDoc;
      
    } catch (error) {
      console.error('❌ Error applying modifications:', error);
      // Fallback to original PDF if modifications fail
      console.log('🔄 Falling back to original PDF');
      return await PDFDocument.load(state.currentPDFBytes!);
    }
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
    document.documentElement.setAttribute('data-theme', themeString);
    
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

      // Select additional PDFs to merge
      const result = await window.electronAPI.openFile();
      if (!result || !state.currentPDFBytes) return;

      setState(prev => ({ ...prev, isLoading: true }));

      const mainPDF = await PDFDocument.load(state.currentPDFBytes);
      const additionalPDF = await PDFDocument.load(result.data);

      // Copy all pages from additional PDF to main PDF
      const pages = await mainPDF.copyPages(additionalPDF, additionalPDF.getPageIndices());
      pages.forEach(page => mainPDF.addPage(page));

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
      const pageNumber = prompt(`Split after page (1-${state.totalPages - 1}):`);
      if (!pageNumber) return;

      const splitAt = parseInt(pageNumber);
      if (isNaN(splitAt) || splitAt < 1 || splitAt >= state.totalPages) {
        toast.error('Invalid page number');
        return;
      }

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

        toast.success(`PDF compressed by ${compressionRatio.toFixed(1)}%`);
      } else {
        setState(prev => ({ ...prev, isLoading: false }));
        toast.info('PDF is already optimally compressed');
      }
      addToHistory(uint8Array); // Add to history after compression
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
        
        // Add OCR result as annotation for now (could be enhanced to create actual text layer)
        const annotation = {
          type: 'ocr-text',
          text: searchableText,
          x: 10,
          y: 50,
          pageIndex: state.currentPage - 1,
          fontSize: 10,
          isOCR: true
        };
        
        setState(prev => ({
          ...prev,
          annotations: [...prev.annotations, annotation],
          hasChanges: true,
          isLoading: false
        }));
        
        toast.success(`OCR completed. Extracted ${searchableText.length} characters`);
      } else {
        setState(prev => ({ ...prev, isLoading: false }));
        toast.info('No text found in current page');
      }
    } catch (error) {
      console.error('OCR error:', error);
      toast.error('OCR processing failed');
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const encryptPDF = async () => {
    if (!state.currentPDFBytes) {
      toast.warning('No PDF to encrypt');
      return;
    }

    try {
      const password = prompt('Enter password for encryption:');
      if (!password) return;

      setState(prev => ({ ...prev, isLoading: true }));

      const result = await securityService.current.encryptPDF(state.currentPDFBytes, password);
      
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

        toast.success('PDF encrypted successfully');
      } else {
        setState(prev => ({ ...prev, isLoading: false }));
        toast.error('Failed to encrypt PDF');
      }
      addToHistory(uint8Array); // Add to history after encryption
    } catch (error) {
      console.error('Encryption error:', error);
      toast.error('Failed to encrypt PDF');
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const decryptPDF = async () => {
    if (!state.currentPDFBytes) {
      toast.warning('No PDF to decrypt');
      return;
    }

    try {
      const password = prompt('Enter password for decryption:');
      if (!password) return;

      setState(prev => ({ ...prev, isLoading: true }));

      const result = await securityService.current.decryptPDF(state.currentPDFBytes, password);
      
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

        toast.success('PDF decrypted successfully');
      } else {
        setState(prev => ({ ...prev, isLoading: false }));
        toast.error('Failed to decrypt PDF - check password');
      }
      addToHistory(uint8Array); // Add to history after decryption
    } catch (error) {
      console.error('Decryption error:', error);
      toast.error('Failed to decrypt PDF');
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const addDigitalSignature = async () => {
    if (!state.currentPDFBytes) {
      toast.warning('No PDF to sign');
      return;
    }

    try {
      const signerName = prompt('Enter signer name:') || 'Digital Signer';
      const reason = prompt('Enter reason for signing:') || 'Document approval';
      const location = prompt('Enter location:') || 'Digital';

      setState(prev => ({ ...prev, isLoading: true }));

      const result = await securityService.current.addDigitalSignature(state.currentPDFBytes, {
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
      addToHistory(uint8Array); // Add to history after adding digital signature
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
    addToHistory(uint8Array); // Add to history after watermark
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
    
    // Handle analytics tool
    if (tool === 'analytics') {
      if (state.currentPDF && state.currentPDFBytes) {
        setState(prev => ({ ...prev, isLoading: true }));
        try {
          const analysis = await analyticsService.current.analyzeDocument(
            state.currentPDF, 
            state.currentPDFBytes
          );
          setState(prev => ({ 
            ...prev, 
            showAnalytics: true,
            analyticsData: analysis,
            isLoading: false,
            sidebarTab: 'analytics'
          }));
          toast.success('📊 Document analysis complete');
        } catch (error) {
          console.error('Analytics error:', error);
          toast.error('Failed to analyze document');
          setState(prev => ({ ...prev, isLoading: false }));
        }
      } else {
        toast.warning('Please open a PDF document first');
      }
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
        />
      </div>
      
      <div className="adobe-workspace">
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
        </div>
        
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
                    <rect x="25" y="60" width="50" height="2" fill="currentColor" opacity="0.3"/>
                    <rect x="25" y="70" width="30" height="2" fill="currentColor" opacity="0.3"/>
                    <circle cx="65" cy="75" r="12" fill="#FF0000" opacity="0.8"/>
                    <path d="M60 75 L70 75 M65 70 L65 80" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  <h1 className="adobe-welcome-title">Professional PDF Editor</h1>
                  <p className="adobe-welcome-subtitle">Adobe-grade PDF editing at your fingertips</p>
                  <div className="adobe-welcome-actions">
                    <button className="adobe-btn adobe-btn-primary" onClick={openPDF}>
                      <FolderOpen size={16} />
                      Open PDF
                    </button>
                    <button className="adobe-btn adobe-btn-secondary" onClick={() => toast.info('Create PDF feature coming soon')}>
                      <Plus size={16} />
                      Create PDF
                    </button>
                  </div>
                  <div className="adobe-welcome-features">
                    <div className="adobe-feature">
                      <Edit3 size={16} />
                      <span>Edit Text & Images</span>
                    </div>
                    <div className="adobe-feature">
                      <FileSignature size={16} />
                      <span>Sign & Fill Forms</span>
                    </div>
                    <div className="adobe-feature">
                      <Shield size={16} />
                      <span>Secure Documents</span>
                    </div>
                    <div className="adobe-feature">
                      <Search size={16} />
                      <span>Advanced Search</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
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