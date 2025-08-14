/**
 * Electron API Type Definitions and Mock
 * Production-ready type safety with fallback support
 */

interface FileResult {
  data: ArrayBuffer;
  path: string;
}

interface SaveResult {
  success: boolean;
  error?: string;
}

interface Preferences {
  theme: 'light' | 'dark';
  defaultZoom: number;
  showThumbnails: boolean;
  autoSave: boolean;
  autoSaveInterval: number;
}

interface ElectronAPI {
  // File Operations
  openFile: () => Promise<FileResult | null>;
  saveFile: (path: string, data: ArrayBuffer) => Promise<SaveResult>;
  saveFileDialog: (defaultName: string) => Promise<string | null>;
  
  // Preferences
  getPreferences: () => Promise<Preferences>;
  setPreferences: (prefs: Partial<Preferences>) => Promise<void>;
  
  // Recent Files
  getRecentFiles: () => Promise<string[]>;
  addRecentFile: (path: string) => Promise<void>;
  clearRecentFiles: () => Promise<void>;
  
  // Menu Actions
  onMenuAction: (callback: (action: string) => void) => void;
  removeAllListeners: () => void;
  
  // Window Controls
  minimize: () => void;
  maximize: () => void;
  close: () => void;
  isMaximized: () => Promise<boolean>;
  setFullscreen: (flag: boolean) => void;
  
  // System
  getPlatform: () => Promise<string>;
  getVersion: () => Promise<string>;
}

// Ensure window.electronAPI is available globally
declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

// Create a mock implementation for development/testing
if (typeof window !== 'undefined' && !window.electronAPI) {
  console.warn('ElectronAPI not found, using mock implementation');
  
  window.electronAPI = {
    openFile: async () => null,
    saveFile: async () => ({ success: false, error: 'Mock implementation' }),
    saveFileDialog: async () => null,
    getPreferences: async () => ({
      theme: 'dark',
      defaultZoom: 100,
      showThumbnails: true,
      autoSave: true,
      autoSaveInterval: 300000
    }),
    setPreferences: async () => {},
    getRecentFiles: async () => [],
    addRecentFile: async () => {},
    clearRecentFiles: async () => {},
    onMenuAction: () => {},
    removeAllListeners: () => {},
    minimize: () => {},
    maximize: () => {},
    close: () => {},
    isMaximized: async () => false,
    setFullscreen: () => {},
    getPlatform: async () => 'win32',
    getVersion: async () => '1.0.0'
  };
}

export {};
