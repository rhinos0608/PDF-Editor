/**
 * Document Store - Manages PDF document state
 * Part of the modular state management system
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { PDFDocumentProxy } from 'pdfjs-dist/types/src/display/api';
import { createSafePDFBytes, validatePDFBytes, loadPDFSafely } from '../utils/safeArrayBuffer';

// Document state interface
interface DocumentState {
  // PDF document data
  currentPDF: PDFDocumentProxy | null;
  currentPDFBytes: Uint8Array | null;
  currentPage: number;
  totalPages: number;
  fileName: string;
  filePath: string | null;
  
  // Document metadata
  hasChanges: boolean;
  isLoaded: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Document operations history
  history: Uint8Array[];
  historyIndex: number;
}

// Document actions interface
interface DocumentActions {
  // Loading operations
  loadPDF: (bytes: Uint8Array, fileName?: string, filePath?: string) => Promise<void>;
  unloadPDF: () => void;
  
  // Navigation
  changePage: (page: number) => void;
  goToNextPage: () => void;
  goToPreviousPage: () => void;
  
  // History management
  addToHistory: (pdfBytes: Uint8Array) => void;
  undo: () => void;
  redo: () => void;
  
  // State updates
  setHasChanges: (hasChanges: boolean) => void;
  setError: (error: string | null) => void;
  setLoading: (isLoading: boolean) => void;
  
  // Reset
  reset: () => void;
}

// Combined document store type
type DocumentStore = DocumentState & DocumentActions;

// Initial document state
const initialDocumentState: DocumentState = {
  currentPDF: null,
  currentPDFBytes: null,
  currentPage: 1,
  totalPages: 0,
  fileName: '',
  filePath: null,
  hasChanges: false,
  isLoaded: false,
  isLoading: false,
  error: null,
  history: [],
  historyIndex: -1
};

// Document store implementation
export const useDocumentStore = create<DocumentStore>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        ...initialDocumentState,
        
        // Load PDF document
        loadPDF: async (bytes: Uint8Array, fileName?: string, filePath?: string) => {
          set({ isLoading: true, error: null });
          
          try {
            // Validate PDF bytes
            if (!validatePDFBytes(bytes)) {
              throw new Error('Invalid PDF data provided');
            }
            
            // Create safe copy to prevent detachment
            const safeBytes = createSafePDFBytes(bytes);
            
            // Load PDF with pdf.js
            const pdf = await loadPDFSafely(safeBytes);
            
            // Update state
            set({
              currentPDF: pdf,
              currentPDFBytes: safeBytes,
              currentPage: 1,
              totalPages: pdf.numPages,
              fileName: fileName || get().fileName || 'document.pdf',
              filePath: filePath || get().filePath || null,
              isLoaded: true,
              isLoading: false,
              hasChanges: false,
              error: null
            });
            
            // Add to history
            get().addToHistory(safeBytes);
            
          } catch (error) {
            console.error('❌ Failed to load PDF:', error);
            set({
              isLoading: false,
              error: error instanceof Error ? error.message : 'Failed to load PDF'
            });
            throw error;
          }
        },
        
        // Unload PDF document
        unloadPDF: () => {
          set({
            currentPDF: null,
            currentPDFBytes: null,
            currentPage: 1,
            totalPages: 0,
            fileName: '',
            filePath: null,
            isLoaded: false,
            hasChanges: false,
            history: [],
            historyIndex: -1
          });
        },
        
        // Change current page
        changePage: (page: number) => {
          const { totalPages } = get();
          if (page >= 1 && page <= totalPages) {
            set({ currentPage: page });
          }
        },
        
        // Go to next page
        goToNextPage: () => {
          const { currentPage, totalPages } = get();
          if (currentPage < totalPages) {
            set({ currentPage: currentPage + 1 });
          }
        },
        
        // Go to previous page
        goToPreviousPage: () => {
          const { currentPage } = get();
          if (currentPage > 1) {
            set({ currentPage: currentPage - 1 });
          }
        },
        
        // Add to history
        addToHistory: (pdfBytes: Uint8Array) => {
          const { history, historyIndex } = get();
          
          // Create new history array with current state
          const newHistory = history.slice(0, historyIndex + 1);
          
          // Limit history to 10 states
          if (newHistory.length >= 10) {
            newHistory.shift();
          }
          
          // Add new state
          newHistory.push(pdfBytes);
          
          set({
            history: newHistory,
            historyIndex: newHistory.length - 1,
            hasChanges: true
          });
        },
        
        // Undo last operation
        undo: () => {
          const { history, historyIndex } = get();
          if (historyIndex > 0) {
            const newIndex = historyIndex - 1;
            const pdfBytes = history[newIndex];
            
            // Update state with previous version
            set({ 
              currentPDFBytes: pdfBytes,
              historyIndex: newIndex,
              hasChanges: true
            });
            
            // Reload PDF with previous bytes
            get().loadPDF(pdfBytes);
          }
        },
        
        // Redo undone operation
        redo: () => {
          const { history, historyIndex } = get();
          if (historyIndex < history.length - 1) {
            const newIndex = historyIndex + 1;
            const pdfBytes = history[newIndex];
            
            // Update state with next version
            set({
              currentPDFBytes: pdfBytes,
              historyIndex: newIndex,
              hasChanges: true
            });
            
            // Reload PDF with next bytes
            get().loadPDF(pdfBytes);
          }
        },
        
        // Set hasChanges flag
        setHasChanges: (hasChanges: boolean) => {
          set({ hasChanges });
        },
        
        // Set error message
        setError: (error: string | null) => {
          set({ error });
        },
        
        // Set loading state
        setLoading: (isLoading: boolean) => {
          set({ isLoading });
        },
        
        // Reset to initial state
        reset: () => {
          set(initialDocumentState);
        }
      }),
      {
        name: 'pdf-document-storage',
        partialize: (state) => ({
          currentPage: state.currentPage,
          totalPages: state.totalPages,
          fileName: state.fileName,
          filePath: state.filePath,
          hasChanges: state.hasChanges
        })
      }
    )
  )
);

// Selector hooks for optimized re-renders
export const useCurrentPage = () => useDocumentStore(state => state.currentPage);
export const useTotalPages = () => useDocumentStore(state => state.totalPages);
export const useIsDocumentLoaded = () => useDocumentStore(state => state.isLoaded);
export const useDocumentLoading = () => useDocumentStore(state => state.isLoading);
export const useDocumentError = () => useDocumentStore(state => state.error);
export const useHasDocumentChanges = () => useDocumentStore(state => state.hasChanges);
export const useCanUndo = () => useDocumentStore(state => state.historyIndex > 0);
export const useCanRedo = () => useDocumentStore(state => state.historyIndex < state.history.length - 1);
export const useDocumentFileName = () => useDocumentStore(state => state.fileName);
export const useDocumentFilePath = () => useDocumentStore(state => state.filePath);

export default useDocumentStore;