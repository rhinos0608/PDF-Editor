/**
 * Electron Main Process - Enhanced Version 2.0
 * Fixes GPU crashes and startup issues
 * Implements Adobe-quality standards with Transithesis framework
 */

const { app, BrowserWindow, ipcMain, dialog, shell, session } = require('electron');
const { createMenu, setMainWindow, setRecentFiles } = require('./menu');
const path = require('path');
const fs = require('fs');
const fsPromises = require('fs').promises;

// Fix GPU crashes - SECURE VERSION
// Allow Electron to manage GPU usage by default. It will fall back to software rendering if issues occur.
// Removed aggressive GPU disabling to improve performance and stability.

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
  setMainWindow(mainWindow);
  setRecentFiles(recentFiles);
  createMenu();
}

// Enhanced development server loading with retry mechanism
async function waitForDevServer(url, maxAttempts = 10, delay = 1000) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      console.log(`🔄 Attempting to connect to dev server (${i + 1}/${maxAttempts}): ${url}`);
      
      // Try to load the URL
      await mainWindow.loadURL(url);
      console.log('✅ Successfully connected to dev server');
      return true;
      
    } catch (error) {
      console.warn(`⚠️ Dev server not ready (attempt ${i + 1}): ${error.message}`);
      
      if (i < maxAttempts - 1) {
        console.log(`🕒 Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  return false;
}

// Load application with multiple fallback strategies
async function loadApplication() {
  const isDev = process.env.NODE_ENV === 'development';
  
  if (isDev) {
    // Development mode with retry mechanism
    console.log('🔧 Loading application in development mode...');
    const devServerReady = await waitForDevServer('http://localhost:8080');
    
    if (devServerReady) {
      console.log('✅ Dev server loaded successfully');
      mainWindow.webContents.openDevTools();
    } else {
      console.error('❌ Dev server failed to start, falling back to production build');
      loadProductionFallback();
    }
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
        <button onclick="window.electronAPI && window.electronAPI.openFile && window.electronAPI.openFile()">Open PDF</button>
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
ipcMain.handle('open-file', async (event, options = {}) => {
  try {
    validateSender(event);
    
    // Open file dialog with support for multiSelections
    const dialogOptions = {
      properties: options.multiSelections ? ['openFile', 'multiSelections'] : ['openFile'],
      filters: [
        { name: 'PDF Files', extensions: ['pdf'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    };
    
    const result = await dialog.showOpenDialog(mainWindow, dialogOptions);

    if (!result.canceled && result.filePaths.length > 0) {
      // If multiSelections is enabled, return all selected files
      if (options.multiSelections && result.filePaths.length > 1) {
        const files = [];
        for (const filePath of result.filePaths) {
          const data = await fsPromises.readFile(filePath);
          files.push({
            data: data.buffer,
            path: filePath
          });
        }
        // Add first file to recent files
        addToRecentFiles(result.filePaths[0]);
        return {
          success: true,
          files: files
        };
      } else {
        // Single file selection (default behavior)
        const filePath = result.filePaths[0];
        const data = await fsPromises.readFile(filePath);
        addToRecentFiles(filePath);
        return {
          success: true,
          data: data.buffer,
          path: filePath
        };
      }
    }
    return { success: false, cancelled: true };
  } catch (error) {
    console.error('Error opening file:', error);
    // Log structured error
    const errorLog = path.join(app.getPath('userData'), 'error.log');
    const errorEntry = `${new Date().toISOString()} - OPEN_FILE_ERROR - ${error.message}\n`;
    fsPromises.appendFile(errorLog, errorEntry).catch(console.error);
    
    return { success: false, error: 'Failed to open file. Please try again.' };
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
    // Log structured error
    const errorLog = path.join(app.getPath('userData'), 'error.log');
    const errorEntry = `${new Date().toISOString()} - SAVE_FILE_ERROR - ${error.message}\n`;
    fsPromises.appendFile(errorLog, errorEntry).catch(console.error);
    
    // Return user-friendly error message
    let userMessage = 'Failed to save file. Please try again.';
    if (error.message.includes('EACCES') || error.message.includes('permission')) {
      userMessage = 'Permission denied. Please check file permissions and try again.';
    } else if (error.message.includes('ENOSPC')) {
      userMessage = 'Not enough disk space. Please free up space and try again.';
    }
    
    return { success: false, error: userMessage };
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
    setRecentFiles(recentFiles); // Update recent files in menu module
    createMenu(); // Rebuild menu
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
      code: typeof error.code === 'string' ? error.code.substring(0, 100) : undefined,
      stack: typeof error.stack === 'string' ? error.stack.substring(0, 2000) : undefined,
      timestamp: new Date().toISOString(),
      metadata: error.metadata
    };
    
    console.error('Renderer process error:', sanitizedError);
    
    // Log to file with structured format
    const errorLog = path.join(app.getPath('userData'), 'error.log');
    const errorEntry = `${sanitizedError.timestamp} - RENDERER_ERROR - ${sanitizedError.code || 'UNKNOWN_ERROR'} - ${sanitizedError.message}\n`;
    
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

// Error logging handler
ipcMain.on('log-error', (event, errorData) => {
  try {
    validateSender(event);
    
    // Validate error data
    if (!errorData || typeof errorData !== 'object') {
      throw new Error('Invalid error data');
    }
    
    // Sanitize error data for logging (prevent log injection)
    const sanitizedError = {
      timestamp: typeof errorData.timestamp === 'string' ? errorData.timestamp : new Date().toISOString(),
      level: typeof errorData.level === 'string' ? errorData.level.substring(0, 20) : 'error',
      message: typeof errorData.message === 'string' ? errorData.message.substring(0, 500) : 'Unknown error',
      stack: typeof errorData.stack === 'string' ? errorData.stack.substring(0, 2000) : undefined,
      name: typeof errorData.name === 'string' ? errorData.name.substring(0, 100) : 'UnknownError',
      context: typeof errorData.context === 'object' ? JSON.stringify(errorData.context).substring(0, 1000) : undefined
    };
    
    console.error(`[${sanitizedError.level.toUpperCase()}] ${sanitizedError.name}: ${sanitizedError.message}`, sanitizedError.stack);
    
    // Log to file with structured format
    const errorLog = path.join(app.getPath('userData'), 'error.log');
    const errorEntry = `${sanitizedError.timestamp} - ${sanitizedError.level.toUpperCase()} - ${sanitizedError.name} - ${sanitizedError.message}\n`;
    
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
    console.error('Unauthorized error log attempt:', error);
  }
});

// SECURITY: Removed rebuild-app handler - this was a critical RCE vulnerability
// The rebuild handler allowed arbitrary command execution from the renderer process
// This has been removed to prevent remote code execution attacks

// ===== ENHANCED IPC HANDLERS FOR PREMIUM FEATURES =====

// OCR Operations
ipcMain.handle('perform-ocr', async (event, pdfData, pageNumber, language = 'eng') => {
  try {
    validateSender(event);
    
    if (!pdfData || !pageNumber) {
      throw new Error('Invalid OCR parameters');
    }
    
    // Validate page number
    if (typeof pageNumber !== 'number' || pageNumber < 1) {
      throw new Error('Invalid page number for OCR');
    }
    
    // Validate language code
    const validLanguages = ['eng', 'spa', 'fra', 'deu', 'ita', 'por', 'rus', 'chi_sim', 'chi_tra', 'jpn', 'kor', 'ara'];
    if (!validLanguages.includes(language)) {
      language = 'eng'; // Default to English
    }
    
    // Return mock OCR result for now - will be replaced with actual Tesseract integration
    const mockResult = {
      text: `OCR extracted text from page ${pageNumber}`,
      confidence: 0.95,
      language: language,
      pageNumber: pageNumber,
      blocks: [],
      processingTime: 2500
    };
    
    return { success: true, result: mockResult };
  } catch (error) {
    console.error('OCR operation failed:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('batch-ocr', async (event, pdfData, pageNumbers, language = 'eng') => {
  try {
    validateSender(event);
    
    if (!pdfData || !Array.isArray(pageNumbers)) {
      throw new Error('Invalid batch OCR parameters');
    }
    
    const results = [];
    for (const pageNum of pageNumbers) {
      // Simulate OCR processing with progress
      const result = {
        text: `OCR text from page ${pageNum}`,
        confidence: 0.92,
        language: language,
        pageNumber: pageNum,
        blocks: []
      };
      results.push(result);
      
      // Send progress update
      mainWindow?.webContents.send('ocr-progress', {
        completed: results.length,
        total: pageNumbers.length,
        currentPage: pageNum
      });
    }
    
    return { success: true, results };
  } catch (error) {
    console.error('Batch OCR failed:', error);
    return { success: false, error: error.message };
  }
});

// Digital Signature Operations
ipcMain.handle('create-digital-signature', async (event, pdfData, signatureData) => {
  try {
    validateSender(event);
    
    if (!pdfData || !signatureData) {
      throw new Error('Invalid signature parameters');
    }
    
    // Validate signature data
    if (!signatureData.certificate || !signatureData.position) {
      throw new Error('Missing required signature data');
    }
    
    // Mock signature creation - will be replaced with actual implementation
    const signedPdf = {
      data: pdfData, // In real implementation, this would be the signed PDF
      signature: {
        id: `sig_${Date.now()}`,
        timestamp: new Date().toISOString(),
        certificate: signatureData.certificate,
        position: signatureData.position,
        valid: true
      }
    };
    
    return { success: true, signedPdf };
  } catch (error) {
    console.error('Digital signature creation failed:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('validate-signature', async (event, pdfData, signatureId) => {
  try {
    validateSender(event);
    
    if (!pdfData || !signatureId) {
      throw new Error('Invalid signature validation parameters');
    }
    
    // Mock signature validation
    const validationResult = {
      signatureId,
      valid: true,
      certificate: {
        issuer: 'Professional PDF Editor CA',
        subject: 'User Certificate',
        validFrom: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
        validTo: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        fingerprint: 'SHA256:1234567890abcdef'
      },
      timestamp: new Date().toISOString(),
      documentIntegrity: true
    };
    
    return { success: true, validation: validationResult };
  } catch (error) {
    console.error('Signature validation failed:', error);
    return { success: false, error: error.message };
  }
});

// Batch Processing Operations
ipcMain.handle('batch-process', async (event, operations) => {
  try {
    validateSender(event);
    
    if (!Array.isArray(operations)) {
      throw new Error('Invalid batch operations');
    }
    
    const results = [];
    
    for (let i = 0; i < operations.length; i++) {
      const operation = operations[i];
      
      // Send progress update
      mainWindow?.webContents.send('batch-progress', {
        completed: i,
        total: operations.length,
        currentOperation: operation.type
      });
      
      try {
        let result;
        switch (operation.type) {
          case 'merge':
            result = await processMergeOperation(operation);
            break;
          case 'split':
            result = await processSplitOperation(operation);
            break;
          case 'compress':
            result = await processCompressOperation(operation);
            break;
          case 'watermark':
            result = await processWatermarkOperation(operation);
            break;
          case 'ocr':
            result = await processOCROperation(operation);
            break;
          default:
            throw new Error(`Unsupported operation type: ${operation.type}`);
        }
        
        results.push({ success: true, operation: operation.type, result });
      } catch (opError) {
        results.push({ success: false, operation: operation.type, error: opError.message });
      }
    }
    
    return { success: true, results };
  } catch (error) {
    console.error('Batch processing failed:', error);
    return { success: false, error: error.message };
  }
});

// Document Analysis Operations
ipcMain.handle('analyze-document', async (event, pdfData, analysisType) => {
  try {
    validateSender(event);
    
    if (!pdfData || !analysisType) {
      throw new Error('Invalid document analysis parameters');
    }
    
    const validAnalysisTypes = ['metadata', 'content', 'structure', 'accessibility', 'security'];
    if (!validAnalysisTypes.includes(analysisType)) {
      throw new Error('Invalid analysis type');
    }
    
    // Mock analysis results
    const analysisResult = {
      type: analysisType,
      timestamp: new Date().toISOString(),
      results: {
        metadata: {
          title: 'Sample Document',
          author: 'Professional PDF Editor',
          pages: 10,
          size: '2.5 MB',
          created: new Date().toISOString()
        },
        content: {
          textBlocks: 45,
          images: 8,
          tables: 3,
          forms: 2,
          annotations: 5
        },
        structure: {
          bookmarks: true,
          outline: true,
          hyperlinks: 12,
          crossReferences: 8
        },
        accessibility: {
          score: 85,
          issues: [
            'Missing alt text for 2 images',
            'Insufficient color contrast in 1 section'
          ],
          compliant: false
        },
        security: {
          encrypted: false,
          signed: false,
          permissions: {
            print: true,
            copy: true,
            modify: true,
            annotate: true
          }
        }
      }
    };
    
    return { success: true, analysis: analysisResult };
  } catch (error) {
    console.error('Document analysis failed:', error);
    return { success: false, error: error.message };
  }
});

// Advanced File Operations
ipcMain.handle('merge-pdfs', async (event, pdfFiles, options = {}) => {
  try {
    validateSender(event);
    
    if (!Array.isArray(pdfFiles) || pdfFiles.length < 2) {
      throw new Error('At least 2 PDF files required for merging');
    }
    
    // Validate each file
    for (const file of pdfFiles) {
      if (!file.data || !file.name) {
        throw new Error('Invalid PDF file data');
      }
    }
    
    // Mock merge operation
    const mergedData = Buffer.concat(pdfFiles.map(f => Buffer.from(f.data)));
    
    return {
      success: true,
      data: mergedData.buffer,
      metadata: {
        totalPages: pdfFiles.reduce((sum, f) => sum + (f.pages || 1), 0),
        size: mergedData.length,
        sourceFiles: pdfFiles.length
      }
    };
  } catch (error) {
    console.error('PDF merge failed:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('split-pdf', async (event, pdfData, splitOptions) => {
  try {
    validateSender(event);
    
    if (!pdfData || !splitOptions) {
      throw new Error('Invalid split parameters');
    }
    
    const { splitType, splitValue } = splitOptions;
    
    if (!['page', 'size', 'bookmark'].includes(splitType)) {
      throw new Error('Invalid split type');
    }
    
    // Mock split operation
    const splitResults = [];
    
    if (splitType === 'page') {
      const pageNum = parseInt(splitValue);
      if (pageNum < 1) throw new Error('Invalid page number');
      
      splitResults.push(
        { name: 'part1.pdf', data: pdfData.slice(0, pdfData.length / 2), pages: pageNum - 1 },
        { name: 'part2.pdf', data: pdfData.slice(pdfData.length / 2), pages: 10 - pageNum + 1 }
      );
    }
    
    return { success: true, results: splitResults };
  } catch (error) {
    console.error('PDF split failed:', error);
    return { success: false, error: error.message };
  }
});

// Form Operations
ipcMain.handle('extract-form-data', async (event, pdfData) => {
  try {
    validateSender(event);
    
    if (!pdfData) {
      throw new Error('Invalid PDF data for form extraction');
    }
    
    // Mock form data extraction
    const formData = {
      fields: [
        { name: 'firstName', type: 'text', value: '', required: true },
        { name: 'lastName', type: 'text', value: '', required: true },
        { name: 'email', type: 'email', value: '', required: true },
        { name: 'subscribe', type: 'checkbox', value: false, required: false }
      ],
      metadata: {
        formType: 'interactive',
        version: '1.0',
        created: new Date().toISOString()
      }
    };
    
    return { success: true, formData };
  } catch (error) {
    console.error('Form data extraction failed:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('fill-form-data', async (event, pdfData, formData) => {
  try {
    validateSender(event);
    
    if (!pdfData || !formData) {
      throw new Error('Invalid form filling parameters');
    }
    
    // Validate form data
    if (!formData.fields || !Array.isArray(formData.fields)) {
      throw new Error('Invalid form field data');
    }
    
    // Mock form filling
    const filledPdf = {
      data: pdfData, // In real implementation, this would be the filled PDF
      metadata: {
        filled: true,
        timestamp: new Date().toISOString(),
        fieldsCount: formData.fields.length
      }
    };
    
    return { success: true, filledPdf };
  } catch (error) {
    console.error('Form filling failed:', error);
    return { success: false, error: error.message };
  }
});

// Security Operations
ipcMain.handle('encrypt-pdf', async (event, pdfData, encryptionOptions) => {
  try {
    validateSender(event);
    
    if (!pdfData || !encryptionOptions) {
      throw new Error('Invalid encryption parameters');
    }
    
    const { password, permissions } = encryptionOptions;
    
    if (!password || password.length < 6) {
      throw new Error('Password must be at least 6 characters');
    }
    
    // Mock encryption
    const encryptedPdf = {
      data: pdfData, // In real implementation, this would be encrypted
      metadata: {
        encrypted: true,
        algorithm: 'AES-256',
        permissions: permissions || {
          print: true,
          copy: false,
          modify: false,
          annotate: true
        }
      }
    };
    
    return { success: true, encryptedPdf };
  } catch (error) {
    console.error('PDF encryption failed:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('decrypt-pdf', async (event, pdfData, password) => {
  try {
    validateSender(event);
    
    if (!pdfData || !password) {
      throw new Error('Invalid decryption parameters');
    }
    
    // Mock decryption validation
    if (password !== 'test123') { // Mock password check
      throw new Error('Invalid password');
    }
    
    const decryptedPdf = {
      data: pdfData,
      metadata: {
        decrypted: true,
        timestamp: new Date().toISOString()
      }
    };
    
    return { success: true, decryptedPdf };
  } catch (error) {
    console.error('PDF decryption failed:', error);
    return { success: false, error: error.message };
  }
});

// ===== WORKFLOW AND AUTOMATION HANDLERS =====

// Workflow Management
ipcMain.handle('create-workflow', async (event, workflowData) => {
  try {
    validateSender(event);
    
    if (!workflowData || !workflowData.name || !workflowData.steps) {
      throw new Error('Invalid workflow data');
    }
    
    const workflow = {
      id: `workflow_${Date.now()}`,
      name: workflowData.name,
      description: workflowData.description || '',
      steps: workflowData.steps,
      created: new Date().toISOString(),
      status: 'active'
    };
    
    // Save workflow to user data
    const workflowsPath = path.join(app.getPath('userData'), 'workflows.json');
    let workflows = [];
    
    try {
      const data = await fsPromises.readFile(workflowsPath, 'utf8');
      workflows = JSON.parse(data);
    } catch (error) {
      // File doesn't exist yet, start with empty array
    }
    
    workflows.push(workflow);
    await fsPromises.writeFile(workflowsPath, JSON.stringify(workflows, null, 2));
    
    return { success: true, workflow };
  } catch (error) {
    console.error('Workflow creation failed:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('execute-workflow', async (event, workflowId, inputFiles) => {
  try {
    validateSender(event);
    
    if (!workflowId || !inputFiles) {
      throw new Error('Invalid workflow execution parameters');
    }
    
    // Load workflow
    const workflowsPath = path.join(app.getPath('userData'), 'workflows.json');
    const data = await fsPromises.readFile(workflowsPath, 'utf8');
    const workflows = JSON.parse(data);
    const workflow = workflows.find(w => w.id === workflowId);
    
    if (!workflow) {
      throw new Error('Workflow not found');
    }
    
    // Execute workflow steps
    const results = [];
    for (let i = 0; i < workflow.steps.length; i++) {
      const step = workflow.steps[i];
      
      // Send progress update
      mainWindow?.webContents.send('workflow-progress', {
        workflowId,
        step: i + 1,
        total: workflow.steps.length,
        currentStep: step.type
      });
      
      // Mock step execution
      const stepResult = {
        step: i + 1,
        type: step.type,
        status: 'completed',
        output: `Step ${i + 1} completed successfully`
      };
      
      results.push(stepResult);
      
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    return { success: true, results };
  } catch (error) {
    console.error('Workflow execution failed:', error);
    return { success: false, error: error.message };
  }
});

// Document Comparison
ipcMain.handle('compare-documents', async (event, doc1Data, doc2Data, comparisonOptions) => {
  try {
    validateSender(event);
    
    if (!doc1Data || !doc2Data) {
      throw new Error('Two documents required for comparison');
    }
    
    const options = comparisonOptions || {
      compareText: true,
      compareImages: true,
      compareMetadata: true,
      sensitivity: 'medium'
    };
    
    // Mock comparison results
    const comparisonResult = {
      id: `comparison_${Date.now()}`,
      timestamp: new Date().toISOString(),
      documents: {
        doc1: { name: 'Document 1', pages: 10, size: '2.1 MB' },
        doc2: { name: 'Document 2', pages: 12, size: '2.3 MB' }
      },
      differences: {
        textChanges: [
          { page: 1, type: 'addition', text: 'New paragraph added', position: { x: 100, y: 200 } },
          { page: 2, type: 'deletion', text: 'Old text removed', position: { x: 150, y: 300 } },
          { page: 3, type: 'modification', text: 'Text modified', position: { x: 200, y: 400 } }
        ],
        imageChanges: [
          { page: 5, type: 'addition', description: 'New image added' },
          { page: 7, type: 'modification', description: 'Image replaced' }
        ],
        metadataChanges: {
          title: { old: 'Original Title', new: 'Updated Title' },
          author: { old: 'John Doe', new: 'Jane Smith' }
        }
      },
      summary: {
        totalChanges: 6,
        pagesAffected: 5,
        similarityScore: 0.87
      }
    };
    
    return { success: true, comparison: comparisonResult };
  } catch (error) {
    console.error('Document comparison failed:', error);
    return { success: false, error: error.message };
  }
});

// Analytics and Reporting
ipcMain.handle('generate-analytics-report', async (event, reportType, timeRange) => {
  try {
    validateSender(event);
    
    const validReportTypes = ['usage', 'performance', 'security', 'compliance'];
    if (!validReportTypes.includes(reportType)) {
      throw new Error('Invalid report type');
    }
    
    // Mock analytics data
    const analyticsReport = {
      type: reportType,
      timeRange: timeRange || 'last_30_days',
      generated: new Date().toISOString(),
      data: {
        usage: {
          documentsProcessed: 1247,
          totalPages: 15892,
          averageProcessingTime: '2.3s',
          mostUsedFeatures: ['PDF Merge', 'OCR', 'Digital Signature', 'Annotation'],
          userActivity: {
            dailyActive: 45,
            weeklyActive: 156,
            monthlyActive: 423
          }
        },
        performance: {
          averageLoadTime: '1.8s',
          memoryUsage: '245 MB',
          cpuUsage: '12%',
          errorRate: '0.3%',
          uptime: '99.7%'
        },
        security: {
          documentsEncrypted: 234,
          digitalSignatures: 89,
          securityScans: 156,
          vulnerabilities: 0,
          complianceScore: 98
        },
        compliance: {
          accessibilityScore: 87,
          gdprCompliance: true,
          retentionPolicies: 'active',
          auditTrail: 'complete'
        }
      }
    };
    
    return { success: true, report: analyticsReport };
  } catch (error) {
    console.error('Analytics report generation failed:', error);
    return { success: false, error: error.message };
  }
});

// Accessibility Tools
ipcMain.handle('check-accessibility', async (event, pdfData, standards) => {
  try {
    validateSender(event);
    
    if (!pdfData) {
      throw new Error('PDF data required for accessibility check');
    }
    
    const checkStandards = standards || ['WCAG2.1', 'Section508', 'PDF/UA'];
    
    // Mock accessibility check
    const accessibilityReport = {
      id: `accessibility_${Date.now()}`,
      timestamp: new Date().toISOString(),
      standards: checkStandards,
      overallScore: 78,
      issues: [
        {
          level: 'error',
          rule: 'Images must have alt text',
          description: '3 images missing alternative text',
          pages: [2, 5, 8],
          impact: 'high'
        },
        {
          level: 'warning',
          rule: 'Color contrast ratio',
          description: 'Text contrast ratio below 4.5:1',
          pages: [3],
          impact: 'medium'
        },
        {
          level: 'info',
          rule: 'Document structure',
          description: 'Consider adding more heading levels',
          pages: [1, 4, 6],
          impact: 'low'
        }
      ],
      recommendations: [
        'Add alternative text to all images',
        'Improve color contrast for better readability',
        'Use proper heading hierarchy',
        'Add document title and language'
      ],
      compliance: {
        'WCAG2.1': { level: 'AA', score: 75 },
        'Section508': { compliant: false, score: 78 },
        'PDF/UA': { compliant: true, score: 85 }
      }
    };
    
    return { success: true, report: accessibilityReport };
  } catch (error) {
    console.error('Accessibility check failed:', error);
    return { success: false, error: error.message };
  }
});

// Helper functions for batch operations
async function processMergeOperation(operation) {
  // Mock merge processing
  return {
    type: 'merge',
    outputFile: 'merged_document.pdf',
    pages: operation.files?.reduce((sum, f) => sum + (f.pages || 1), 0) || 0,
    size: '5.2 MB'
  };
}

async function processSplitOperation(operation) {
  // Mock split processing
  return {
    type: 'split',
    outputFiles: [`${operation.name}_part1.pdf`, `${operation.name}_part2.pdf`],
    totalParts: 2
  };
}

async function processCompressOperation(operation) {
  // Mock compression processing
  return {
    type: 'compress',
    originalSize: '10.5 MB',
    compressedSize: '3.2 MB',
    compressionRatio: '69%'
  };
}

async function processWatermarkOperation(operation) {
  // Mock watermark processing
  return {
    type: 'watermark',
    text: operation.watermarkText || 'CONFIDENTIAL',
    pages: operation.pages || 'all'
  };
}

async function processOCROperation(operation) {
  // Mock OCR processing
  return {
    type: 'ocr',
    language: operation.language || 'eng',
    extractedText: 'Sample extracted text from OCR processing',
    confidence: 0.94
  };
}

// Helper functions
function addToRecentFiles(filePath) {
  // Remove if already in list
  recentFiles = recentFiles.filter(file => file !== filePath);
  
  // Add to beginning of list
  recentFiles.unshift(filePath);
  
  // Limit to MAX_RECENT_FILES
  if (recentFiles.length > MAX_RECENT_FILES) {
    recentFiles = recentFiles.slice(0, MAX_RECENT_FILES);
  }
  
  // Update menu
  setRecentFiles(recentFiles);
  createMenu();
  
  // Save to persistent storage
  const recentPath = path.join(app.getPath('userData'), 'recent.json');
  fsPromises.writeFile(recentPath, JSON.stringify(recentFiles, null, 2)).catch(console.error);
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
  
  // Enhanced CSP configuration with environment-specific hardening
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    // Development vs Production CSP policies
    const developmentCSP = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' ws: wss:",  // HMR support
      "style-src 'self' 'unsafe-inline'",                          // Styled components
      "img-src 'self' data: blob:",                               // Images + embedded
      "font-src 'self' data:",                                    // Fonts
      "connect-src 'self' ws: wss: http: https:",                 // WebSocket for HMR
      "media-src 'none'",                                         // No media
      "object-src 'none'",                                        // No plugins
      "frame-src 'none'",                                         // No iframes
      "worker-src 'self' blob: data:",                           // Workers + OCR
      "form-action 'none'",                                       // No forms
      "frame-ancestors 'none'",                                   // Anti-framing
      "base-uri 'self'",                                          // Restrict base
      "manifest-src 'self'",                                      // Manifest
      "upgrade-insecure-requests"                                  // Force HTTPS
    ];
    
    const productionCSP = [
      "default-src 'self'",
      "script-src 'self'",                                       // Removed 'unsafe-eval' for security
      "style-src 'self' 'unsafe-inline'",                        // Minimal inline styles
      "img-src 'self' data: blob:",                             // Images + embedded
      "font-src 'self' data:",                                   // Fonts only
      "connect-src 'self'",                                       // No external connections
      "media-src 'none'",                                        // No media
      "object-src 'none'",                                       // No plugins
      "frame-src 'none'",                                        // No iframes
      "worker-src 'self' blob: data:",                          // Workers + OCR
      "form-action 'none'",                                      // No forms
      "frame-ancestors 'none'",                                  // Anti-framing
      "base-uri 'self'",                                         // Restrict base
      "manifest-src 'self'",                                     // Manifest
      "require-trusted-types-for 'script'",                     // Trusted Types
      "upgrade-insecure-requests"                                // Force HTTPS
    ];
    
    const csp = isDevelopment ? developmentCSP : productionCSP;
    
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [csp.join('; ')],
        'X-Content-Type-Options': ['nosniff'],                    // MIME type sniffing protection
        'X-Frame-Options': ['DENY'],                              // Additional frame protection
        'X-XSS-Protection': ['1; mode=block'],                   // XSS protection
        'Referrer-Policy': ['strict-origin-when-cross-origin'],  // Referrer policy
        'Permissions-Policy': [                                   // Feature policy
          'geolocation=(), microphone=(), camera=(), fullscreen=(self), payment=()'
        ]
      }
    });
    
    console.log(`🔒 CSP configured for ${isDevelopment ? 'development' : 'production'} mode`);
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


module.exports = { app };
