/**
 * Refactored App Component
 * Simplified version using custom hooks for state management
 */

import React, { useEffect, useRef, useCallback } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import { PDFDocument } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';

// Components
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
import DocumentIntelligencePanel from './components/DocumentIntelligencePanel';
import FormBuilder from './components/FormBuilder';
import DocumentComparison from './components/DocumentComparison';
import AccessibilityTools from './components/AccessibilityTools';
import ErrorBoundary from './components/ErrorBoundary';
import ErrorDialog from './components/ErrorDialog';

// Services
import { PDFService } from './services/PDFService';
import { AnnotationService } from './services/AnnotationService';
import { OCRService } from './services/OCRService';
import { SecurityService } from './services/SecurityService';

// Hooks
import { usePDFState, useUIState, useSearchState } from './hooks';

// Utils
import { loadPDFSafely } from '../common/utils';
import { logger } from './services/LoggerService';

// Styles
import './styles/App.css';
import 'react-toastify/dist/ReactToastify.css';

export const RefactoredApp: React.FC = () => {
  // Custom hooks for state management
  const pdfState = usePDFState();
  const uiState = useUIState();
  const searchState = useSearchState();

  // Service instances
  const pdfServiceRef = useRef(new PDFService());
  const annotationServiceRef = useRef(new AnnotationService());
  const ocrServiceRef = useRef(new OCRService());
  const securityServiceRef = useRef(new SecurityService());

  // PDF Worker configuration
  useEffect(() => {
    if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
      pdfjsLib.GlobalWorkerOptions.workerSrc = './pdfjs/pdf.worker.min.js';
    }
  }, []);

  // Theme application
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', uiState.isDarkMode ? 'dark' : 'light');
  }, [uiState.isDarkMode]);

  // File handling
  const handleFileOpen = useCallback(async () => {
    try {
      if (!electronAPI?.showOpenDialog) {
        throw new Error('File dialog not available');
      }

      pdfState.setLoading(true);
      const result = await electronAPI.showOpenDialog({
        properties: ['openFile'],
        filters: [{ name: 'PDF Files', extensions: ['pdf'] }]
      });

      if (result.canceled || !result.filePaths?.[0]) {
        pdfState.setLoading(false);
        return;
      }

      const filePath = result.filePaths[0];
      const fileName = filePath.split(/[\\/]/).pop() || 'Unknown.pdf';

      // Read file
      const fileData = await electronAPI.readFile(filePath);
      const pdfBytes = new Uint8Array(fileData);

      // Load PDF
      const pdfDoc = await loadPDFSafely(pdfBytes);
      
      // Update state
      pdfState.setCurrentPDF(pdfDoc, pdfBytes, fileName);
      pdfState.setFilePath(filePath);

      toast.success(`Opened ${fileName}`);
      logger.info('PDF opened successfully', { fileName, pages: pdfDoc.numPages });

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to open PDF', error);
      
      uiState.showError({
        title: 'Failed to Open PDF',
        message: `Could not open the selected file: ${message}`,
        details: error instanceof Error ? error.stack : undefined
      });
      
      pdfState.setLoading(false);
    }
  }, [pdfState, uiState]);

  const handleFileSave = useCallback(async () => {
    try {
      if (!pdfState.currentPDFBytes || !electronAPI?.saveFile) {
        throw new Error('No file to save or save API not available');
      }

      pdfState.setLoading(true);

      if (pdfState.filePath) {
        // Save to existing path
        await electronAPI.saveFile(pdfState.filePath, pdfState.currentPDFBytes);
      } else {
        // Show save dialog
        const result = await electronAPI.showSaveDialog({
          filters: [{ name: 'PDF Files', extensions: ['pdf'] }],
          defaultPath: pdfState.fileName || 'document.pdf'
        });

        if (result.canceled || !result.filePath) {
          pdfState.setLoading(false);
          return;
        }

        await electronAPI.saveFile(result.filePath, pdfState.currentPDFBytes);
        pdfState.setFilePath(result.filePath);
      }

      pdfState.markAsSaved();
      toast.success('File saved successfully');
      logger.info('PDF saved successfully', { filePath: pdfState.filePath });

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to save PDF', error);
      
      uiState.showError({
        title: 'Failed to Save PDF',
        message: `Could not save the file: ${message}`,
        details: error instanceof Error ? error.stack : undefined
      });
    } finally {
      pdfState.setLoading(false);
    }
  }, [pdfState, uiState]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'o':
            e.preventDefault();
            handleFileOpen();
            break;
          case 's':
            e.preventDefault();
            handleFileSave();
            break;
          case 'f':
            e.preventDefault();
            uiState.toggleSearch();
            break;
          case 'z':
            if (!e.shiftKey) {
              e.preventDefault();
              const previousBytes = pdfState.undo();
              if (previousBytes) {
                // Reload PDF with previous state
                loadPDFSafely(previousBytes).then(pdf => {
                  pdfState.setCurrentPDF(pdf, previousBytes);
                });
              }
            }
            break;
          case 'y':
            e.preventDefault();
            const nextBytes = pdfState.redo();
            if (nextBytes) {
              // Reload PDF with next state
              loadPDFSafely(nextBytes).then(pdf => {
                pdfState.setCurrentPDF(pdf, nextBytes);
              });
            }
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleFileOpen, handleFileSave, uiState, pdfState]);

  // Loading overlay
  if (pdfState.isLoading) {
    return (
      <div className="adobe-loading-overlay">
        <div className="adobe-spinner-container">
          <div className="adobe-spinner">
            {Array.from({ length: 12 }, (_, i) => (
              <div key={i} className="adobe-spinner-blade" />
            ))}
          </div>
          <p className="adobe-loading-text">Processing...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`app-container ${uiState.isDarkMode ? 'dark-theme' : 'light-theme'}`}>
      <ErrorBoundary>
        {/* Toolbar */}
        <EnhancedToolbar
          currentTool={uiState.currentTool}
          onToolChange={uiState.setCurrentTool}
          onFileOpen={handleFileOpen}
          onFileSave={handleFileSave}
          zoom={pdfState.zoom}
          onZoomChange={pdfState.setZoom}
          canUndo={pdfState.canUndo}
          canRedo={pdfState.canRedo}
          onUndo={() => {
            const bytes = pdfState.undo();
            if (bytes) {
              loadPDFSafely(bytes).then(pdf => {
                pdfState.setCurrentPDF(pdf, bytes);
              });
            }
          }}
          onRedo={() => {
            const bytes = pdfState.redo();
            if (bytes) {
              loadPDFSafely(bytes).then(pdf => {
                pdfState.setCurrentPDF(pdf, bytes);
              });
            }
          }}
          onToggleSearch={uiState.toggleSearch}
          onToggleThumbnails={uiState.toggleThumbnails}
        />

        <div className="app-main">
          {/* Sidebar */}
          {uiState.isSidebarExpanded && (
            <Sidebar
              activeTab={uiState.sidebarTab}
              onTabChange={uiState.setSidebarTab}
              onClose={uiState.toggleSidebar}
            >
              {uiState.sidebarTab === 'thumbnails' && (
                <ThumbnailPanel
                  currentPDF={pdfState.currentPDF}
                  currentPage={pdfState.currentPage}
                  onPageSelect={pdfState.setCurrentPage}
                />
              )}
              {/* Add other sidebar panels as needed */}
            </Sidebar>
          )}

          {/* Main content area */}
          <div className="pdf-viewer-container">
            {pdfState.currentPDF && (
              <EnhancedPDFViewer
                pdf={pdfState.currentPDF}
                currentPage={pdfState.currentPage}
                zoom={pdfState.zoom}
                rotation={pdfState.rotation}
                currentTool={uiState.currentTool}
                selectedColor={uiState.selectedColor}
                penThickness={uiState.penThickness}
                onPageChange={pdfState.setCurrentPage}
              />
            )}
            
            {/* No document message */}
            {!pdfState.currentPDF && (
              <div className="no-document-message">
                <h3>No PDF Loaded</h3>
                <p>Click "Open" to load a PDF document</p>
                <button onClick={handleFileOpen} className="primary-button">
                  Open PDF
                </button>
              </div>
            )}
          </div>

          {/* Properties panel */}
          {uiState.showProperties && (
            <PropertiesPanel
              currentPDF={pdfState.currentPDF}
              onClose={uiState.toggleProperties}
            />
          )}
        </div>

        {/* Status bar */}
        <StatusBar
          currentPage={pdfState.currentPage}
          totalPages={pdfState.totalPages}
          zoom={pdfState.zoom}
          hasChanges={pdfState.hasChanges}
          fileName={pdfState.fileName}
        />

        {/* Search panel */}
        {uiState.showSearch && (
          <SearchPanel
            isOpen={uiState.showSearch}
            searchText={searchState.searchText}
            searchResults={searchState.searchResults}
            currentIndex={searchState.currentSearchIndex}
            isSearching={searchState.isSearching}
            onSearchChange={searchState.setSearchText}
            onSearch={searchState.performSearch}
            onNext={searchState.nextResult}
            onPrevious={searchState.previousResult}
            onClose={uiState.toggleSearch}
            onClear={searchState.clearSearch}
          />
        )}

        {/* Dialogs */}
        {uiState.showInputDialog && uiState.inputDialogConfig && (
          <InputDialog
            isOpen={true}
            title={uiState.inputDialogConfig.title}
            placeholder={uiState.inputDialogConfig.placeholder}
            onConfirm={(value) => {
              uiState.inputDialogConfig?.onConfirm(value);
              uiState.closeInputDialog();
            }}
            onCancel={uiState.closeInputDialog}
          />
        )}

        {uiState.showErrorDialog && uiState.errorDialogConfig && (
          <ErrorDialog
            title={uiState.errorDialogConfig.title}
            message={uiState.errorDialogConfig.message}
            details={uiState.errorDialogConfig.details}
            onRetry={uiState.errorDialogConfig.onRetry}
            onClose={uiState.closeError}
          />
        )}

        {/* Toast notifications */}
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
          theme={uiState.isDarkMode ? 'dark' : 'light'}
          className="adobe-toast"
        />
      </ErrorBoundary>
    </div>
  );
};

export default RefactoredApp;