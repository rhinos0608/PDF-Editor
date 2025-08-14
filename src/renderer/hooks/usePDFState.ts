import { useState, useCallback } from 'react';
import { PDFDocumentProxy } from 'pdfjs-dist/types/src/display/api';
import { SearchResult } from '../services/SearchService';
import { createSafePDFBytes } from '../../common/utils';

export interface PDFState {
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
  showRedactionTool: boolean;
  showWatermarkDialog: boolean;
  bookmarks: any[];
  showBookmarks: boolean;
  showNavigation: boolean;
  isCompressing: boolean;
  compressionRatio: number;
  showExportOptions: boolean;
  exportFormat: string;
  penThickness: number;
  selectedColor: { r: number; g: number; b: number };
  highlightOpacity: number;
  isSidebarExpanded: boolean;
  history: Uint8Array[][];
  historyIndex: number;
  showAnalytics: boolean;
  ocrResults: { [pageIndex: number]: any };
}

const initialState: PDFState = {
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
  showRedactionTool: false,
  showWatermarkDialog: false,
  bookmarks: [],
  showBookmarks: false,
  showNavigation: false,
  isCompressing: false,
  compressionRatio: 0,
  showExportOptions: false,
  exportFormat: 'pdf',
  penThickness: 2,
  selectedColor: { r: 1, g: 0, b: 0 },
  highlightOpacity: 0.3,
  isSidebarExpanded: false,
  history: [],
  historyIndex: -1,
  showAnalytics: false,
  ocrResults: {}
};

/**
 * Custom hook for PDF state management with performance optimizations
 * 
 * This hook extracts state logic from the massive App.tsx component,
 * providing memoized updaters to prevent unnecessary re-renders.
 */
export const usePDFState = () => {
  const [state, setState] = useState<PDFState>(initialState);

  // Memoized state updaters to prevent unnecessary re-renders
  const updatePDF = useCallback((pdf: PDFDocumentProxy, pdfBytes: Uint8Array) => {
    setState(prev => ({
      ...prev,
      currentPDF: pdf,
      currentPDFBytes: createSafePDFBytes(pdfBytes),
      totalPages: pdf.numPages,
      currentPage: 1,
      hasChanges: false,
      annotations: [],
      searchResults: [],
      currentSearchIndex: -1
    }));
  }, []);

  const updatePage = useCallback((page: number) => {
    setState(prev => ({
      ...prev,
      currentPage: Math.max(1, Math.min(page, prev.totalPages))
    }));
  }, []);

  const updateZoom = useCallback((zoom: number) => {
    setState(prev => ({
      ...prev,
      zoom: Math.max(25, Math.min(400, zoom))
    }));
  }, []);

  const updateTool = useCallback((tool: string) => {
    setState(prev => ({
      ...prev,
      currentTool: tool,
      isEditMode: tool === 'edit'
    }));
  }, []);

  const updateSearch = useCallback((searchText: string, searchResults: SearchResult[], currentSearchIndex: number = 0) => {
    setState(prev => ({
      ...prev,
      searchText,
      searchResults,
      currentSearchIndex,
      isSearching: false
    }));
  }, []);

  const updateAnnotations = useCallback((annotations: any[]) => {
    setState(prev => ({
      ...prev,
      annotations,
      hasChanges: true
    }));
  }, []);

  const updateLoading = useCallback((isLoading: boolean) => {
    setState(prev => ({
      ...prev,
      isLoading
    }));
  }, []);

  const updateFileInfo = useCallback((fileName: string, filePath: string | null) => {
    setState(prev => ({
      ...prev,
      fileName,
      filePath,
      hasChanges: false
    }));
  }, []);

  const resetState = useCallback(() => {
    setState(initialState);
  }, []);

  // History management with performance optimization
  const addToHistory = useCallback((pdfBytes: Uint8Array) => {
    setState(prev => {
      const newHistory = prev.history.slice(0, prev.historyIndex + 1);
      newHistory.push(createSafePDFBytes(pdfBytes));
      
      // Limit history size to prevent memory issues (key performance optimization)
      const maxHistorySize = 10;
      if (newHistory.length > maxHistorySize) {
        newHistory.shift();
      }
      
      return {
        ...prev,
        history: newHistory,
        historyIndex: newHistory.length - 1
      };
    });
  }, []);

  const undo = useCallback(() => {
    setState(prev => {
      if (prev.historyIndex > 0) {
        return {
          ...prev,
          historyIndex: prev.historyIndex - 1,
          currentPDFBytes: prev.history[prev.historyIndex - 1],
          hasChanges: true
        };
      }
      return prev;
    });
  }, []);

  const redo = useCallback(() => {
    setState(prev => {
      if (prev.historyIndex < prev.history.length - 1) {
        return {
          ...prev,
          historyIndex: prev.historyIndex + 1,
          currentPDFBytes: prev.history[prev.historyIndex + 1],
          hasChanges: true
        };
      }
      return prev;
    });
  }, []);

  // Generic state updater for less common updates
  const updateState = useCallback((updates: Partial<PDFState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  return {
    state,
    setState,
    // Optimized updaters that prevent unnecessary re-renders
    updatePDF,
    updatePage,
    updateZoom,
    updateTool,
    updateSearch,
    updateAnnotations,
    updateLoading,
    updateFileInfo,
    resetState,
    addToHistory,
    undo,
    redo,
    updateState,
    // Computed values (memoized)
    canUndo: state.historyIndex > 0,
    canRedo: state.historyIndex < state.history.length - 1,
    hasDocument: !!state.currentPDF
  };
};
