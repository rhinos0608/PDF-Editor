import { contextBridge, ipcRenderer } from 'electron';

// Define the API interface
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

// Expose protected methods that allow the renderer process to interact with the main process
contextBridge.exposeInMainWorld('electronAPI', {
  openFile: () => ipcRenderer.invoke('open-file-dialog'),
  saveFileDialog: (defaultPath?: string) => ipcRenderer.invoke('save-file-dialog', defaultPath),
  saveFile: (filePath: string, data: ArrayBuffer) => ipcRenderer.invoke('save-file', filePath, data),
  getPreferences: () => ipcRenderer.invoke('get-preferences'),
  setPreferences: (preferences: any) => ipcRenderer.invoke('set-preferences', preferences),
  getRecentFiles: () => ipcRenderer.invoke('get-recent-files'),
  addRecentFile: (filePath: string) => ipcRenderer.invoke('add-recent-file', filePath),
  onMenuAction: (callback: (action: string) => void) => {
    // Remove any existing listeners to prevent duplicates
    ipcRenderer.removeAllListeners('menu-action');
    
    // Set up listener for all menu actions
    const menuActions = [
      'menu-open', 'menu-save', 'menu-save-as', 'menu-print',
      'menu-import-images', 'menu-import-word', 'menu-export-images',
      'menu-export-word', 'menu-export-text', 'menu-find', 'menu-replace',
      'menu-zoom-in', 'menu-zoom-out', 'menu-zoom-reset', 'menu-fit-width',
      'menu-fit-page', 'menu-rotate-left', 'menu-rotate-right', 'menu-toggle-theme',
      'menu-insert-page', 'menu-delete-page', 'menu-rotate-page', 'menu-extract-pages',
      'menu-merge-pdfs', 'menu-split-pdf', 'menu-compress', 'menu-optimize',
      'menu-tool-text', 'menu-tool-highlight', 'menu-tool-draw', 'menu-tool-shapes',
      'menu-tool-stamp', 'menu-tool-signature', 'menu-ocr', 'menu-redact',
      'menu-create-form', 'menu-edit-forms', 'menu-fill-form', 'menu-encrypt',
      'menu-decrypt', 'menu-digital-signature', 'menu-permissions', 'menu-shortcuts',
      'menu-check-updates'
    ];
    
    menuActions.forEach(action => {
      ipcRenderer.on(action, () => {
        // Convert menu action to simple action name
        const actionName = action.replace('menu-', '').replace(/-/g, '_');
        callback(actionName);
      });
    });
  },
  removeAllListeners: () => {
    ipcRenderer.removeAllListeners('menu-action');
  }
} as ElectronAPI);

// Declare global interface
declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
