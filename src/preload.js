/**
 * Electron Preload Script
 * Securely exposes IPC methods to the renderer process
 */

const { contextBridge, ipcRenderer } = require('electron');
const path = require('path');

// Validate IPC channels for security
const validChannels = {
  send: [
    'open-file',
    'save-file',
    'save-file-dialog',
    'get-preferences',
    'set-preferences',
    'get-recent-files',
    'add-recent-file',
    'clear-recent-files',
    'minimize-window',
    'maximize-window',
    'close-window',
    'set-fullscreen',
    'get-platform',
    'get-version'
  ],
  receive: [
    'menu-action',
    'file-opened',
    'preferences-changed',
    'window-state-changed'
  ]
};

// Expose protected methods in the renderer
contextBridge.exposeInMainWorld('electronAPI', {
  // File Operations
  openFile: () => ipcRenderer.invoke('open-file'),
  
  saveFile: (filePath, data) => {
    // Ensure data is ArrayBuffer
    if (!(data instanceof ArrayBuffer)) {
      throw new Error('Data must be ArrayBuffer');
    }
    return ipcRenderer.invoke('save-file', filePath, data);
  },
  
  saveFileDialog: (defaultName) => ipcRenderer.invoke('save-file-dialog', defaultName),
  
  // Preferences
  getPreferences: () => ipcRenderer.invoke('get-preferences'),
  setPreferences: (prefs) => ipcRenderer.invoke('set-preferences', prefs),
  
  // Recent Files
  getRecentFiles: () => ipcRenderer.invoke('get-recent-files'),
  addRecentFile: (filePath) => ipcRenderer.invoke('add-recent-file', filePath),
  clearRecentFiles: () => ipcRenderer.invoke('clear-recent-files'),
  
  // Menu Actions
  onMenuAction: (callback) => {
    // Remove any existing listeners first
    ipcRenderer.removeAllListeners('menu-action');
    ipcRenderer.on('menu-action', (event, action) => callback(action));
  },
  
  removeAllListeners: () => {
    validChannels.receive.forEach(channel => {
      ipcRenderer.removeAllListeners(channel);
    });
  },
  
  // Window Controls
  minimize: () => ipcRenderer.send('minimize-window'),
  maximize: () => ipcRenderer.send('maximize-window'),
  close: () => ipcRenderer.send('close-window'),
  isMaximized: () => ipcRenderer.invoke('is-maximized'),
  setFullscreen: (flag) => ipcRenderer.send('set-fullscreen', flag),
  
  // System
  getPlatform: () => ipcRenderer.invoke('get-platform'),
  getVersion: () => ipcRenderer.invoke('get-version'),
  
  // File System (for file operations)
  readFile: async (filePath) => {
    try {
      const result = await ipcRenderer.invoke('read-file', filePath);
      return result;
    } catch (error) {
      console.error('Error reading file:', error);
      throw error;
    }
  },
  
  writeFile: async (filePath, data) => {
    try {
      const result = await ipcRenderer.invoke('write-file', filePath, data);
      return result;
    } catch (error) {
      console.error('Error writing file:', error);
      throw error;
    }
  }
});

// Initialize PDF.js worker
window.addEventListener('DOMContentLoaded', () => {
  // Set up PDF.js worker path
  if (window.pdfjsLib) {
    const pdfjsDistPath = path.join(__dirname, '../node_modules/pdfjs-dist');
    window.pdfjsLib.GlobalWorkerOptions.workerSrc = path.join(pdfjsDistPath, 'build/pdf.worker.min.js');
  }
});

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
