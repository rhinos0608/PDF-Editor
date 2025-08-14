/**
 * UI Store - Manages user interface state
 * Part of the modular state management system
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

// UI state interface
interface UIState {
  // Theme and appearance
  isDarkMode: boolean;
  theme: 'light' | 'dark' | 'high-contrast' | 'blue' | 'green' | 'purple';
  zoom: number;
  isFullscreen: boolean;
  
  // Sidebar and panels
  isSidebarExpanded: boolean;
  sidebarTab: 'thumbnails' | 'bookmarks' | 'attachments' | 'analytics' | 'workflow';
  showThumbnails: boolean;
  showProperties: boolean;
  showSearch: boolean;
  showNavigation: boolean;
  sidebarWidth: number;
  openPanels: string[];
  
  // Toolbars and tools
  currentTool: string;
  isEditMode: boolean;
  showRedactionTool: boolean;
  showWatermarkDialog: boolean;
  
  // Dialogs and overlays
  showFormEditor: boolean;
  showInputDialog: boolean;
  showExportOptions: boolean;
  showDocumentIntelligence: boolean;
  showFormBuilder: boolean;
  showDocumentComparison: boolean;
  showAccessibilityTools: boolean;
  showAnalytics: boolean;
  showWorkflow: boolean;
  showErrorDialog: boolean;
  
  // Loading and status
  isLoading: boolean;
  isSearching: boolean;
  
  // Error dialog configuration
  errorDialogConfig: {
    title: string;
    message: string;
    details?: string;
    onRetry?: () => void;
  } | null;
  
  // Input dialog configuration
  inputDialogConfig: {
    title: string;
    placeholder: string;
    onConfirm: (value: string) => void;
  } | null;
}

// UI actions interface
interface UIActions {
  // Theme and appearance
  toggleTheme: () => void;
  setTheme: (theme: UIState['theme']) => void;
  setZoom: (zoom: number) => void;
  resetZoom: () => void;
  toggleFullscreen: () => void;
  
  // Sidebar and panels
  toggleSidebar: () => void;
  setSidebarTab: (tab: UIState['sidebarTab']) => void;
  toggleThumbnails: () => void;
  toggleProperties: () => void;
  toggleSearch: () => void;
  toggleNavigation: () => void;
  setSidebarWidth: (width: number) => void;
  setOpenPanels: (panels: string[]) => void;
  
  // Tools
  setTool: (tool: string) => void;
  toggleEditMode: () => void;
  setShowRedactionTool: (show: boolean) => void;
  setShowWatermarkDialog: (show: boolean) => void;
  
  // Dialogs and overlays
  setShowFormEditor: (show: boolean) => void;
  showInputDialog: (title: string, placeholder: string, onConfirm: (value: string) => void) => void;
  hideInputDialog: () => void;
  setShowExportOptions: (show: boolean) => void;
  setShowDocumentIntelligence: (show: boolean) => void;
  setShowFormBuilder: (show: boolean) => void;
  setShowDocumentComparison: (show: boolean) => void;
  setShowAccessibilityTools: (show: boolean) => void;
  setShowAnalytics: (show: boolean) => void;
  setShowWorkflow: (show: boolean) => void;
  showErrorDialog: (title: string, message: string, details?: string, onRetry?: () => void) => void;
  hideErrorDialog: () => void;
  
  // Loading and status
  setLoading: (loading: boolean) => void;
  setSearching: (searching: boolean) => void;
  
  // Reset
  reset: () => void;
}

// Combined UI store type
type UIStore = UIState & UIActions;

// Initial UI state
const initialUIState: UIState = {
  // Theme and appearance
  isDarkMode: true,
  theme: 'dark',
  zoom: 100,
  isFullscreen: false,
  
  // Sidebar and panels
  isSidebarExpanded: true,
  sidebarTab: 'thumbnails',
  showThumbnails: true,
  showProperties: false,
  showSearch: false,
  showNavigation: false,
  sidebarWidth: 200,
  openPanels: [],
  
  // Tools
  currentTool: 'select',
  isEditMode: false,
  showRedactionTool: false,
  showWatermarkDialog: false,
  
  // Dialogs and overlays
  showFormEditor: false,
  showInputDialog: false,
  showExportOptions: false,
  showDocumentIntelligence: false,
  showFormBuilder: false,
  showDocumentComparison: false,
  showAccessibilityTools: false,
  showAnalytics: false,
  showWorkflow: false,
  showErrorDialog: false,
  
  // Loading and status
  isLoading: false,
  isSearching: false,
  
  // Configurations
  errorDialogConfig: null,
  inputDialogConfig: null
};

// UI store implementation
export const useUIStore = create<UIStore>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        ...initialUIState,
        
        // Theme and appearance
        toggleTheme: () => {
          const newIsDarkMode = !get().isDarkMode;
          const newTheme = newIsDarkMode ? 'dark' : 'light';
          set({ isDarkMode: newIsDarkMode, theme: newTheme });
          
          // Apply theme to document body
          document.body.classList.remove('light-theme', 'dark-theme', 'high-contrast-theme', 'blue-theme', 'green-theme', 'purple-theme');
          document.body.classList.add(`${newTheme}-theme`);
        },
        
        setTheme: (theme: UIState['theme']) => {
          set({ theme, isDarkMode: theme === 'dark' || theme.includes('dark') });
          
          // Apply theme to document body
          document.body.classList.remove('light-theme', 'dark-theme', 'high-contrast-theme', 'blue-theme', 'green-theme', 'purple-theme');
          document.body.classList.add(`${theme}-theme`);
        },
        
        setZoom: (zoom: number) => {
          const clampedZoom = Math.max(25, Math.min(400, zoom));
          set({ zoom: clampedZoom });
        },
        
        resetZoom: () => {
          set({ zoom: 100 });
        },
        
        toggleFullscreen: () => {
          const newIsFullscreen = !get().isFullscreen;
          set({ isFullscreen: newIsFullscreen });
          
          // Toggle browser fullscreen
          if (newIsFullscreen) {
            document.documentElement.requestFullscreen().catch(console.warn);
          } else {
            document.exitFullscreen().catch(console.warn);
          }
        },
        
        // Sidebar and panels
        toggleSidebar: () => {
          set({ isSidebarExpanded: !get().isSidebarExpanded });
        },
        
        setSidebarTab: (tab: UIState['sidebarTab']) => {
          set({ sidebarTab: tab });
        },
        
        toggleThumbnails: () => {
          set({ showThumbnails: !get().showThumbnails });
        },
        
        toggleProperties: () => {
          set({ showProperties: !get().showProperties });
        },
        
        toggleSearch: () => {
          set({ showSearch: !get().showSearch });
        },
        
        toggleNavigation: () => {
          set({ showNavigation: !get().showNavigation });
        },
        
        setSidebarWidth: (width: number) => {
          set({ sidebarWidth: width });
        },
        
        setOpenPanels: (panels: string[]) => {
          set({ openPanels: panels });
        },
        
        // Tools
        setTool: (tool: string) => {
          set({ currentTool: tool });
        },
        
        toggleEditMode: () => {
          set({ isEditMode: !get().isEditMode });
        },
        
        setShowRedactionTool: (show: boolean) => {
          set({ showRedactionTool: show });
        },
        
        setShowWatermarkDialog: (show: boolean) => {
          set({ showWatermarkDialog: show });
        },
        
        // Dialogs and overlays
        setShowFormEditor: (show: boolean) => {
          set({ showFormEditor: show });
        },
        
        showInputDialog: (title: string, placeholder: string, onConfirm: (value: string) => void) => {
          set({
            showInputDialog: true,
            inputDialogConfig: { title, placeholder, onConfirm }
          });
        },
        
        hideInputDialog: () => {
          set({
            showInputDialog: false,
            inputDialogConfig: null
          });
        },
        
        setShowExportOptions: (show: boolean) => {
          set({ showExportOptions: show });
        },
        
        setShowDocumentIntelligence: (show: boolean) => {
          set({ showDocumentIntelligence: show });
        },
        
        setShowFormBuilder: (show: boolean) => {
          set({ showFormBuilder: show });
        },
        
        setShowDocumentComparison: (show: boolean) => {
          set({ showDocumentComparison: show });
        },
        
        setShowAccessibilityTools: (show: boolean) => {
          set({ showAccessibilityTools: show });
        },
        
        setShowAnalytics: (show: boolean) => {
          set({ showAnalytics: show });
        },
        
        setShowWorkflow: (show: boolean) => {
          set({ showWorkflow: show });
        },
        
        showErrorDialog: (title: string, message: string, details?: string, onRetry?: () => void) => {
          set({
            showErrorDialog: true,
            errorDialogConfig: { title, message, details, onRetry }
          });
        },
        
        hideErrorDialog: () => {
          set({
            showErrorDialog: false,
            errorDialogConfig: null
          });
        },
        
        // Loading and status
        setLoading: (loading: boolean) => {
          set({ isLoading: loading });
        },
        
        setSearching: (searching: boolean) => {
          set({ isSearching: searching });
        },
        
        // Reset
        reset: () => {
          set(initialUIState);
        }
      }),
      {
        name: 'pdf-ui-storage',
        partialize: (state) => ({
          isDarkMode: state.isDarkMode,
          theme: state.theme,
          zoom: state.zoom,
          isSidebarExpanded: state.isSidebarExpanded,
          sidebarTab: state.sidebarTab,
          showThumbnails: state.showThumbnails,
          sidebarWidth: state.sidebarWidth,
          openPanels: state.openPanels,
        })
      }
    )
  )
);

// Selector hooks for optimized re-renders
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
export const useIsLoading = () => useUIStore(state => state.isLoading);
export const useIsSearching = () => useUIStore(state => state.isSearching);
export const useErrorDialogConfig = () => useUIStore(state => state.errorDialogConfig);
export const useInputDialogConfig = () => useUIStore(state => state.inputDialogConfig);

export default useUIStore;