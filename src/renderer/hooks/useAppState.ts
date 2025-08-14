import { useReducer, useCallback } from 'react';
import { PDFDocumentProxy } from 'pdfjs-dist/types/src/display/api';
import { SearchResult } from '../services/SearchService';

// Split state into logical groups for better performance
interface DocumentState {
  currentPDF: PDFDocumentProxy | null;
  currentPDFBytes: Uint8Array | null;
  currentPage: number;
  totalPages: number;
  fileName: string;
  filePath: string | null;
  hasChanges: boolean;
}

interface ViewState {
  zoom: number;
  rotation: number;
  isDarkMode: boolean;
  isFullscreen: boolean;
  isLoading: boolean;
}

interface ToolState {
  currentTool: string;
  penThickness: number;
  selectedColor: { r: number; g: number; b: number };
  highlightOpacity: number;
}

interface UIState {
  showThumbnails: boolean;
  showProperties: boolean;
  showSearch: boolean;
  showFormEditor: boolean;
  showInputDialog: boolean;
  showRedactionTool: boolean;
  showWatermarkDialog: boolean;
  showBookmarks: boolean;
  showNavigation: boolean;
  showExportOptions: boolean;
  showAnalytics: boolean;
  showWorkflow: boolean;
  showDocumentIntelligence: boolean;
  showFormBuilder: boolean;
  showDocumentComparison: boolean;
  showAccessibilityTools: boolean;
  showErrorDialog: boolean;
  isSidebarExpanded: boolean;
  sidebarTab: 'thumbnails' | 'bookmarks' | 'attachments' | 'analytics' | 'workflow';
}

interface EditState {
  isEditMode: boolean;
  contentEdits: any[];
  selectedText: string;
  annotations: any[];
  formFields: any[];
  bookmarks: any[];
  history: Uint8Array[];
  historyIndex: number;
}

interface SearchState {
  searchText: string;
  searchResults: SearchResult[];
  currentSearchIndex: number;
  isSearching: boolean;
}

interface AppState {
  document: DocumentState;
  view: ViewState;
  tools: ToolState;
  ui: UIState;
  edit: EditState;
  search: SearchState;
  // Temporary state that changes frequently
  ocrResults: Record<string, any>;
  errorDialogConfig: any;
  inputDialogConfig: any;
  analyticsData: any;
  activeWorkflow: any;
  comparisonDocument: any;
  documentText: string;
  exportFormat: string;
  compressionRatio: number;
  isCompressing: boolean;
}

type AppAction = 
  | { type: 'SET_DOCUMENT_STATE'; payload: Partial<DocumentState> }
  | { type: 'SET_VIEW_STATE'; payload: Partial<ViewState> }
  | { type: 'SET_TOOL_STATE'; payload: Partial<ToolState> }
  | { type: 'SET_UI_STATE'; payload: Partial<UIState> }
  | { type: 'SET_EDIT_STATE'; payload: Partial<EditState> }
  | { type: 'SET_SEARCH_STATE'; payload: Partial<SearchState> }
  | { type: 'SET_TEMP_STATE'; payload: Partial<Pick<AppState, 'ocrResults' | 'errorDialogConfig' | 'inputDialogConfig' | 'analyticsData' | 'activeWorkflow' | 'comparisonDocument' | 'documentText' | 'exportFormat' | 'compressionRatio' | 'isCompressing'>> }
  | { type: 'RESET_STATE' };

const initialState: AppState = {
  document: {
    currentPDF: null,
    currentPDFBytes: null,
    currentPage: 1,
    totalPages: 0,
    fileName: '',
    filePath: null,
    hasChanges: false,
  },
  view: {
    zoom: 100,
    rotation: 0,
    isDarkMode: true,
    isFullscreen: false,
    isLoading: false,
  },
  tools: {
    currentTool: 'select',
    penThickness: 2,
    selectedColor: { r: 1, g: 0, b: 0 },
    highlightOpacity: 0.3,
  },
  ui: {
    showThumbnails: true,
    showProperties: false,
    showSearch: false,
    showFormEditor: false,
    showInputDialog: false,
    showRedactionTool: false,
    showWatermarkDialog: false,
    showBookmarks: false,
    showNavigation: false,
    showExportOptions: false,
    showAnalytics: false,
    showWorkflow: false,
    showDocumentIntelligence: false,
    showFormBuilder: false,
    showDocumentComparison: false,
    showAccessibilityTools: false,
    showErrorDialog: false,
    isSidebarExpanded: false,
    sidebarTab: 'thumbnails',
  },
  edit: {
    isEditMode: false,
    contentEdits: [],
    selectedText: '',
    annotations: [],
    formFields: [],
    bookmarks: [],
    history: [],
    historyIndex: -1,
  },
  search: {
    searchText: '',
    searchResults: [],
    currentSearchIndex: -1,
    isSearching: false,
  },
  ocrResults: {},
  errorDialogConfig: null,
  inputDialogConfig: null,
  analyticsData: null,
  activeWorkflow: null,
  comparisonDocument: null,
  documentText: '',
  exportFormat: 'pdf',
  compressionRatio: 0,
  isCompressing: false,
};

function appStateReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_DOCUMENT_STATE':
      return {
        ...state,
        document: { ...state.document, ...action.payload }
      };
    case 'SET_VIEW_STATE':
      return {
        ...state,
        view: { ...state.view, ...action.payload }
      };
    case 'SET_TOOL_STATE':
      return {
        ...state,
        tools: { ...state.tools, ...action.payload }
      };
    case 'SET_UI_STATE':
      return {
        ...state,
        ui: { ...state.ui, ...action.payload }
      };
    case 'SET_EDIT_STATE':
      return {
        ...state,
        edit: { ...state.edit, ...action.payload }
      };
    case 'SET_SEARCH_STATE':
      return {
        ...state,
        search: { ...state.search, ...action.payload }
      };
    case 'SET_TEMP_STATE':
      return {
        ...state,
        ...action.payload
      };
    case 'RESET_STATE':
      return initialState;
    default:
      return state;
  }
}

export function useAppState() {
  const [state, dispatch] = useReducer(appStateReducer, initialState);

  const updateDocumentState = useCallback((payload: Partial<DocumentState>) => {
    dispatch({ type: 'SET_DOCUMENT_STATE', payload });
  }, []);

  const updateViewState = useCallback((payload: Partial<ViewState>) => {
    dispatch({ type: 'SET_VIEW_STATE', payload });
  }, []);

  const updateToolState = useCallback((payload: Partial<ToolState>) => {
    dispatch({ type: 'SET_TOOL_STATE', payload });
  }, []);

  const updateUIState = useCallback((payload: Partial<UIState>) => {
    dispatch({ type: 'SET_UI_STATE', payload });
  }, []);

  const updateEditState = useCallback((payload: Partial<EditState>) => {
    dispatch({ type: 'SET_EDIT_STATE', payload });
  }, []);

  const updateSearchState = useCallback((payload: Partial<SearchState>) => {
    dispatch({ type: 'SET_SEARCH_STATE', payload });
  }, []);

  const updateTempState = useCallback((payload: Partial<Pick<AppState, 'ocrResults' | 'errorDialogConfig' | 'inputDialogConfig' | 'analyticsData' | 'activeWorkflow' | 'comparisonDocument' | 'documentText' | 'exportFormat' | 'compressionRatio' | 'isCompressing'>>) => {
    dispatch({ type: 'SET_TEMP_STATE', payload });
  }, []);

  const resetState = useCallback(() => {
    dispatch({ type: 'RESET_STATE' });
  }, []);

  return {
    state,
    updateDocumentState,
    updateViewState,
    updateToolState,
    updateUIState,
    updateEditState,
    updateSearchState,
    updateTempState,
    resetState,
  };
}

export type { AppState, DocumentState, ViewState, ToolState, UIState, EditState, SearchState };