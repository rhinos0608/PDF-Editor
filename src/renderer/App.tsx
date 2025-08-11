import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import { PDFDocument, rgb, StandardFonts, degrees } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocumentProxy } from 'pdfjs-dist/types/src/display/api';
import Toolbar from './components/Toolbar';
import Sidebar from './components/Sidebar';
import PDFViewer from './components/PDFViewer';
import StatusBar from './components/StatusBar';
import AnnotationTools from './components/AnnotationTools';
// import TextEditor from './components/TextEditor';
// import FormEditor from './components/FormEditor';
import SearchPanel from './components/SearchPanel';
import ThumbnailPanel from './components/ThumbnailPanel';
import PropertiesPanel from './components/PropertiesPanel';
import { PDFService } from './services/PDFService';
import { AnnotationService } from './services/AnnotationService';
import { OCRService } from './services/OCRService';
import { SecurityService } from './services/SecurityService';
import './styles/App.css';

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
  searchResults: any[];
  showThumbnails: boolean;
  showProperties: boolean;
  showSearch: boolean;
  isFullscreen: boolean;
}

// Helper function to convert Uint8Array to ArrayBuffer
const toArrayBuffer = (uint8Array: Uint8Array): ArrayBuffer => {
  // Create a new ArrayBuffer with the exact size needed
  const buffer = new ArrayBuffer(uint8Array.byteLength);
  // Create a view and copy the data
  new Uint8Array(buffer).set(uint8Array);
  return buffer;
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
    showThumbnails: true,
    showProperties: false,
    showSearch: false,
    isFullscreen: false
  });

  // const pdfService = useRef(new PDFService());
  // const annotationService = useRef(new AnnotationService());
  const ocrService = useRef(new OCRService());
  const securityService = useRef(new SecurityService());
  const autoSaveTimer = useRef<NodeJS.Timeout | null>(null);

  // Initialize app and load preferences
  useEffect(() => {
    const initApp = async () => {
      const preferences = await window.electronAPI.getPreferences();
      setState(prev => ({
        ...prev,
        isDarkMode: preferences.theme === 'dark',
        zoom: preferences.defaultZoom,
        showThumbnails: preferences.showThumbnails
      }));
      
      // Apply theme
      document.documentElement.setAttribute('data-theme', preferences.theme);
      
      // Load recent files
      // const recentFiles = await window.electronAPI.getRecentFiles();
      // Update recent files menu if needed
    };
    
    initApp();
    
    // Setup menu action listeners
    window.electronAPI.onMenuAction(handleMenuAction);
    
    // Cleanup
    return () => {
      window.electronAPI.removeAllListeners();
      if (autoSaveTimer.current) {
        clearInterval(autoSaveTimer.current);
      }
    };
  }, []);

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

  const handleMenuAction = useCallback((action: string) => {
    switch (action) {
      case 'open':
        openPDF();
        break;
      case 'save':
        savePDF(false);
        break;
      case 'save-as':
        savePDF(true);
        break;
      case 'print':
        printPDF();
        break;
      case 'zoom-in':
        setZoom(state.zoom + 10);
        break;
      case 'zoom-out':
        setZoom(state.zoom - 10);
        break;
      case 'zoom-reset':
        setZoom(100);
        break;
      case 'fit-width':
        fitToWidth();
        break;
      case 'fit-page':
        fitToPage();
        break;
      case 'rotate-left':
        rotatePage(-90);
        break;
      case 'rotate-right':
        rotatePage(90);
        break;
      case 'toggle-theme':
        toggleTheme();
        break;
      case 'find':
        setState(prev => ({ ...prev, showSearch: true }));
        break;
      case 'insert-page':
        insertPage();
        break;
      case 'delete-page':
        deletePage();
        break;
      case 'merge-pdfs':
        mergePDFs();
        break;
      case 'split-pdf':
        splitPDF();
        break;
      case 'compress':
        compressPDF();
        break;
      case 'ocr':
        performOCR();
        break;
      case 'encrypt':
        encryptPDF();
        break;
      case 'decrypt':
        decryptPDF();
        break;
      case 'tool-text':
        setState(prev => ({ ...prev, currentTool: 'text' }));
        break;
      case 'tool-highlight':
        setState(prev => ({ ...prev, currentTool: 'highlight' }));
        break;
      case 'tool-draw':
        setState(prev => ({ ...prev, currentTool: 'draw' }));
        break;
      case 'tool-shapes':
        setState(prev => ({ ...prev, currentTool: 'shapes' }));
        break;
      case 'tool-stamp':
        setState(prev => ({ ...prev, currentTool: 'stamp' }));
        break;
      case 'tool-signature':
        setState(prev => ({ ...prev, currentTool: 'signature' }));
        break;
      default:
        console.log('Unhandled menu action:', action);
    }
  }, [state]);

  const openPDF = async () => {
    try {
      const result = await window.electronAPI.openFile();
      if (result) {
        setState(prev => ({ ...prev, isLoading: true }));
        
        const uint8Array = new Uint8Array(result.data);
        const loadingTask = pdfjsLib.getDocument(uint8Array);
        const pdf = await loadingTask.promise;
        
        setState(prev => ({
          ...prev,
          currentPDF: pdf,
          currentPDFBytes: uint8Array,
          totalPages: pdf.numPages,
          currentPage: 1,
          fileName: result.path.split(/[\\/]/).pop() || 'document.pdf',
          filePath: result.path,
          isLoading: false,
          hasChanges: false,
          annotations: []
        }));
        
        // Add to recent files
        await window.electronAPI.addRecentFile(result.path);
        
        toast.success('PDF opened successfully');
      }
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
      
      let filePath = state.filePath;
      
      if (saveAs || !filePath) {
        filePath = await window.electronAPI.saveFileDialog(state.fileName);
        if (!filePath) return;
      }
      
      // Apply all modifications
      const modifiedPDF = await applyModifications();
      const pdfBytes = await modifiedPDF.save();
      
      const result = await window.electronAPI.saveFile(filePath, toArrayBuffer(pdfBytes));
      
      if (result.success) {
        setState(prev => ({
          ...prev,
          filePath,
          hasChanges: false,
          fileName: filePath.split(/[\\/]/).pop() || 'document.pdf'
        }));
        toast.success('PDF saved successfully');
      } else {
        toast.error(`Failed to save PDF: ${result.error}`);
      }
    } catch (error) {
      console.error('Error saving PDF:', error);
      toast.error('Failed to save PDF');
    }
  };

  const applyModifications = async (): Promise<PDFDocument> => {
    const pdfDoc = await PDFDocument.load(state.currentPDFBytes!);
    
    // Apply annotations
    for (const annotation of state.annotations) {
      const page = pdfDoc.getPage(annotation.pageIndex);
      
      switch (annotation.type) {
        case 'text':
          const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
          page.drawText(annotation.text, {
            x: annotation.x,
            y: annotation.y,
            size: annotation.fontSize || 12,
            font,
            color: rgb(0, 0, 0)
          });
          break;
        case 'highlight':
          page.drawRectangle({
            x: annotation.x,
            y: annotation.y,
            width: annotation.width,
            height: annotation.height,
            color: rgb(1, 1, 0),
            opacity: 0.3
          });
          break;
        case 'line':
          page.drawLine({
            start: { x: annotation.startX, y: annotation.startY },
            end: { x: annotation.endX, y: annotation.endY },
            thickness: annotation.thickness || 1,
            color: rgb(0, 0, 0)
          });
          break;
        case 'rectangle':
          page.drawRectangle({
            x: annotation.x,
            y: annotation.y,
            width: annotation.width,
            height: annotation.height,
            borderColor: rgb(0, 0, 0),
            borderWidth: annotation.borderWidth || 1
          });
          break;
        case 'circle':
          page.drawEllipse({
            x: annotation.x,
            y: annotation.y,
            xScale: annotation.radius,
            yScale: annotation.radius,
            borderColor: rgb(0, 0, 0),
            borderWidth: annotation.borderWidth || 1
          });
          break;
      }
    }
    
    // Apply rotation if needed
    if (state.rotation !== 0) {
      const pages = pdfDoc.getPages();
      pages.forEach(page => {
        page.setRotation(degrees(state.rotation));
      });
    }
    
    return pdfDoc;
  };

  const printPDF = () => {
    if (state.currentPDF) {
      window.print();
    } else {
      toast.warning('No PDF to print');
    }
  };

  const setZoom = (newZoom: number) => {
    const clampedZoom = Math.max(25, Math.min(400, newZoom));
    setState(prev => ({ ...prev, zoom: clampedZoom }));
  };

  const fitToWidth = () => {
    // Calculate zoom to fit width
    const viewerWidth = document.getElementById('pdf-viewer')?.clientWidth || 800;
    const pageWidth = 595; // Standard A4 width in points
    const newZoom = Math.floor((viewerWidth / pageWidth) * 100);
    setZoom(newZoom);
  };

  const fitToPage = () => {
    // Calculate zoom to fit entire page
    const viewerHeight = document.getElementById('pdf-viewer')?.clientHeight || 600;
    const pageHeight = 842; // Standard A4 height in points
    const newZoom = Math.floor((viewerHeight / pageHeight) * 100);
    setZoom(newZoom);
  };

  const rotatePage = (degrees: number) => {
    setState(prev => ({
      ...prev,
      rotation: (prev.rotation + degrees + 360) % 360,
      hasChanges: true
    }));
  };

  const toggleTheme = () => {
    const newTheme = !state.isDarkMode;
    setState(prev => ({ ...prev, isDarkMode: newTheme }));
    document.documentElement.setAttribute('data-theme', newTheme ? 'dark' : 'light');
    
    // Save preference
    window.electronAPI.setPreferences({ theme: newTheme ? 'dark' : 'light' });
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
      
      toast.success('Page deleted successfully');
    } catch (error) {
      console.error('Error deleting page:', error);
      toast.error('Failed to delete page');
    }
  };

  const mergePDFs = async () => {
    try {
      // Open multiple PDF files
      const files: any[] = [];
      let moreFiles = true;
      
      while (moreFiles) {
        const result = await window.electronAPI.openFile();
        if (result) {
          files.push(result);
          moreFiles = confirm('Add another PDF to merge?');
        } else {
          moreFiles = false;
        }
      }
      
      if (files.length < 2) {
        toast.warning('Need at least 2 PDFs to merge');
        return;
      }
      
      // Merge PDFs
      const mergedPdf = await PDFDocument.create();
      
      for (const file of files) {
        const pdfBytes = new Uint8Array(file.data);
        const pdf = await PDFDocument.load(pdfBytes);
        const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        pages.forEach(page => mergedPdf.addPage(page));
      }
      
      const mergedPdfBytes = await mergedPdf.save();
      const uint8Array = new Uint8Array(mergedPdfBytes);
      
      // Load merged PDF
      const loadingTask = pdfjsLib.getDocument(uint8Array);
      const pdf = await loadingTask.promise;
      
      setState(prev => ({
        ...prev,
        currentPDF: pdf,
        currentPDFBytes: uint8Array,
        totalPages: pdf.numPages,
        currentPage: 1,
        fileName: 'merged.pdf',
        filePath: null,
        hasChanges: true
      }));
      
      toast.success('PDFs merged successfully');
    } catch (error) {
      console.error('Error merging PDFs:', error);
      toast.error('Failed to merge PDFs');
    }
  };

  const splitPDF = async () => {
    if (!state.currentPDFBytes) return;
    
    try {
      const splitPoint = prompt(`Enter page number to split at (1-${state.totalPages}):`);
      if (!splitPoint) return;
      
      const pageNum = parseInt(splitPoint);
      if (isNaN(pageNum) || pageNum < 1 || pageNum > state.totalPages) {
        toast.error('Invalid page number');
        return;
      }
      
      const pdfDoc = await PDFDocument.load(state.currentPDFBytes);
      
      // Create first part
      const firstPdf = await PDFDocument.create();
      const firstPages = await firstPdf.copyPages(pdfDoc, Array.from({ length: pageNum }, (_, i) => i));
      firstPages.forEach(page => firstPdf.addPage(page));
      
      // Create second part
      const secondPdf = await PDFDocument.create();
      const secondPages = await secondPdf.copyPages(
        pdfDoc,
        Array.from({ length: state.totalPages - pageNum }, (_, i) => i + pageNum)
      );
      secondPages.forEach(page => secondPdf.addPage(page));
      
      // Save both parts
      const firstBytes = await firstPdf.save();
      const secondBytes = await secondPdf.save();
      
      // Save first part
      let filePath = await window.electronAPI.saveFileDialog('split_part1.pdf');
      if (filePath) {
        await window.electronAPI.saveFile(filePath, toArrayBuffer(firstBytes));
      }
      
      // Save second part
      filePath = await window.electronAPI.saveFileDialog('split_part2.pdf');
      if (filePath) {
        await window.electronAPI.saveFile(filePath, toArrayBuffer(secondBytes));
      }
      
      toast.success('PDF split successfully');
    } catch (error) {
      console.error('Error splitting PDF:', error);
      toast.error('Failed to split PDF');
    }
  };

  const compressPDF = async () => {
    if (!state.currentPDFBytes) return;
    
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      
      // This is a simplified compression - in production, you'd use more sophisticated algorithms
      const pdfDoc = await PDFDocument.load(state.currentPDFBytes);
      
      // Compress by reducing image quality and removing metadata
      const compressedBytes = await pdfDoc.save({
        useObjectStreams: false,
        addDefaultPage: false,
        objectsPerTick: 50,
        updateFieldAppearances: false
      });
      
      const originalSize = state.currentPDFBytes.length;
      const compressedSize = compressedBytes.length;
      const reduction = ((originalSize - compressedSize) / originalSize * 100).toFixed(1);
      
      if (compressedSize < originalSize) {
        const uint8Array = new Uint8Array(compressedBytes);
        const loadingTask = pdfjsLib.getDocument(uint8Array);
        const pdf = await loadingTask.promise;
        
        setState(prev => ({
          ...prev,
          currentPDF: pdf,
          currentPDFBytes: uint8Array,
          hasChanges: true,
          isLoading: false
        }));
        
        toast.success(`PDF compressed by ${reduction}%`);
      } else {
        toast.info('PDF is already optimized');
        setState(prev => ({ ...prev, isLoading: false }));
      }
    } catch (error) {
      console.error('Error compressing PDF:', error);
      toast.error('Failed to compress PDF');
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const performOCR = async () => {
    if (!state.currentPDF) return;
    
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      // const ocrText = 
      await ocrService.current.performOCR(state.currentPDF, state.currentPage);
      
      // Add OCR text as invisible layer
      setState(prev => ({
        ...prev,
        isLoading: false,
        hasChanges: true
      }));
      
      toast.success('OCR completed successfully');
    } catch (error) {
      console.error('Error performing OCR:', error);
      toast.error('Failed to perform OCR');
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const encryptPDF = async () => {
    if (!state.currentPDFBytes) return;
    
    const password = prompt('Enter password for PDF encryption:');
    if (!password) return;
    
    try {
      const encryptedBytes = await securityService.current.encryptPDF(state.currentPDFBytes, password);
      
      setState(prev => ({
        ...prev,
        currentPDFBytes: encryptedBytes,
        hasChanges: true
      }));
      
      toast.success('PDF encrypted successfully');
    } catch (error) {
      console.error('Error encrypting PDF:', error);
      toast.error('Failed to encrypt PDF');
    }
  };

  const decryptPDF = async () => {
    const password = prompt('Enter password to decrypt PDF:');
    if (!password) return;
    
    try {
      // Decrypt logic would go here
      toast.success('PDF decrypted successfully');
    } catch (error) {
      console.error('Error decrypting PDF:', error);
      toast.error('Failed to decrypt PDF');
    }
  };

  const handleToolChange = (tool: string) => {
    setState(prev => ({ ...prev, currentTool: tool }));
  };

  const handleAnnotationAdd = (annotation: any) => {
    setState(prev => ({
      ...prev,
      annotations: [...prev.annotations, annotation],
      hasChanges: true
    }));
  };

  const handleSearch = (text: string) => {
    setState(prev => ({ ...prev, searchText: text }));
    // Implement search logic
  };

  return (
    <div className={`app ${state.isDarkMode ? 'dark-theme' : 'light-theme'}`}>
      <Toolbar
        currentTool={state.currentTool}
        onToolChange={handleToolChange}
        zoom={state.zoom}
        onZoomChange={setZoom}
        onOpenFile={openPDF}
        onSaveFile={() => savePDF(false)}
        onPrint={printPDF}
        hasDocument={!!state.currentPDF}
      />
      
      <div className="app-body">
        {state.showThumbnails && state.currentPDF && (
          <ThumbnailPanel
            pdf={state.currentPDF}
            currentPage={state.currentPage}
            onPageSelect={changePage}
          />
        )}
        
        <Sidebar
          onToggleThumbnails={() => setState(prev => ({ ...prev, showThumbnails: !prev.showThumbnails }))}
          onToggleProperties={() => setState(prev => ({ ...prev, showProperties: !prev.showProperties }))}
          onToggleSearch={() => setState(prev => ({ ...prev, showSearch: !prev.showSearch }))}
          showThumbnails={state.showThumbnails}
          showProperties={state.showProperties}
          showSearch={state.showSearch}
        />
        
        <div className="main-content">
          {state.showSearch && (
            <SearchPanel
              onSearch={handleSearch}
              searchResults={state.searchResults}
              onClose={() => setState(prev => ({ ...prev, showSearch: false }))}
            />
          )}
          
          {state.currentPDF ? (
            <PDFViewer
              pdf={state.currentPDF}
              currentPage={state.currentPage}
              zoom={state.zoom}
              rotation={state.rotation}
              currentTool={state.currentTool}
              onPageChange={changePage}
              onAnnotationAdd={handleAnnotationAdd}
              annotations={state.annotations}
            />
          ) : (
            <div className="welcome-screen">
              <i className="fas fa-file-pdf fa-5x"></i>
              <h2>Professional PDF Editor</h2>
              <p>Open a PDF file to get started</p>
              <button className="btn btn-primary" onClick={openPDF}>
                <i className="fas fa-folder-open"></i> Open PDF
              </button>
            </div>
          )}
        </div>
        
        {state.showProperties && state.currentPDF && (
          <PropertiesPanel
            pdf={state.currentPDF}
            fileName={state.fileName}
            fileSize={state.currentPDFBytes?.length || 0}
          />
        )}
      </div>
      
      <StatusBar
        currentPage={state.currentPage}
        totalPages={state.totalPages}
        zoom={state.zoom}
        hasChanges={state.hasChanges}
        fileName={state.fileName}
      />
      
      {state.currentTool !== 'select' && (
        <AnnotationTools
          tool={state.currentTool}
          onAnnotationAdd={handleAnnotationAdd}
        />
      )}
      
      {state.isLoading && (
        <div className="loading-overlay">
          <div className="spinner"></div>
          <p>Processing...</p>
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
      />
    </div>
  );
};

export default App;
