/**
 * Root Store - Combines all modular stores
 * Central hub for accessing all application state
 */

import { useDocumentStore } from './document/documentStore';
import { useUIStore } from './ui/uiStore';
import { useAppStore } from './app/appStore';

// Root store interface combining all stores
interface RootStore {
  // Document store
  document: ReturnType<typeof useDocumentStore>;
  
  // UI store
  ui: ReturnType<typeof useUIStore>;
  
  // App store
  app: ReturnType<typeof useAppStore>;
}

// Root store implementation
export const useRootStore = (): RootStore => {
  const document = useDocumentStore();
  const ui = useUIStore();
  const app = useAppStore();
  
  return {
    document,
    ui,
    app
  };
};

// Convenience hooks for accessing individual stores
export const useDocument = () => useDocumentStore();
export const useUI = () => useUIStore();
export const useApp = () => useAppStore();

// Convenience hooks for accessing specific parts of the state
export const useCurrentPDF = () => useDocumentStore(state => state.currentPDF);
export const useCurrentPDFBytes = () => useDocumentStore(state => state.currentPDFBytes);
export const useCurrentPage = () => useDocumentStore(state => state.currentPage);
export const useTotalPages = () => useDocumentStore(state => state.totalPages);
export const useDocumentFileName = () => useDocumentStore(state => state.fileName);
export const useDocumentFilePath = () => useDocumentStore(state => state.filePath);
export const useHasDocumentChanges = () => useDocumentStore(state => state.hasChanges);
export const useIsDocumentLoaded = () => useDocumentStore(state => state.isLoaded);
export const useDocumentLoading = () => useDocumentStore(state => state.isLoading);
export const useDocumentError = () => useDocumentStore(state => state.error);
export const useDocumentHistory = () => useDocumentStore(state => state.history);
export const useDocumentHistoryIndex = () => useDocumentStore(state => state.historyIndex);
export const useCanUndo = () => useDocumentStore(state => state.historyIndex > 0);
export const useCanRedo = () => useDocumentStore(state => state.historyIndex < state.history.length - 1);

export const useTheme = () => useUIStore(state => state.theme);
export const useIsDarkMode = () => useUIStore(state => state.isDarkMode);
export const useZoom = () => useUIStore(state => state.zoom);
export const useIsFullscreen = () => useUIStore(state => state.isFullscreen);
export const useIsSidebarExpanded = () => useUIStore(state => state.isSidebarExpanded);
export const useSidebarTab = () => useUIStore(state => state.sidebarTab);
export const useShowThumbnails = () => useUIStore(state => state.showThumbnails);
export const useShowProperties = () => useUIStore(state => state.showProperties);
export const useShowSearch = () => useUIStore(state => state.showSearch);
export const useShowNavigation = () => useUIStore(state => state.showNavigation);
export const useCurrentTool = () => useUIStore(state => state.currentTool);
export const useIsEditMode = () => useUIStore(state => state.isEditMode);
export const useShowRedactionTool = () => useUIStore(state => state.showRedactionTool);
export const useShowWatermarkDialog = () => useUIStore(state => state.showWatermarkDialog);
export const useShowFormEditor = () => useUIStore(state => state.showFormEditor);
export const useShowInputDialog = () => useUIStore(state => state.showInputDialog);
export const useShowExportOptions = () => useUIStore(state => state.showExportOptions);
export const useShowDocumentIntelligence = () => useUIStore(state => state.showDocumentIntelligence);
export const useShowFormBuilder = () => useUIStore(state => state.showFormBuilder);
export const useShowDocumentComparison = () => useUIStore(state => state.showDocumentComparison);
export const useShowAccessibilityTools = () => useUIStore(state => state.showAccessibilityTools);
export const useShowAnalytics = () => useUIStore(state => state.showAnalytics);
export const useShowWorkflow = () => useUIStore(state => state.showWorkflow);
export const useShowErrorDialog = () => useUIStore(state => state.showErrorDialog);
export const useIsUILoading = () => useUIStore(state => state.isLoading);
export const useIsSearching = () => useUIStore(state => state.isSearching);
export const useErrorDialogConfig = () => useUIStore(state => state.errorDialogConfig);
export const useInputDialogConfig = () => useUIStore(state => state.inputDialogConfig);

export const useIsAppInitialized = () => useAppStore(state => state.isInitialized);
export const useIsAppReady = () => useAppStore(state => state.isReady);
export const useIsAppQuitting = () => useAppStore(state => state.isQuitting);
export const usePlatform = () => useAppStore(state => state.platform);
export const useIsElectron = () => useAppStore(state => state.isElectron);
export const useIsDevelopment = () => useAppStore(state => state.isDevelopment);
export const useAppVersion = () => useAppStore(state => state.version);
export const usePreferences = () => useAppStore(state => state.preferences);
export const useRecentFiles = () => useAppStore(state => state.recentFiles);
export const useWindowState = () => useAppStore(state => state.windowState);
export const useIsAuthenticated = () => useAppStore(state => state.isAuthenticated);
export const useUserId = () => useAppStore(state => state.userId);
export const useUserName = () => useAppStore(state => state.userName);
export const useFeatures = () => useAppStore(state => state.features);
export const useNotifications = () => useAppStore(state => state.notifications);
export const useLastError = () => useAppStore(state => state.lastError);
export const useThemePreference = () => useAppStore(state => state.preferences.theme);
export const useDefaultZoom = () => useAppStore(state => state.preferences.defaultZoom);
export const useShowThumbnailsPreference = () => useAppStore(state => state.preferences.showThumbnails);
export const useAutoSave = () => useAppStore(state => state.preferences.autoSave);
export const useAutoSaveInterval = () => useAppStore(state => state.preferences.autoSaveInterval);
export const useHardwareAcceleration = () => useAppStore(state => state.preferences.hardwareAcceleration);
export const useGpuEnabled = () => useAppStore(state => state.preferences.gpuEnabled);
export const useRecentFilesLimit = () => useAppStore(state => state.preferences.recentFilesLimit);
export const useEnableShortcuts = () => useAppStore(state => state.preferences.enableShortcuts);
export const useEnableAnimations = () => useAppStore(state => state.preferences.enableAnimations);
export const useCompressionQuality = () => useAppStore(state => state.preferences.compressionQuality);
export const useDefaultFont = () => useAppStore(state => state.preferences.defaultFont);
export const useViewMode = () => useAppStore(state => state.preferences.viewMode);
export const useHighlightColor = () => useAppStore(state => state.preferences.highlightColor);
export const useIsMaximized = () => useAppStore(state => state.windowState.isMaximized);
export const useIsMinimized = () => useAppStore(state => state.windowState.isMinimized);
export const useWindowSize = () => useAppStore(state => ({
  width: state.windowState.width,
  height: state.windowState.height
}));
export const useWindowPosition = () => useAppStore(state => ({
  x: state.windowState.x,
  y: state.windowState.y
}));
export const useFeature = (feature: keyof ReturnType<typeof useAppStore>['features']) => 
  useAppStore(state => state.features[feature]);
export const useUnreadNotificationsCount = () => 
  useAppStore(state => state.notifications.filter(n => !n.read).length);

// Actions combining functionality from multiple stores
export const useAppActions = () => {
  const documentActions = useDocumentStore(state => ({
    loadPDF: state.loadPDF,
    unloadPDF: state.unloadPDF,
    changePage: state.changePage,
    goToNextPage: state.goToNextPage,
    goToPreviousPage: state.goToPreviousPage,
    addToHistory: state.addToHistory,
    undo: state.undo,
    redo: state.redo,
    setHasChanges: state.setHasChanges,
    setError: state.setError,
    setLoading: state.setLoading,
    reset: state.reset
  }));
  
  const uiActions = useUIStore(state => ({
    toggleTheme: state.toggleTheme,
    setTheme: state.setTheme,
    setZoom: state.setZoom,
    resetZoom: state.resetZoom,
    toggleFullscreen: state.toggleFullscreen,
    toggleSidebar: state.toggleSidebar,
    setSidebarTab: state.setSidebarTab,
    toggleThumbnails: state.toggleThumbnails,
    toggleProperties: state.toggleProperties,
    toggleSearch: state.toggleSearch,
    toggleNavigation: state.toggleNavigation,
    setTool: state.setTool,
    toggleEditMode: state.toggleEditMode,
    setShowRedactionTool: state.setShowRedactionTool,
    setShowWatermarkDialog: state.setShowWatermarkDialog,
    setShowFormEditor: state.setShowFormEditor,
    showInputDialog: state.showInputDialog,
    hideInputDialog: state.hideInputDialog,
    setShowExportOptions: state.setShowExportOptions,
    setShowDocumentIntelligence: state.setShowDocumentIntelligence,
    setShowFormBuilder: state.setShowFormBuilder,
    setShowDocumentComparison: state.setShowDocumentComparison,
    setShowAccessibilityTools: state.setShowAccessibilityTools,
    setShowAnalytics: state.setShowAnalytics,
    setShowWorkflow: state.setShowWorkflow,
    showErrorDialog: state.showErrorDialog,
    hideErrorDialog: state.hideErrorDialog,
    setLoading: state.setLoading,
    setSearching: state.setSearching,
    reset: state.reset
  }));
  
  const appActions = useAppStore(state => ({
    initialize: state.initialize,
    setReady: state.setReady,
    setQuitting: state.setQuitting,
    setPlatform: state.setPlatform,
    setIsElectron: state.setIsElectron,
    setIsDevelopment: state.setIsDevelopment,
    setVersion: state.setVersion,
    setPreferences: state.setPreferences,
    updatePreference: state.updatePreference,
    addRecentFile: state.addRecentFile,
    removeRecentFile: state.removeRecentFile,
    clearRecentFiles: state.clearRecentFiles,
    setWindowState: state.setWindowState,
    setMaximized: state.setMaximized,
    setMinimized: state.setMinimized,
    login: state.login,
    logout: state.logout,
    enableFeature: state.enableFeature,
    disableFeature: state.disableFeature,
    setFeature: state.setFeature,
    addNotification: state.addNotification,
    markNotificationAsRead: state.markNotificationAsRead,
    clearNotifications: state.clearNotifications,
    setError: state.setError,
    clearError: state.clearError,
    reset: state.reset
  }));
  
  return {
    document: documentActions,
    ui: uiActions,
    app: appActions
  };
};

// Selectors for common combinations of state
export const useAppTheme = () => {
  const uiTheme = useUIStore(state => state.theme);
  const appThemePref = useAppStore(state => state.preferences.theme);
  return uiTheme || appThemePref || 'dark';
};

export const useCombinedLoadingState = () => {
  const documentLoading = useDocumentStore(state => state.isLoading);
  const uiLoading = useUIStore(state => state.isLoading);
  return documentLoading || uiLoading;
};

export const useCombinedErrorState = () => {
  const documentError = useDocumentStore(state => state.error);
  const lastAppError = useAppStore(state => state.lastError);
  return documentError || (lastAppError ? lastAppError.message : null);
};

export const useAppReadyState = () => {
  const appInitialized = useAppStore(state => state.isInitialized);
  const appReady = useAppStore(state => state.isReady);
  const documentLoaded = useDocumentStore(state => state.isLoaded);
  return appInitialized && appReady && documentLoaded;
};

export default useRootStore;