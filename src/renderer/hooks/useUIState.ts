/**
 * UI State Management Hook
 * Extracted from App.tsx to manage UI state separately
 */

import { useState, useCallback } from 'react';

export interface UIState {
  isDarkMode: boolean;
  currentTool: string;
  selectedText: string;
  showThumbnails: boolean;
  showProperties: boolean;
  showSearch: boolean;
  isFullscreen: boolean;
  sidebarTab: 'thumbnails' | 'bookmarks' | 'attachments' | 'analytics' | 'workflow';
  isSidebarExpanded: boolean;
  
  // Dialog states
  showFormEditor: boolean;
  showInputDialog: boolean;
  showRedactionTool: boolean;
  showWatermarkDialog: boolean;
  showExportOptions: boolean;
  showAnalytics: boolean;
  showWorkflow: boolean;
  showDocumentIntelligence: boolean;
  showFormBuilder: boolean;
  showDocumentComparison: boolean;
  showAccessibilityTools: boolean;
  showErrorDialog: boolean;

  // Tool options
  penThickness: number;
  selectedColor: { r: number; g: number; b: number };
  highlightOpacity: number;
  exportFormat: string;

  // Input dialog configuration
  inputDialogConfig: {
    title: string;
    placeholder: string;
    onConfirm: (value: string) => void;
  } | null;

  // Error dialog configuration
  errorDialogConfig: {
    title: string;
    message: string;
    details?: string;
    onRetry?: () => void;
  } | null;
}

export interface UIActions {
  setDarkMode: (enabled: boolean) => void;
  setCurrentTool: (tool: string) => void;
  setSelectedText: (text: string) => void;
  toggleThumbnails: () => void;
  toggleProperties: () => void;
  toggleSearch: () => void;
  setFullscreen: (fullscreen: boolean) => void;
  setSidebarTab: (tab: UIState['sidebarTab']) => void;
  toggleSidebar: () => void;
  
  // Dialog controls
  openFormEditor: () => void;
  closeFormEditor: () => void;
  openInputDialog: (config: NonNullable<UIState['inputDialogConfig']>) => void;
  closeInputDialog: () => void;
  openRedactionTool: () => void;
  closeRedactionTool: () => void;
  openWatermarkDialog: () => void;
  closeWatermarkDialog: () => void;
  openExportOptions: () => void;
  closeExportOptions: () => void;
  openAnalytics: () => void;
  closeAnalytics: () => void;
  openWorkflow: () => void;
  closeWorkflow: () => void;
  openDocumentIntelligence: () => void;
  closeDocumentIntelligence: () => void;
  openFormBuilder: () => void;
  closeFormBuilder: () => void;
  openDocumentComparison: () => void;
  closeDocumentComparison: () => void;
  openAccessibilityTools: () => void;
  closeAccessibilityTools: () => void;
  showError: (config: NonNullable<UIState['errorDialogConfig']>) => void;
  closeError: () => void;

  // Tool options
  setPenThickness: (thickness: number) => void;
  setSelectedColor: (color: { r: number; g: number; b: number }) => void;
  setHighlightOpacity: (opacity: number) => void;
  setExportFormat: (format: string) => void;

  resetUIState: () => void;
}

const initialUIState: UIState = {
  isDarkMode: true, // Default to dark mode for Adobe-style interface
  currentTool: 'select',
  selectedText: '',
  showThumbnails: true,
  showProperties: false,
  showSearch: false,
  isFullscreen: false,
  sidebarTab: 'thumbnails',
  isSidebarExpanded: true,
  
  // Dialog states
  showFormEditor: false,
  showInputDialog: false,
  showRedactionTool: false,
  showWatermarkDialog: false,
  showExportOptions: false,
  showAnalytics: false,
  showWorkflow: false,
  showDocumentIntelligence: false,
  showFormBuilder: false,
  showDocumentComparison: false,
  showAccessibilityTools: false,
  showErrorDialog: false,

  // Tool options
  penThickness: 2,
  selectedColor: { r: 255, g: 0, b: 0 }, // Red by default
  highlightOpacity: 0.3,
  exportFormat: 'pdf',

  // Configurations
  inputDialogConfig: null,
  errorDialogConfig: null,
};

export function useUIState(): UIState & UIActions {
  const [state, setState] = useState<UIState>(initialUIState);

  const setDarkMode = useCallback((enabled: boolean) => {
    setState(prev => ({ ...prev, isDarkMode: enabled }));
  }, []);

  const setCurrentTool = useCallback((tool: string) => {
    setState(prev => ({ ...prev, currentTool: tool }));
  }, []);

  const setSelectedText = useCallback((text: string) => {
    setState(prev => ({ ...prev, selectedText: text }));
  }, []);

  const toggleThumbnails = useCallback(() => {
    setState(prev => ({ ...prev, showThumbnails: !prev.showThumbnails }));
  }, []);

  const toggleProperties = useCallback(() => {
    setState(prev => ({ ...prev, showProperties: !prev.showProperties }));
  }, []);

  const toggleSearch = useCallback(() => {
    setState(prev => ({ ...prev, showSearch: !prev.showSearch }));
  }, []);

  const setFullscreen = useCallback((fullscreen: boolean) => {
    setState(prev => ({ ...prev, isFullscreen: fullscreen }));
  }, []);

  const setSidebarTab = useCallback((tab: UIState['sidebarTab']) => {
    setState(prev => ({ ...prev, sidebarTab: tab }));
  }, []);

  const toggleSidebar = useCallback(() => {
    setState(prev => ({ ...prev, isSidebarExpanded: !prev.isSidebarExpanded }));
  }, []);

  // Dialog controls
  const openFormEditor = useCallback(() => {
    setState(prev => ({ ...prev, showFormEditor: true }));
  }, []);

  const closeFormEditor = useCallback(() => {
    setState(prev => ({ ...prev, showFormEditor: false }));
  }, []);

  const openInputDialog = useCallback((config: NonNullable<UIState['inputDialogConfig']>) => {
    setState(prev => ({ 
      ...prev, 
      showInputDialog: true, 
      inputDialogConfig: config 
    }));
  }, []);

  const closeInputDialog = useCallback(() => {
    setState(prev => ({ 
      ...prev, 
      showInputDialog: false, 
      inputDialogConfig: null 
    }));
  }, []);

  const openRedactionTool = useCallback(() => {
    setState(prev => ({ ...prev, showRedactionTool: true }));
  }, []);

  const closeRedactionTool = useCallback(() => {
    setState(prev => ({ ...prev, showRedactionTool: false }));
  }, []);

  const openWatermarkDialog = useCallback(() => {
    setState(prev => ({ ...prev, showWatermarkDialog: true }));
  }, []);

  const closeWatermarkDialog = useCallback(() => {
    setState(prev => ({ ...prev, showWatermarkDialog: false }));
  }, []);

  const openExportOptions = useCallback(() => {
    setState(prev => ({ ...prev, showExportOptions: true }));
  }, []);

  const closeExportOptions = useCallback(() => {
    setState(prev => ({ ...prev, showExportOptions: false }));
  }, []);

  const openAnalytics = useCallback(() => {
    setState(prev => ({ ...prev, showAnalytics: true }));
  }, []);

  const closeAnalytics = useCallback(() => {
    setState(prev => ({ ...prev, showAnalytics: false }));
  }, []);

  const openWorkflow = useCallback(() => {
    setState(prev => ({ ...prev, showWorkflow: true }));
  }, []);

  const closeWorkflow = useCallback(() => {
    setState(prev => ({ ...prev, showWorkflow: false }));
  }, []);

  const openDocumentIntelligence = useCallback(() => {
    setState(prev => ({ ...prev, showDocumentIntelligence: true }));
  }, []);

  const closeDocumentIntelligence = useCallback(() => {
    setState(prev => ({ ...prev, showDocumentIntelligence: false }));
  }, []);

  const openFormBuilder = useCallback(() => {
    setState(prev => ({ ...prev, showFormBuilder: true }));
  }, []);

  const closeFormBuilder = useCallback(() => {
    setState(prev => ({ ...prev, showFormBuilder: false }));
  }, []);

  const openDocumentComparison = useCallback(() => {
    setState(prev => ({ ...prev, showDocumentComparison: true }));
  }, []);

  const closeDocumentComparison = useCallback(() => {
    setState(prev => ({ ...prev, showDocumentComparison: false }));
  }, []);

  const openAccessibilityTools = useCallback(() => {
    setState(prev => ({ ...prev, showAccessibilityTools: true }));
  }, []);

  const closeAccessibilityTools = useCallback(() => {
    setState(prev => ({ ...prev, showAccessibilityTools: false }));
  }, []);

  const showError = useCallback((config: NonNullable<UIState['errorDialogConfig']>) => {
    setState(prev => ({ 
      ...prev, 
      showErrorDialog: true, 
      errorDialogConfig: config 
    }));
  }, []);

  const closeError = useCallback(() => {
    setState(prev => ({ 
      ...prev, 
      showErrorDialog: false, 
      errorDialogConfig: null 
    }));
  }, []);

  // Tool options
  const setPenThickness = useCallback((thickness: number) => {
    setState(prev => ({ 
      ...prev, 
      penThickness: Math.max(1, Math.min(thickness, 20)) 
    }));
  }, []);

  const setSelectedColor = useCallback((color: { r: number; g: number; b: number }) => {
    setState(prev => ({ ...prev, selectedColor: color }));
  }, []);

  const setHighlightOpacity = useCallback((opacity: number) => {
    setState(prev => ({ 
      ...prev, 
      highlightOpacity: Math.max(0, Math.min(opacity, 1)) 
    }));
  }, []);

  const setExportFormat = useCallback((format: string) => {
    setState(prev => ({ ...prev, exportFormat: format }));
  }, []);

  const resetUIState = useCallback(() => {
    setState(initialUIState);
  }, []);

  return {
    ...state,
    setDarkMode,
    setCurrentTool,
    setSelectedText,
    toggleThumbnails,
    toggleProperties,
    toggleSearch,
    setFullscreen,
    setSidebarTab,
    toggleSidebar,
    openFormEditor,
    closeFormEditor,
    openInputDialog,
    closeInputDialog,
    openRedactionTool,
    closeRedactionTool,
    openWatermarkDialog,
    closeWatermarkDialog,
    openExportOptions,
    closeExportOptions,
    openAnalytics,
    closeAnalytics,
    openWorkflow,
    closeWorkflow,
    openDocumentIntelligence,
    closeDocumentIntelligence,
    openFormBuilder,
    closeFormBuilder,
    openDocumentComparison,
    closeDocumentComparison,
    openAccessibilityTools,
    closeAccessibilityTools,
    showError,
    closeError,
    setPenThickness,
    setSelectedColor,
    setHighlightOpacity,
    setExportFormat,
    resetUIState,
  };
}