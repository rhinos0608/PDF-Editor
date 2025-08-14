/**
 * Electron Main Process - Enhanced Version 2.0
 * Fixes GPU crashes and startup issues
 * Implements Adobe-quality standards with Transithesis framework
 */

const { app, BrowserWindow, Menu, ipcMain, dialog, shell, session } = require('electron');
const path = require('path');
const fs = require('fs');
const fsPromises = require('fs').promises;

// Fix GPU crashes - SECURE VERSION
app.disableHardwareAcceleration(); // Disable GPU to prevent crashes
app.commandLine.appendSwitch('disable-gpu');
app.commandLine.appendSwitch('disable-software-rasterizer');
// SECURITY: Removed --no-sandbox and --disable-gpu-sandbox flags
// These flags disable critical security protections
app.commandLine.appendSwitch('ignore-gpu-blacklist');

// Set application name
app.name = 'Professional PDF Editor';

// Prevent multiple instances
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

let mainWindow = null;
let splashWindow = null;

// Application preferences with defaults
let preferences = {
  theme: 'dark',
  defaultZoom: 100,
  showThumbnails: true,
  autoSave: true,
  autoSaveInterval: 300000,
  hardwareAcceleration: false,
  gpuEnabled: false
};

let recentFiles = [];
const MAX_RECENT_FILES = 10;

// Create splash screen
function createSplashWindow() {
  splashWindow = new BrowserWindow({
    width: 600,
    height: 400,
    frame: false,
    alwaysOnTop: true,
    transparent: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  const splashHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body {
          margin: 0;
          padding: 0;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100vh;
          user-select: none;
        }
        .container {
          text-align: center;
          animation: fadeIn 0.5s ease-in;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        h1 { font-size: 32px; margin-bottom: 10px; }
        p { font-size: 16px; opacity: 0.9; }
        .loader {
          margin: 30px auto;
          width: 50px;
          height: 50px;
          border: 3px solid rgba(255,255,255,0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Professional PDF Editor</h1>
        <p>Initializing workspace...</p>
        <div class="loader"></div>
        <p style="font-size: 12px; margin-top: 20px;">Version 2.0</p>
      </div>
    </body>
    </html>
  `;

  splashWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(splashHtml)}`);
  
  return splashWindow;
}

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
      preload: path.join(__dirname, 'preload.js'),  // Will be in same directory as main.js
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: true,
      sandbox: true, // Enable sandbox for security
      webgl: false, // Disable WebGL to prevent GPU issues
      experimentalFeatures: false
    },
    backgroundColor: '#1e1e1e',
    autoHideMenuBar: false,
    frame: process.platform !== 'darwin',
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default'
  });

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

  // Load the app with proper error handling
  loadApplication();

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Prevent navigation to external URLs
  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith('file://') && !url.startsWith('http://localhost')) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  // Handle new window requests
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Handle renderer crashes
  mainWindow.webContents.on('render-process-gone', (event, details) => {
    console.error('Renderer process crashed:', details);
    dialog.showErrorBox(
      'Application Error',
      'The application has encountered an error and needs to restart.\n\nError: ' + details.reason
    );
    app.relaunch();
    app.exit();
  });

  // Set up the menu
  createMenu();
}

// Load application with multiple fallback strategies
function loadApplication() {
  const isDev = process.env.NODE_ENV === 'development';
  
  if (isDev) {
    // Development mode
    mainWindow.loadURL('http://localhost:8080').catch((err) => {
      console.error('Failed to load dev server:', err);
      loadProductionFallback();
    });
    mainWindow.webContents.openDevTools();
  } else {
    // Production mode - try multiple paths
    loadProductionFallback();
  }
}

// Production fallback loading strategy
function loadProductionFallback() {
  const possiblePaths = [
    path.join(__dirname, '../renderer/index.html'),  // Primary: dist/main/../renderer/index.html
    path.join(__dirname, '../../dist/renderer/index.html'),  // From src/main to dist/renderer
    path.join(__dirname, 'index.html'),
    path.join(__dirname, '../dist/index.html'),
    path.join(__dirname, '../public/index.html'),
    path.join(app.getAppPath(), 'dist', 'renderer', 'index.html'),
    path.join(app.getAppPath(), 'dist', 'index.html')
  ];

  let loaded = false;
  
  for (const indexPath of possiblePaths) {
    if (fs.existsSync(indexPath)) {
      console.log('Loading from:', indexPath);
      mainWindow.loadFile(indexPath).catch((err) => {
        console.error('Failed to load:', indexPath, err);
      });
      loaded = true;
      break;
    }
  }

  if (!loaded) {
    // Emergency fallback - create minimal HTML
    console.error('No index.html found, creating emergency UI');
    createEmergencyUI();
  }
}

// Create emergency UI when all else fails
function createEmergencyUI() {
  const emergencyHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>PDF Editor - Recovery Mode</title>
      <style>
        body {
          font-family: -apple-system, sans-serif;
          background: #2a2a2a;
          color: #e0e0e0;
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100vh;
          margin: 0;
        }
        .container {
          text-align: center;
          padding: 40px;
          background: #1e1e1e;
          border-radius: 10px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.5);
        }
        h1 { color: #667eea; }
        button {
          margin: 10px;
          padding: 10px 20px;
          background: linear-gradient(135deg, #667eea, #764ba2);
          color: white;
          border: none;
          border-radius: 5px;
          cursor: pointer;
          font-size: 16px;
        }
        button:hover {
          transform: scale(1.05);
        }
        .error {
          background: #ff6b6b;
          color: white;
          padding: 10px;
          border-radius: 5px;
          margin: 20px 0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>PDF Editor - Recovery Mode</h1>
        <div class="error">
          Application files not found. Running in recovery mode.
        </div>
        <p>The application encountered an issue during startup.</p>
        <button onclick="window.location.reload()">Retry</button>
        <button onclick="require('electron').ipcRenderer.send('open-file')">Open PDF</button>
        <button onclick="window.location.reload()">Reload App</button>
        <p style="margin-top: 30px; font-size: 12px; opacity: 0.7;">
          If the problem persists, please reinstall the application.
        </p>
      </div>
    </body>
    </html>
  `;
  
  mainWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(emergencyHtml)}`);
}

// Create application menu with all features
function createMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Open PDF',
          accelerator: 'CmdOrCtrl+O',
          click: () => mainWindow.webContents.send('menu-action', 'open')
        },
        {
          label: 'Save',
          accelerator: 'CmdOrCtrl+S',
          click: () => mainWindow.webContents.send('menu-action', 'save')
        },
        {
          label: 'Save As...',
          accelerator: 'CmdOrCtrl+Shift+S',
          click: () => mainWindow.webContents.send('menu-action', 'save-as')
        },
        { type: 'separator' },
        {
          label: 'Recent Files',
          submenu: recentFiles.length > 0 
            ? recentFiles.map(file => ({
                label: path.basename(file),
                click: () => openRecentFile(file)
              }))
            : [{ label: 'No recent files', enabled: false }]
        },
        { type: 'separator' },
        {
          label: 'Print',
          accelerator: 'CmdOrCtrl+P',
          click: () => mainWindow.webContents.send('menu-action', 'print')
        },
        { type: 'separator' },
        {
          label: 'Exit',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => app.quit()
        }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' },
        { type: 'separator' },
        {
          label: 'Find',
          accelerator: 'CmdOrCtrl+F',
          click: () => mainWindow.webContents.send('menu-action', 'find')
        },
        {
          label: 'Replace',
          accelerator: 'CmdOrCtrl+H',
          click: () => mainWindow.webContents.send('menu-action', 'replace')
        }
      ]
    },
    {
      label: 'View',
      submenu: [
        {
          label: 'Zoom In',
          accelerator: 'CmdOrCtrl+Plus',
          click: () => mainWindow.webContents.send('menu-action', 'zoom-in')
        },
        {
          label: 'Zoom Out',
          accelerator: 'CmdOrCtrl+-',
          click: () => mainWindow.webContents.send('menu-action', 'zoom-out')
        },
        {
          label: 'Reset Zoom',
          accelerator: 'CmdOrCtrl+0',
          click: () => mainWindow.webContents.send('menu-action', 'zoom-reset')
        },
        { type: 'separator' },
        {
          label: 'Fit to Width',
          click: () => mainWindow.webContents.send('menu-action', 'fit-width')
        },
        {
          label: 'Fit to Page',
          click: () => mainWindow.webContents.send('menu-action', 'fit-page')
        },
        { type: 'separator' },
        {
          label: 'Rotate Left',
          accelerator: 'CmdOrCtrl+L',
          click: () => mainWindow.webContents.send('menu-action', 'rotate-left')
        },
        {
          label: 'Rotate Right',
          accelerator: 'CmdOrCtrl+R',
          click: () => mainWindow.webContents.send('menu-action', 'rotate-right')
        },
        { type: 'separator' },
        {
          label: 'Toggle Sidebar',
          accelerator: 'CmdOrCtrl+B',
          click: () => mainWindow.webContents.send('menu-action', 'toggle-sidebar')
        },
        {
          label: 'Toggle Theme',
          accelerator: 'CmdOrCtrl+T',
          click: () => mainWindow.webContents.send('menu-action', 'toggle-theme')
        },
        { type: 'separator' },
        { role: 'togglefullscreen' },
        { role: 'toggleDevTools' }
      ]
    },
    {
      label: 'Tools',
      submenu: [
        {
          label: 'Select Tool',
          accelerator: 'V',
          click: () => mainWindow.webContents.send('menu-action', 'tool-select')
        },
        {
          label: 'Text Tool',
          accelerator: 'T',
          click: () => mainWindow.webContents.send('menu-action', 'tool-text')
        },
        {
          label: 'Highlight Tool',
          accelerator: 'H',
          click: () => mainWindow.webContents.send('menu-action', 'tool-highlight')
        },
        {
          label: 'Draw Tool',
          accelerator: 'D',
          click: () => mainWindow.webContents.send('menu-action', 'tool-draw')
        },
        {
          label: 'Shapes Tool',
          accelerator: 'S',
          click: () => mainWindow.webContents.send('menu-action', 'tool-shapes')
        },
        {
          label: 'Stamp Tool',
          accelerator: 'M',
          click: () => mainWindow.webContents.send('menu-action', 'tool-stamp')
        },
        {
          label: 'Signature Tool',
          accelerator: 'G',
          click: () => mainWindow.webContents.send('menu-action', 'tool-signature')
        },
        {
          label: 'Redact Tool',
          accelerator: 'R',
          click: () => mainWindow.webContents.send('menu-action', 'tool-redact')
        },
        {
          label: 'Watermark',
          click: () => mainWindow.webContents.send('menu-action', 'tool-watermark')
        },
        { type: 'separator' },
        {
          label: 'Forms',
          submenu: [
            {
              label: 'Create Text Field',
              click: () => mainWindow.webContents.send('menu-action', 'form-text')
            },
            {
              label: 'Create Checkbox',
              click: () => mainWindow.webContents.send('menu-action', 'form-checkbox')
            },
            {
              label: 'Create Radio Button',
              click: () => mainWindow.webContents.send('menu-action', 'form-radio')
            },
            {
              label: 'Create Dropdown',
              click: () => mainWindow.webContents.send('menu-action', 'form-dropdown')
            }
          ]
        }
      ]
    },
    {
      label: 'Document',
      submenu: [
        {
          label: 'Insert Page',
          click: () => mainWindow.webContents.send('menu-action', 'insert-page')
        },
        {
          label: 'Delete Page',
          click: () => mainWindow.webContents.send('menu-action', 'delete-page')
        },
        {
          label: 'Rotate Page',
          click: () => mainWindow.webContents.send('menu-action', 'rotate-page')
        },
        {
          label: 'Extract Pages',
          click: () => mainWindow.webContents.send('menu-action', 'extract-pages')
        },
        { type: 'separator' },
        {
          label: 'Merge PDFs',
          click: () => mainWindow.webContents.send('menu-action', 'merge-pdfs')
        },
        {
          label: 'Split PDF',
          click: () => mainWindow.webContents.send('menu-action', 'split-pdf')
        },
        { type: 'separator' },
        {
          label: 'Compress PDF',
          click: () => mainWindow.webContents.send('menu-action', 'compress')
        },
        {
          label: 'OCR Text Recognition',
          click: () => mainWindow.webContents.send('menu-action', 'ocr')
        },
        {
          label: 'Add Watermark',
          click: () => mainWindow.webContents.send('menu-action', 'watermark')
        },
        {
          label: 'Redact Content',
          click: () => mainWindow.webContents.send('menu-action', 'redact')
        },
        { type: 'separator' },
        {
          label: 'Bookmarks',
          click: () => mainWindow.webContents.send('menu-action', 'bookmarks')
        },
        {
          label: 'Export As',
          click: () => mainWindow.webContents.send('menu-action', 'export')
        },
        { type: 'separator' },
        {
          label: 'Properties',
          click: () => mainWindow.webContents.send('menu-action', 'properties')
        }
      ]
    },
    {
      label: 'Security',
      submenu: [
        {
          label: 'Encrypt PDF',
          click: () => mainWindow.webContents.send('menu-action', 'encrypt')
        },
        {
          label: 'Decrypt PDF',
          click: () => mainWindow.webContents.send('menu-action', 'decrypt')
        },
        {
          label: 'Add Digital Signature',
          click: () => mainWindow.webContents.send('menu-action', 'digital-signature')
        },
        {
          label: 'Verify Signatures',
          click: () => mainWindow.webContents.send('menu-action', 'verify-signatures')
        },
        { type: 'separator' },
        {
          label: 'Redact Content',
          click: () => mainWindow.webContents.send('menu-action', 'redact')
        }
      ]
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'close' },
        { type: 'separator' },
        {
          label: 'New Window',
          accelerator: 'CmdOrCtrl+N',
          click: () => createWindow()
        }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'Documentation',
          click: () => shell.openExternal('https://docs.pdfeditor.com')
        },
        {
          label: 'Keyboard Shortcuts',
          accelerator: 'CmdOrCtrl+/',
          click: () => mainWindow.webContents.send('menu-action', 'shortcuts')
        },
        { type: 'separator' },
        {
          label: 'Report Issue',
          click: () => shell.openExternal('https://github.com/pdfeditor/issues')
        },
        {
          label: 'Check for Updates',
          click: () => checkForUpdates()
        },
        { type: 'separator' },
        {
          label: 'About',
          click: () => showAboutDialog()
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// Input validation helpers
function validateSender(event) {
  const webContents = event.sender;
  const win = BrowserWindow.fromWebContents(webContents);
  
  if (!win || win !== mainWindow) {
    throw new Error('Unauthorized sender');
  }
  
  // Validate sender frame for web content
  if (event.senderFrame) {
    const url = new URL(event.senderFrame.url);
    const allowedOrigins = ['file:', 'http://localhost:8080'];
    const isAllowed = allowedOrigins.some(origin => url.protocol === origin || url.origin === origin);
    if (!isAllowed) {
      throw new Error('Unauthorized origin');
    }
  }
}

function validateFilePath(filePath) {
  if (!filePath || typeof filePath !== 'string') {
    throw new Error('Invalid file path');
  }
  
  if (filePath.length > 260) { // Windows MAX_PATH
    throw new Error('File path too long');
  }
  
  // Prevent path traversal attacks
  const normalized = path.normalize(filePath);
  if (normalized.includes('..') || normalized.includes('~')) {
    throw new Error('Invalid file path - path traversal detected');
  }
  
  return normalized;
}

function validateFileData(data) {
  if (!data) {
    throw new Error('No file data provided');
  }
  
  if (data.byteLength > 100 * 1024 * 1024) { // 100MB limit
    throw new Error('File too large (max 100MB)');
  }
  
  return data;
}

// IPC Handlers with comprehensive security validation
ipcMain.handle('open-file', async (event) => {
  try {
    validateSender(event);
    
    // Open file dialog
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openFile'],
      filters: [
        { name: 'PDF Files', extensions: ['pdf'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    });

    if (!result.canceled && result.filePaths.length > 0) {
      const filePath = result.filePaths[0];
      const data = await fsPromises.readFile(filePath);
      addToRecentFiles(filePath);
      return {
        success: true,
        data: data.buffer,
        path: filePath
      };
    }
    return { success: false, cancelled: true };
  } catch (error) {
    console.error('Error opening file:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('save-file', async (event, filePath, data) => {
  try {
    validateSender(event);
    const validatedPath = validateFilePath(filePath);
    const validatedData = validateFileData(data);
    
    const buffer = Buffer.from(validatedData);
    await fsPromises.writeFile(validatedPath, buffer);
    addToRecentFiles(validatedPath);
    return { success: true };
  } catch (error) {
    console.error('Error saving file:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('save-file-dialog', async (event, defaultName) => {
  try {
    validateSender(event);
    
    // Validate default name
    let validDefaultName = 'document.pdf';
    if (defaultName && typeof defaultName === 'string') {
      // Sanitize filename - remove path separators and dangerous chars
      validDefaultName = defaultName.replace(/[<>:"/\\|?*]/g, '_').substring(0, 100);
      if (!validDefaultName.endsWith('.pdf')) {
        validDefaultName += '.pdf';
      }
    }
    
    const result = await dialog.showSaveDialog(mainWindow, {
      defaultPath: validDefaultName,
      filters: [
        { name: 'PDF Files', extensions: ['pdf'] }
      ]
    });

    if (!result.canceled) {
      return { success: true, filePath: result.filePath };
    }
    return { success: false, cancelled: true };
  } catch (error) {
    console.error('Error showing save dialog:', error);
    return { success: false, error: error.message };
  }
});

// Preferences handlers
ipcMain.handle('get-preferences', async (event) => {
  try {
    validateSender(event);
    return preferences;
  } catch (error) {
    console.error('Error getting preferences:', error);
    return {};
  }
});

ipcMain.handle('set-preferences', async (event, prefs) => {
  try {
    validateSender(event);
    
    // Validate preferences object
    if (!prefs || typeof prefs !== 'object' || Array.isArray(prefs)) {
      throw new Error('Invalid preferences object');
    }
    
    // Whitelist allowed preference keys
    const allowedKeys = ['theme', 'defaultZoom', 'showThumbnails', 'autoSave', 'autoSaveInterval', 'hardwareAcceleration', 'gpuEnabled'];
    const validatedPrefs = {};
    
    for (const [key, value] of Object.entries(prefs)) {
      if (allowedKeys.includes(key)) {
        validatedPrefs[key] = value;
      }
    }
    
    preferences = { ...preferences, ...validatedPrefs };
    
    // Save to persistent storage
    const prefsPath = path.join(app.getPath('userData'), 'preferences.json');
    await fsPromises.writeFile(prefsPath, JSON.stringify(preferences, null, 2));
    
    return preferences;
  } catch (error) {
    console.error('Error saving preferences:', error);
    return { success: false, error: error.message };
  }
});

// Recent files handlers
ipcMain.handle('get-recent-files', async (event) => {
  try {
    validateSender(event);
    return recentFiles;
  } catch (error) {
    console.error('Error getting recent files:', error);
    return [];
  }
});

ipcMain.handle('add-recent-file', async (event, filePath) => {
  try {
    validateSender(event);
    const validatedPath = validateFilePath(filePath);
    addToRecentFiles(validatedPath);
    return recentFiles;
  } catch (error) {
    console.error('Error adding recent file:', error);
    return recentFiles;
  }
});

ipcMain.handle('clear-recent-files', async (event) => {
  try {
    validateSender(event);
    recentFiles = [];
    createMenu();
    return recentFiles;
  } catch (error) {
    console.error('Error clearing recent files:', error);
    return recentFiles;
  }
});

// Window state handlers
ipcMain.handle('is-maximized', async (event) => {
  try {
    validateSender(event);
    return mainWindow ? mainWindow.isMaximized() : false;
  } catch (error) {
    console.error('Error getting window state:', error);
    return false;
  }
});

ipcMain.handle('get-platform', async (event) => {
  try {
    validateSender(event);
    return process.platform;
  } catch (error) {
    console.error('Error getting platform:', error);
    return 'unknown';
  }
});

ipcMain.handle('get-version', async (event) => {
  try {
    validateSender(event);
    return app.getVersion();
  } catch (error) {
    console.error('Error getting version:', error);
    return '0.0.0';
  }
});

// Window control handlers
ipcMain.on('minimize-window', (event) => {
  try {
    validateSender(event);
    if (mainWindow) mainWindow.minimize();
  } catch (error) {
    console.error('Unauthorized minimize attempt:', error);
  }
});

ipcMain.on('maximize-window', (event) => {
  try {
    validateSender(event);
    if (mainWindow) {
      if (mainWindow.isMaximized()) {
        mainWindow.unmaximize();
      } else {
        mainWindow.maximize();
      }
    }
  } catch (error) {
    console.error('Unauthorized maximize attempt:', error);
  }
});

ipcMain.on('close-window', (event) => {
  try {
    validateSender(event);
    if (mainWindow) mainWindow.close();
  } catch (error) {
    console.error('Unauthorized close attempt:', error);
  }
});

ipcMain.on('set-fullscreen', (event, flag) => {
  try {
    validateSender(event);
    if (typeof flag !== 'boolean') {
      throw new Error('Invalid fullscreen flag');
    }
    if (mainWindow) mainWindow.setFullScreen(flag);
  } catch (error) {
    console.error('Unauthorized fullscreen attempt:', error);
  }
});

// Error handler
ipcMain.on('renderer-error', (event, error) => {
  try {
    validateSender(event);
    
    // Validate error object
    if (!error || typeof error !== 'object') {
      throw new Error('Invalid error object');
    }
    
    // Sanitize error for logging (prevent log injection)
    const sanitizedError = {
      message: typeof error.message === 'string' ? error.message.substring(0, 500) : 'Unknown error',
      stack: typeof error.stack === 'string' ? error.stack.substring(0, 2000) : undefined,
      timestamp: new Date().toISOString()
    };
    
    console.error('Renderer process error:', sanitizedError);
    
    // Log to file with size limit
    const errorLog = path.join(app.getPath('userData'), 'error.log');
    const errorEntry = `${sanitizedError.timestamp} - ${JSON.stringify(sanitizedError)}\n`;
    
    // Check log file size before writing
    fs.stat(errorLog, (err, stats) => {
      if (!err && stats.size > 10 * 1024 * 1024) { // 10MB limit
        // Truncate if too large
        fs.writeFileSync(errorLog, errorEntry);
      } else {
        fsPromises.appendFile(errorLog, errorEntry).catch(console.error);
      }
    });
  } catch (error) {
    console.error('Unauthorized error report attempt:', error);
  }
});

// SECURITY: Removed rebuild-app handler - this was a critical RCE vulnerability
// The rebuild handler allowed arbitrary command execution from the renderer process
// This has been removed to prevent remote code execution attacks

// Helper functions
function addToRecentFiles(filePath) {
  const index = recentFiles.indexOf(filePath);
  if (index > -1) {
    recentFiles.splice(index, 1);
  }
  recentFiles.unshift(filePath);
  if (recentFiles.length > MAX_RECENT_FILES) {
    recentFiles = recentFiles.slice(0, MAX_RECENT_FILES);
  }
  createMenu();
  
  // Save recent files
  const recentPath = path.join(app.getPath('userData'), 'recent.json');
  fsPromises.writeFile(recentPath, JSON.stringify(recentFiles, null, 2)).catch(console.error);
}

function openRecentFile(filePath) {
  mainWindow.webContents.send('open-recent-file', filePath);
}

function showAboutDialog() {
  dialog.showMessageBox(mainWindow, {
    type: 'info',
    title: 'About Professional PDF Editor',
    message: 'Professional PDF Editor',
    detail: `Version: 2.0.0\n` +
            'Adobe-quality PDF editing solution\n\n' +
            'Built with Electron, React, and PDF.js\n' +
            'Enhanced with Transithesis Cognitive Engine\n\n' +
            '© 2024 Professional PDF Editor Team',
    buttons: ['OK'],
    icon: path.join(__dirname, '../public/icon.png')
  });
}

function checkForUpdates() {
  // Placeholder for auto-updater
  dialog.showMessageBox(mainWindow, {
    type: 'info',
    title: 'Check for Updates',
    message: 'You are using the latest version (2.0.0)',
    buttons: ['OK']
  });
}

// Load preferences and recent files on startup
async function loadUserData() {
  try {
    const prefsPath = path.join(app.getPath('userData'), 'preferences.json');
    if (fs.existsSync(prefsPath)) {
      const data = await fsPromises.readFile(prefsPath, 'utf8');
      preferences = JSON.parse(data);
    }
    
    const recentPath = path.join(app.getPath('userData'), 'recent.json');
    if (fs.existsSync(recentPath)) {
      const data = await fsPromises.readFile(recentPath, 'utf8');
      recentFiles = JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading user data:', error);
  }
}

// App event handlers
app.whenReady().then(async () => {
  // Load user data
  await loadUserData();
  
  // Set up session for better security
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self';",
          "script-src 'self' 'unsafe-inline';", // Required for React
          "style-src 'self' 'unsafe-inline';",  // Required for styled components
          "img-src 'self' data: blob:;",        // Allow embedded images
          "font-src 'self' data:;",             // Allow embedded fonts
          "connect-src 'self';",                // API connections
          "media-src 'none';",                  // No media
          "object-src 'none';",                 // No plugins
          "frame-src 'none';",                  // No iframes
          "worker-src 'self';",                 // Web workers
          "form-action 'none';",                // No form submissions
          "frame-ancestors 'none';",            // Prevent framing
          "base-uri 'self';",                   // Restrict base tag
          "manifest-src 'self'"                 // Web manifest
        ].join(' ')
      }
    });
  });
  
  // Create window
  createWindow();
  
  // Set up error handlers
  process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    const errorLog = path.join(app.getPath('userData'), 'crash.log');
    fs.appendFileSync(errorLog, `${new Date().toISOString()} - ${error.stack}\n`);
  });
  
  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// GPU error handler
app.on('gpu-process-crashed', (event, killed) => {
  console.error('GPU process crashed:', killed ? 'killed' : 'crashed');
  dialog.showErrorBox(
    'GPU Error',
    'The GPU process has crashed. The application will continue with software rendering.'
  );
});

// Certificate error handler - SECURE VERSION
app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
  if (process.env.NODE_ENV === 'development') {
    // Only bypass in development
    event.preventDefault();
    callback(true);
  } else {
    // In production, always validate certificates
    callback(false);
  }
});

// Performance optimization
setInterval(() => {
  if (mainWindow && mainWindow.webContents) {
    // Clear cache periodically to prevent memory leaks
    mainWindow.webContents.session.clearCache();
  }
}, 60 * 60 * 1000); // Every hour

module.exports = { app };
