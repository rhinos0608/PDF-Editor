const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // File operations
  openFile: () => ipcRenderer.invoke('open-file-dialog'),
  saveFileDialog: (defaultPath) => ipcRenderer.invoke('save-file-dialog', defaultPath),
  saveFile: (filePath, data) => ipcRenderer.invoke('save-file', filePath, data),
  
  // Preferences
  getPreferences: () => ipcRenderer.invoke('get-preferences'),
  setPreferences: (preferences) => ipcRenderer.invoke('set-preferences', preferences),
  
  // Recent files
  getRecentFiles: () => ipcRenderer.invoke('get-recent-files'),
  addRecentFile: (filePath) => ipcRenderer.invoke('add-recent-file', filePath),
  
  // Menu events listener
  onMenuAction: (callback) => {
    const validChannels = [
      'menu-open', 'menu-save', 'menu-save-as', 'menu-print',
      'menu-import-images', 'menu-import-word', 'menu-export-images',
      'menu-export-word', 'menu-export-text', 'menu-find', 'menu-replace',
      'menu-zoom-in', 'menu-zoom-out', 'menu-zoom-reset', 'menu-fit-width',
      'menu-fit-page', 'menu-rotate-left', 'menu-rotate-right',
      'menu-toggle-theme', 'menu-insert-page', 'menu-delete-page',
      'menu-rotate-page', 'menu-extract-pages', 'menu-merge-pdfs',
      'menu-split-pdf', 'menu-compress', 'menu-optimize', 'menu-tool-text',
      'menu-tool-highlight', 'menu-tool-draw', 'menu-tool-shapes',
      'menu-tool-stamp', 'menu-tool-signature', 'menu-ocr', 'menu-redact',
      'menu-create-form', 'menu-edit-forms', 'menu-fill-form',
      'menu-encrypt', 'menu-decrypt', 'menu-digital-signature',
      'menu-permissions', 'menu-shortcuts', 'menu-check-updates'
    ];
    
    validChannels.forEach(channel => {
      ipcRenderer.on(channel, () => callback(channel.replace('menu-', '')));
    });
  },
  
  // Remove all listeners
  removeAllListeners: () => {
    ipcRenderer.removeAllListeners();
  }
});
