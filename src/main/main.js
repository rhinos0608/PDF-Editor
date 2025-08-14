{{ ... }}
// Add at the top with other imports
const { IPCValidator } = require('./ipcValidation');
const { app, BrowserWindow, Menu, ipcMain, dialog, shell, session } = require('electron');
const path = require('path');
const fs = require('fs');
const fsPromises = require('fs').promises;

// Fix GPU crashes - SECURE VERSION
{{ ... }}

// Create the main application window
function createWindow() {
  // Show splash screen first
  if (!splashWindow) {
    createSplashWindow();
  }

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    show: false, // Don't show until ready
    title: 'Professional PDF Editor',
    icon: path.join(__dirname, '../public/icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: true,
      sandbox: true,
      webgl: false,
      experimentalFeatures: false
    },
    backgroundColor: '#1e1e1e',
    autoHideMenuBar: false,
    frame: process.platform !== 'darwin',
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default'
  });

  // Register the window for IPC validation
  IPCValidator.registerWindow(mainWindow);

  // When window is ready to show
  mainWindow.once('ready-to-show', () => {
    setTimeout(() => {
      if (splashWindow) {
        splashWindow.destroy();
        splashWindow = null;
      }
      mainWindow.show();
    }, 1500); // Show splash for at least 1.5 seconds
  });
{{ ... }}

// Update IPC handlers to use the validation system
function setupIPCHandlers() {
  // Example of a secure file open handler
  IPCValidator.createHandler(
    'open-file',
    async (event, filePath) => {
      try {
        const safePath = IPCValidator.validateFilePath(filePath, ['.pdf']);
        const data = await fsPromises.readFile(safePath);
        return { success: true, data: data.buffer, fileName: path.basename(safePath) };
      } catch (error) {
        console.error('Error opening file:', error);
        return { success: false, error: error.message };
      }
    },
    {
      rateLimit: { maxCalls: 5, timeWindowMs: 1000 },
      validateArgs: (args) => {
        if (typeof args[0] !== 'string') {
          throw new Error('Invalid file path');
        }
      }
    }
  );

  // Example of a secure file save handler
  IPCValidator.createHandler(
    'save-file',
    async (event, filePath, data) => {
      try {
        const safePath = IPCValidator.validateFilePath(filePath, ['.pdf', '.txt']);
        await fsPromises.writeFile(safePath, Buffer.from(data));
        addToRecentFiles(safePath);
        return { success: true };
      } catch (error) {
        console.error('Error saving file:', error);
        return { success: false, error: error.message };
      }
    },
    {
      rateLimit: { maxCalls: 5, timeWindowMs: 1000 },
      validateArgs: (args) => {
        if (typeof args[0] !== 'string' || !(args[1] instanceof ArrayBuffer)) {
          throw new Error('Invalid arguments');
        }
      }
    }
  );
}

// Call this function after app.whenReady()
app.whenReady().then(async () => {
  // Existing initialization code...
  setupIPCHandlers();
  // Rest of the initialization...
});
{{ ... }}
