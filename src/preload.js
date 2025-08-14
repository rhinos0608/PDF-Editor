/**
 * Electron Preload Script
 * Securely exposes IPC methods to the renderer process
 */

const { contextBridge, ipcRenderer } = require('electron');
const path = require('path');



// Detect Electron environment and mode
const isElectron = process.contextIsolated && process.versions.electron;
const isDevelopment = process.env.NODE_ENV === 'development';

// Environment information for the renderer
const environmentInfo = {
  isElectron,
  isDevelopment,
  platform: process.platform,
  nodeVersion: process.version,
  electronVersion: process.versions?.electron,
  chromeVersion: process.versions?.chrome
};

// Expose protected methods in the renderer
contextBridge.exposeInMainWorld('electronAPI', {
  /**
   * Provides environment information (e.g., isElectron, isDevelopment, platform, versions).
   * @type {object}
   */
  environment: environmentInfo,
  /**
   * Checks if the application is running in an Electron environment.
   * @returns {boolean} True if running in Electron, false otherwise.
   */
  isElectron: () => isElectron,
  /**
   * Checks if the application is running in development mode.
   * @returns {boolean} True if in development mode, false otherwise.
   */
  isDevelopment: () => isDevelopment,
  
  /**\n   * Opens a file dialog and returns the selected file's path and content.\n   * @param {Object} [options] - Options for the file dialog.\n   * @param {boolean} [options.multiSelections=false] - Whether to allow multiple file selections.\n   * @returns {Promise<{success: boolean, data?: ArrayBuffer, path?: string, files?: Array<{data: ArrayBuffer, path: string}>, cancelled?: boolean, error?: string}>} A promise that resolves with the file data or an error.\n   */
  openFile: (options) => ipcRenderer.invoke('open-file', options),
  
  /**
   * Saves data to a specified file path.
   * @param {string} filePath - The absolute path where the file should be saved.
   * @param {ArrayBuffer} data - The content to save as an ArrayBuffer.
   * @returns {Promise<{success: boolean, error?: string}>} A promise that resolves with success status or an error.
   * @throws {Error} If data is not an ArrayBuffer.
   */
  saveFile: (filePath, data) => {
    // Ensure data is ArrayBuffer
    if (!(data instanceof ArrayBuffer)) {
      throw new Error('Data must be ArrayBuffer');
    }
    return ipcRenderer.invoke('save-file', filePath, data);
  },
  
  /**
   * Shows a save file dialog and returns the selected file path.
   * @param {string} [defaultName='document.pdf'] - The default file name for the save dialog.
   * @returns {Promise<{success: boolean, filePath?: string, cancelled?: boolean, error?: string}>} A promise that resolves with the selected file path or an error.
   */
  saveFileDialog: (defaultName) => ipcRenderer.invoke('save-file-dialog', defaultName),
  
  /**
   * Retrieves user preferences.
   * @returns {Promise<object>} A promise that resolves with the user preferences object.
   */
  getPreferences: () => ipcRenderer.invoke('get-preferences'),
  /**
   * Sets user preferences.
   * @param {object} prefs - The preferences object to set.
   * @returns {Promise<object>} A promise that resolves with the updated preferences object.
   */
  setPreferences: (prefs) => ipcRenderer.invoke('set-preferences', prefs),
  
  /**
   * Retrieves a list of recently opened files.
   * @returns {Promise<string[]>} A promise that resolves with an array of recent file paths.
   */
  getRecentFiles: () => ipcRenderer.invoke('get-recent-files'),
  /**
   * Adds a file path to the list of recent files.
   * @param {string} filePath - The path of the file to add.
   * @returns {Promise<string[]>} A promise that resolves with the updated array of recent file paths.
   */
  addRecentFile: (filePath) => ipcRenderer.invoke('add-recent-file', filePath),
  /**
   * Clears the list of recent files.
   * @returns {Promise<string[]>} A promise that resolves with an empty array after clearing.
   */
  clearRecentFiles: () => ipcRenderer.invoke('clear-recent-files'),
  
  /**
   * Registers a callback to be invoked when a menu action is triggered from the main process.
   * @param {(action: string) => void} callback - The function to call with the menu action string.
   */
  onMenuAction: (callback) => {
    // Remove any existing listeners first
    ipcRenderer.removeAllListeners('menu-action');
    ipcRenderer.on('menu-action', (event, action) => callback(action));
  },
  
  /**
   * Removes all registered listeners for IPC channels.
   */
  removeAllListeners: () => {
    // validChannels is removed, so we need to explicitly list channels or find another way
    // For now, we will just remove all listeners for 'menu-action'
    ipcRenderer.removeAllListeners('menu-action');
  },
  
  /**
   * Minimizes the main window.
   */
  minimize: () => ipcRenderer.send('minimize-window'),
  /**
   * Maximizes or unmaximizes the main window.
   */
  maximize: () => ipcRenderer.send('maximize-window'),
  /**
   * Closes the main window.
   */
  close: () => ipcRenderer.send('close-window'),
  /**
   * Checks if the main window is maximized.
   * @returns {Promise<boolean>} A promise that resolves with true if the window is maximized, false otherwise.
   */
  isMaximized: () => ipcRenderer.invoke('is-maximized'),
  /**
   * Sets the fullscreen state of the main window.
   * @param {boolean} flag - True to enter fullscreen, false to exit.
   */
  setFullscreen: (flag) => ipcRenderer.send('set-fullscreen', flag),
  
  /**
   * Retrieves the operating system platform.
   * @returns {Promise<string>} A promise that resolves with the platform string (e.g., 'win32', 'darwin', 'linux').
   */
  getPlatform: () => ipcRenderer.invoke('get-platform'),
  /**
   * Retrieves the application version.
   * @returns {Promise<string>} A promise that resolves with the application version string.
   */
  getVersion: () => ipcRenderer.invoke('get-version'),
  
  // File System operations are handled through main process file dialogs for security
  // Direct readFile/writeFile operations are not exposed to prevent arbitrary file access
});

// Initialize PDF.js worker with smart path detection
// Initialize PDF.js worker
if (isElectron) {
  // In Electron, use the bundled worker
  window.pdfjsLib.GlobalWorkerOptions.workerSrc = path.join(__dirname, '../node_modules/pdfjs-dist/build/pdf.worker.min.js');
} else {
  // In web mode, use a CDN or local path
  window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@latest/build/pdf.worker.min.js';
}
console.log(`✅ PDF.js worker configured for ${isElectron ? 'Electron' : 'Web'} mode.`);

// Provide fallback API for web mode
if (!isElectron) {
  console.log('🌐 Running in web mode, providing mock electronAPI');
  
  // Mock electronAPI for web development
  if (typeof window !== 'undefined' && !window.electronAPI) {
    window.electronAPI = {
      // Environment Detection
      environment: environmentInfo,
      isElectron: () => false,
      isDevelopment: () => isDevelopment,
      
      // Mock file operations with user-friendly messages
      openFile: async () => {
        console.warn('File operations not available in web mode');
        return { success: false, error: 'File operations require Electron desktop app' };
      },
      
      saveFile: async () => {
        console.warn('File save not available in web mode');
        return { success: false, error: 'File saving requires Electron desktop app' };
      },
      
      saveFileDialog: async () => {
        console.warn('Save dialog not available in web mode');
        return { success: false, error: 'Save dialog requires Electron desktop app' };
      },
      
      // Mock system operations
      getPlatform: async () => navigator.platform || 'web',
      getVersion: async () => 'Web Version',
      
      // Mock preferences (use localStorage)
      getPreferences: async () => {
        try {
          const prefs = localStorage.getItem('pdfEditor_preferences');
          return prefs ? JSON.parse(prefs) : {};
        } catch {
          return {};
        }
      },
      
      setPreferences: async (prefs) => {
        try {
          localStorage.setItem('pdfEditor_preferences', JSON.stringify(prefs));
          return prefs;
        } catch (error) {
          return { success: false, error: 'Failed to save preferences' };
        }
      },
      
      // Mock window controls
      minimize: () => console.warn('Window controls not available in web mode'),
      maximize: () => console.warn('Window controls not available in web mode'),
      close: () => console.warn('Window controls not available in web mode'),
      
      // Mock menu actions
      onMenuAction: () => console.warn('Menu actions not available in web mode'),
      removeAllListeners: () => {}
    };
  }
}

// Handle security warnings
window.addEventListener('error', (event) => {
  // Log errors but prevent them from breaking the app
  console.error('Renderer error:', event.error);
  
  // Send critical errors to main process for logging
  if (event.error && event.error.stack) {
    ipcRenderer.send('renderer-error', {
      message: event.error.message,
      stack: event.error.stack,
      timestamp: new Date().toISOString()
    });
  }
});

// Performance monitoring
const performanceObserver = new PerformanceObserver((list) => {
  const entries = list.getEntries();
  entries.forEach((entry) => {
    if (entry.duration > 1000) {
      console.warn(`Slow operation detected: ${entry.name} took ${entry.duration}ms`);
    }
  });
});

performanceObserver.observe({ entryTypes: ['measure', 'navigation'] });
