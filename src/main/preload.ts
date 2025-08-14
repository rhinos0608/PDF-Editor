import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';
import * as path from 'path';
import { isValidPath, sanitizePath, isValidArrayBuffer, isValidMenuAction, isValidPreferences } from '../utils/validation';

// Type-safe API interface
interface ElectronAPI {
  openFile: () => Promise<{ path: string; data: ArrayBuffer } | null>;
  saveFileDialog: (defaultPath?: string) => Promise<string | null>;
  saveFile: (filePath: string, data: ArrayBuffer) => Promise<{ success: boolean; error?: string }>;
  getPreferences: () => Promise<any>;
  setPreferences: (preferences: any) => Promise<{ success: boolean }>;
  getRecentFiles: () => Promise<string[]>;
  addRecentFile: (filePath: string) => Promise<string[]>;
  onMenuAction: (callback: (action: string) => void) => void;
  removeAllListeners: () => void;
}

// Menu actions that we listen for
const menuActions = [
  'menu-open', 'menu-save', 'menu-save-as', 'menu-print',
  'menu-zoom-in', 'menu-zoom-out', 'menu-zoom-reset',
  'menu-fit-width', 'menu-fit-page',
  'menu-rotate-left', 'menu-rotate-right',
  'menu-toggle-theme', 'menu-find',
  'menu-insert-page', 'menu-delete-page',
  'menu-merge-pdfs', 'menu-split-pdf',
  'menu-compress', 'menu-ocr',
  'menu-encrypt', 'menu-decrypt',
  'menu-tool-text', 'menu-tool-highlight',
  'menu-tool-draw', 'menu-tool-shapes',
  'menu-tool-stamp', 'menu-tool-signature'
];

// Expose API to renderer
contextBridge.exposeInMainWorld('electronAPI', {
  openFile: async () => {
    try {
      const result = await ipcRenderer.invoke('open-file-dialog');
      if (result && result.path) {
        // Validate and normalize the path for consistent handling
        if (!isValidPath(result.path)) {
          throw new Error('Invalid file path received from main process');
        }
        result.path = path.normalize(result.path);
      }
      return result;
    } catch (error) {
      console.error('Error in openFile:', error);
      throw error;
    }
  },
  
  saveFileDialog: async (defaultPath?: string) => {
    try {
      // Validate and sanitize defaultPath
      if (defaultPath && typeof defaultPath === 'string') {
        defaultPath = sanitizePath(defaultPath);
        if (defaultPath.length > 255) {
          throw new Error('Default path too long');
        }
      }
      
      const result = await ipcRenderer.invoke('save-file-dialog', defaultPath);
      
      if (result) {
        // Validate the returned path
        if (!isValidPath(result)) {
          throw new Error('Invalid save path received from main process');
        }
        return path.normalize(result);
      }
      
      return null;
    } catch (error) {
      console.error('Error in saveFileDialog:', error);
      throw error;
    }
  },
  
  saveFile: async (filePath: string, data: ArrayBuffer) => {
    try {
      // Validate inputs
      if (!filePath || typeof filePath !== 'string') {
        throw new Error('Invalid file path');
      }
      
      if (!isValidArrayBuffer(data)) {
        throw new Error('Invalid file data');
      }
      
      // Sanitize and validate file path
      const sanitizedPath = sanitizePath(filePath);
      if (!isValidPath(sanitizedPath)) {
        throw new Error('Invalid or unsafe file path');
      }
      
      const normalizedPath = path.normalize(sanitizedPath);
      return await ipcRenderer.invoke('save-file', normalizedPath, data);
    } catch (error) {
      console.error('Error in saveFile:', error);
      throw error;
    }
  },
  
  getPreferences: async () => {
    try {
      const preferences = await ipcRenderer.invoke('get-preferences');
      
      // Basic validation of returned preferences
      if (preferences && typeof preferences !== 'object') {
        throw new Error('Invalid preferences data received from main process');
      }
      
      return preferences || {};
    } catch (error) {
      console.error('Error getting preferences:', error);
      return {};
    }
  },
  
  setPreferences: async (preferences: any) => {
    try {
      // Validate preferences object
      if (!isValidPreferences(preferences)) {
        throw new Error('Invalid preferences data');
      }
      
      return await ipcRenderer.invoke('set-preferences', preferences);
    } catch (error) {
      console.error('Error setting preferences:', error);
      return { success: false };
    }
  },
  
  getRecentFiles: async () => {
    try {
      const files = await ipcRenderer.invoke('get-recent-files');
      
      // Validate and normalize returned file paths
      if (Array.isArray(files)) {
        return files
          .filter(f => typeof f === 'string' && isValidPath(f))
          .map(f => path.normalize(f));
      }
      
      return [];
    } catch (error) {
      console.error('Error getting recent files:', error);
      return [];
    }
  },
  
  addRecentFile: async (filePath: string) => {
    try {
      // Validate file path
      if (!filePath || typeof filePath !== 'string') {
        throw new Error('Invalid file path');
      }
      
      // Sanitize and validate file path
      const sanitizedPath = sanitizePath(filePath);
      if (!isValidPath(sanitizedPath)) {
        throw new Error('Invalid or unsafe file path');
      }
      
      const normalizedPath = path.normalize(sanitizedPath);
      return await ipcRenderer.invoke('add-recent-file', normalizedPath);
    } catch (error) {
      console.error('Error adding recent file:', error);
      return [];
    }
  },
  
  onMenuAction: (callback: (action: string) => void) => {
    // Remove existing listeners
    menuActions.forEach(action => {
      ipcRenderer.removeAllListeners(action);
    });
    
    // Add new listeners with validation
    menuActions.forEach(action => {
      ipcRenderer.on(action, () => {
        // Validate menu action
        if (!isValidMenuAction(action)) {
          console.warn('Invalid menu action received:', action);
          return;
        }
        
        callback(action);
      });
    });
  },
  
  removeAllListeners: () => {
    menuActions.forEach(action => {
      ipcRenderer.removeAllListeners(action);
    });
  }
} as ElectronAPI);

// Declare global interface
declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
