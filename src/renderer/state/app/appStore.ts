/**
 * App Store - Manages application-level state
 * Part of the modular state management system
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

// App state interface
interface AppState {
  // Application lifecycle
  isInitialized: boolean;
  isReady: boolean;
  isQuitting: boolean;
  
  // Platform and environment
  platform: NodeJS.Platform;
  isElectron: boolean;
  isDevelopment: boolean;
  version: string;
  
  // Preferences
  preferences: {
    theme: 'light' | 'dark' | 'high-contrast' | 'blue' | 'green' | 'purple';
    defaultZoom: number;
    showThumbnails: boolean;
    autoSave: boolean;
    autoSaveInterval: number;
    hardwareAcceleration: boolean;
    gpuEnabled: boolean;
    recentFilesLimit: number;
    enableShortcuts: boolean;
    enableAnimations: boolean;
    compressionQuality: 'low' | 'medium' | 'high';
    defaultFont: string;
    viewMode: 'single' | 'continuous' | 'two-page';
    highlightColor: string;
  };
  
  // Recent files
  recentFiles: string[];
  
  // Window state
  windowState: {
    isMaximized: boolean;
    isMinimized: boolean;
    width: number;
    height: number;
    x: number;
    y: number;
  };
  
  // User session
  isAuthenticated: boolean;
  userId: string | null;
  userName: string | null;
  
  // Feature flags
  features: {
    ocr: boolean;
    ai: boolean;
    cloudSync: boolean;
    collaboration: boolean;
    advancedEditing: boolean;
    batchProcessing: boolean;
    documentWorkflow: boolean;
    digitalSignatures: boolean;
    redaction: boolean;
    accessibility: boolean;
    analytics: boolean;
    security: boolean;
    forms: boolean;
  };
  
  // Notifications
  notifications: {
    id: string;
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    timestamp: Date;
    read: boolean;
    action?: () => void;
  }[];
  
  // Error handling
  lastError: {
    message: string;
    stack: string;
    timestamp: Date;
    context: string;
  } | null;
}

// App actions interface
interface AppActions {
  // Initialization
  initialize: () => Promise<void>;
  setReady: (ready: boolean) => void;
  setQuitting: (quitting: boolean) => void;
  
  // Platform and environment
  setPlatform: (platform: NodeJS.Platform) => void;
  setIsElectron: (isElectron: boolean) => void;
  setIsDevelopment: (isDevelopment: boolean) => void;
  setVersion: (version: string) => void;
  
  // Preferences
  setPreferences: (preferences: Partial<AppState['preferences']>) => void;
  updatePreference: <K extends keyof AppState['preferences']>(
    key: K,
    value: AppState['preferences'][K]
  ) => void;
  
  // Recent files
  addRecentFile: (filePath: string) => void;
  removeRecentFile: (filePath: string) => void;
  clearRecentFiles: () => void;
  
  // Window state
  setWindowState: (windowState: Partial<AppState['windowState']>) => void;
  setMaximized: (isMaximized: boolean) => void;
  setMinimized: (isMinimized: boolean) => void;
  
  // User session
  login: (userId: string, userName: string) => void;
  logout: () => void;
  
  // Feature flags
  enableFeature: (feature: keyof AppState['features']) => void;
  disableFeature: (feature: keyof AppState['features']) => void;
  setFeature: (feature: keyof AppState['features'], enabled: boolean) => void;
  
  // Notifications
  addNotification: (
    title: string,
    message: string,
    type?: 'info' | 'success' | 'warning' | 'error',
    action?: () => void
  ) => void;
  markNotificationAsRead: (id: string) => void;
  clearNotifications: () => void;
  
  // Error handling
  setError: (message: string, stack?: string, context?: string) => void;
  clearError: () => void;
  
  // Reset
  reset: () => void;
}

// Combined app store type
type AppStore = AppState & AppActions;

// Initial app state
const initialAppState: AppState = {
  // Application lifecycle
  isInitialized: false,
  isReady: false,
  isQuitting: false,
  
  // Platform and environment
  platform: 'win32',
  isElectron: true,
  isDevelopment: process.env.NODE_ENV === 'development',
  version: '2.0.0',
  
  // Preferences
  preferences: {
    theme: 'dark',
    defaultZoom: 100,
    showThumbnails: true,
    autoSave: true,
    autoSaveInterval: 300000, // 5 minutes
    hardwareAcceleration: false,
    gpuEnabled: false,
    recentFilesLimit: 10,
    enableShortcuts: true,
    enableAnimations: true,
    compressionQuality: 'medium',
    defaultFont: 'Helvetica',
    viewMode: 'single',
    highlightColor: '#FFD700'
  },
  
  // Recent files
  recentFiles: [],
  
  // Window state
  windowState: {
    isMaximized: false,
    isMinimized: false,
    width: 1200,
    height: 800,
    x: 0,
    y: 0
  },
  
  // User session
  isAuthenticated: false,
  userId: null,
  userName: null,
  
  // Feature flags
  features: {
    ocr: true,
    ai: true,
    cloudSync: false,
    collaboration: false,
    advancedEditing: true,
    batchProcessing: true,
    documentWorkflow: true,
    digitalSignatures: true,
    redaction: true,
    accessibility: true,
    analytics: true,
    security: true,
    forms: true
  },
  
  // Notifications
  notifications: [],
  
  // Error handling
  lastError: null
};

// App store implementation
export const useAppStore = create<AppStore>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        ...initialAppState,
        
        // Initialization
        initialize: async () => {
          try {
            // Detect platform and environment
            const platform = typeof window !== 'undefined' && window.electronAPI?.getPlatform 
              ? await window.electronAPI.getPlatform()
              : process.platform;
              
            const isElectron = typeof window !== 'undefined' && window.electronAPI?.isElectron 
              ? window.electronAPI.isElectron()
              : true;
              
            const isDevelopment = process.env.NODE_ENV === 'development';
            const version = typeof window !== 'undefined' && window.electronAPI?.getVersion
              ? await window.electronAPI.getVersion()
              : '2.0.0';
            
            // Load preferences
            let preferences = initialAppState.preferences;
            if (typeof window !== 'undefined' && window.electronAPI?.getPreferences) {
              try {
                const loadedPrefs = await window.electronAPI.getPreferences();
                preferences = { ...preferences, ...loadedPrefs };
              } catch (error) {
                console.warn('Could not load preferences:', error);
              }
            }
            
            // Load recent files
            let recentFiles: string[] = [];
            if (typeof window !== 'undefined' && window.electronAPI?.getRecentFiles) {
              try {
                recentFiles = await window.electronAPI.getRecentFiles();
              } catch (error) {
                console.warn('Could not load recent files:', error);
              }
            }
            
            set({
              isInitialized: true,
              platform,
              isElectron,
              isDevelopment,
              version,
              preferences,
              recentFiles
            });
            
            console.log('✅ App store initialized successfully');
          } catch (error) {
            console.error('❌ Failed to initialize app store:', error);
            set({ isInitialized: true }); // Still mark as initialized to prevent infinite loops
          }
        },
        
        setReady: (ready: boolean) => {
          set({ isReady: ready });
        },
        
        setQuitting: (quitting: boolean) => {
          set({ isQuitting: quitting });
        },
        
        // Platform and environment
        setPlatform: (platform: NodeJS.Platform) => {
          set({ platform });
        },
        
        setIsElectron: (isElectron: boolean) => {
          set({ isElectron });
        },
        
        setIsDevelopment: (isDevelopment: boolean) => {
          set({ isDevelopment });
        },
        
        setVersion: (version: string) => {
          set({ version });
        },
        
        // Preferences
        setPreferences: (preferences: Partial<AppState['preferences']>) => {
          set(state => ({
            preferences: { ...state.preferences, ...preferences }
          }));
          
          // Save preferences to storage
          if (typeof window !== 'undefined' && window.electronAPI?.setPreferences) {
            window.electronAPI.setPreferences(get().preferences).catch(console.error);
          }
        },
        
        updatePreference: <K extends keyof AppState['preferences']>(
          key: K,
          value: AppState['preferences'][K]
        ) => {
          set(state => ({
            preferences: { ...state.preferences, [key]: value }
          }));
          
          // Save preferences to storage
          if (typeof window !== 'undefined' && window.electronAPI?.setPreferences) {
            window.electronAPI.setPreferences(get().preferences).catch(console.error);
          }
        },
        
        // Recent files
        addRecentFile: (filePath: string) => {
          set(state => {
            // Remove if already in list
            const filtered = state.recentFiles.filter(file => file !== filePath);
            
            // Add to beginning of list
            const updated = [filePath, ...filtered];
            
            // Limit to recentFilesLimit
            const limited = updated.slice(0, state.preferences.recentFilesLimit);
            
            // Save to storage
            if (typeof window !== 'undefined' && window.electronAPI?.addRecentFile) {
              window.electronAPI.addRecentFile(filePath).catch(console.error);
            }
            
            return { recentFiles: limited };
          });
        },
        
        removeRecentFile: (filePath: string) => {
          set(state => ({
            recentFiles: state.recentFiles.filter(file => file !== filePath)
          }));
        },
        
        clearRecentFiles: () => {
          set({ recentFiles: [] });
          
          // Clear in storage
          if (typeof window !== 'undefined' && window.electronAPI?.clearRecentFiles) {
            window.electronAPI.clearRecentFiles().catch(console.error);
          }
        },
        
        // Window state
        setWindowState: (windowState: Partial<AppState['windowState']>) => {
          set(state => ({
            windowState: { ...state.windowState, ...windowState }
          }));
        },
        
        setMaximized: (isMaximized: boolean) => {
          set(state => ({
            windowState: { ...state.windowState, isMaximized }
          }));
        },
        
        setMinimized: (isMinimized: boolean) => {
          set(state => ({
            windowState: { ...state.windowState, isMinimized }
          }));
        },
        
        // User session
        login: (userId: string, userName: string) => {
          set({
            isAuthenticated: true,
            userId,
            userName
          });
        },
        
        logout: () => {
          set({
            isAuthenticated: false,
            userId: null,
            userName: null
          });
        },
        
        // Feature flags
        enableFeature: (feature: keyof AppState['features']) => {
          set(state => ({
            features: { ...state.features, [feature]: true }
          }));
        },
        
        disableFeature: (feature: keyof AppState['features']) => {
          set(state => ({
            features: { ...state.features, [feature]: false }
          }));
        },
        
        setFeature: (feature: keyof AppState['features'], enabled: boolean) => {
          set(state => ({
            features: { ...state.features, [feature]: enabled }
          }));
        },
        
        // Notifications
        addNotification: (
          title: string,
          message: string,
          type: 'info' | 'success' | 'warning' | 'error' = 'info',
          action?: () => void
        ) => {
          const notification = {
            id: `notification_${Date.now()}`,
            title,
            message,
            type,
            timestamp: new Date(),
            read: false,
            action
          };
          
          set(state => ({
            notifications: [notification, ...state.notifications].slice(0, 50) // Limit to 50 notifications
          }));
        },
        
        markNotificationAsRead: (id: string) => {
          set(state => ({
            notifications: state.notifications.map(notification =>
              notification.id === id ? { ...notification, read: true } : notification
            )
          }));
        },
        
        clearNotifications: () => {
          set({ notifications: [] });
        },
        
        // Error handling
        setError: (message: string, stack?: string, context?: string) => {
          const error = {
            message,
            stack: stack || new Error().stack || '',
            timestamp: new Date(),
            context: context || 'unknown'
          };
          
          set({ lastError: error });
          
          // Log error
          console.error(`[${context}] ${message}`, stack);
          
          // Add error notification
          get().addNotification('Error', message, 'error');
        },
        
        clearError: () => {
          set({ lastError: null });
        },
        
        // Reset
        reset: () => {
          set(initialAppState);
        }
      }),
      {
        name: 'pdf-app-storage',
        partialize: (state) => ({
          preferences: state.preferences,
          recentFiles: state.recentFiles,
          windowState: state.windowState,
          features: state.features,
          isAuthenticated: state.isAuthenticated,
          userId: state.userId,
          userName: state.userName
        })
      }
    )
  )
);

// Selector hooks for optimized re-renders
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
export const useShowThumbnails = () => useAppStore(state => state.preferences.showThumbnails);
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
export const useFeature = (feature: keyof AppState['features']) => 
  useAppStore(state => state.features[feature]);
export const useUnreadNotificationsCount = () => 
  useAppStore(state => state.notifications.filter(n => !n.read).length);

export default useAppStore;