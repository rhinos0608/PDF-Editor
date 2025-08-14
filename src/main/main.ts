/**
 * Electron Main Process - Enhanced Version 2.0
 * Fixes GPU crashes and startup issues
 * Implements Adobe-quality standards with Transithesis framework
 */

import { app, BrowserWindow, ipcMain, dialog, shell, session } from 'electron';
import { createMenu, setMainWindow, setRecentFiles } from '../menu.js';
import * as path from 'path';
import * as fs from 'fs';
import { promises as fsPromises } from 'fs';

// Define types for our preferences
interface Preferences {
  theme: string;
  defaultZoom: number;
  showThumbnails: boolean;
  autoSave: boolean;
  autoSaveInterval: number;
  hardwareAcceleration: boolean;
  gpuEnabled: boolean;
}

// Define types for our file operations
interface OpenFileResult {
  success: boolean;
  data?: ArrayBuffer;
  path?: string;
  cancelled?: boolean;
  error?: string;
}

interface SaveFileResult {
  success: boolean;
  error?: string;
}

interface SaveFileDialogResult {
  success: boolean;
  filePath?: string;
  cancelled?: boolean;
  error?: string;
}

interface GetPreferencesResult {
  [key: string]: any;
}

interface SetPreferencesResult {
  success: boolean;
  error?: string;
}

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

let mainWindow: BrowserWindow | null = null;
let splashWindow: BrowserWindow | null = null;

// Application preferences with defaults
let preferences: Preferences = {
  theme: 'dark',
  defaultZoom: 100,
  showThumbnails: true,
  autoSave: true,
  autoSaveInterval: 300000,
  hardwareAcceleration: false,
  gpuEnabled: false
};

let recentFiles: string[] = [];
const MAX_RECENT_FILES = 10;

// Create splash screen
function createSplashWindow(): BrowserWindow {
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
function createWindow(): void {
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
      mainWindow!.show();
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
    if (!url.startsWith('file://') && !url.startsWith('http://localhost:8082')) {
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
async function waitForDevServer(url: string, maxAttempts: number = 10, delay: number = 1000): Promise<boolean> {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      console.log(`🔄 Attempting to connect to dev server (${i + 1}/${maxAttempts}): ${url}`);
      
      // Try to load the URL
      await mainWindow!.loadURL(url);
      console.log('✅ Successfully connected to dev server');
      return true;
      
    } catch (error: any) {
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
async function loadApplication(): Promise<void> {
  const isDev = process.env.NODE_ENV === 'development';
  
  if (isDev) {
    // Development mode with retry mechanism
    console.log('🔧 Loading application in development mode...');
    const devServerReady = await waitForDevServer('http://localhost:8082');
    
    if (devServerReady) {
      console.log('✅ Dev server loaded successfully');
      mainWindow!.webContents.openDevTools();
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
function loadProductionFallback(): void {
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
      mainWindow!.loadFile(indexPath).catch((err) => {
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
function createEmergencyUI(): void {
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
  
  mainWindow!.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(emergencyHtml)}`);
}

// Input validation helpers
function validateSender(event: Electron.IpcMainInvokeEvent): void {
  const webContents = event.sender;
  const win = BrowserWindow.fromWebContents(webContents);
  
  if (!win || win !== mainWindow) {
    throw new Error('Unauthorized sender');
  }
  
  // Validate sender frame for web content
  if (event.senderFrame) {
    const url = new URL(event.senderFrame.url);
    const allowedOrigins = ['file:', 'http://localhost:8082'];
    const isAllowed = allowedOrigins.some(origin => url.protocol === origin || url.origin === origin);
    if (!isAllowed) {
      throw new Error('Unauthorized origin');
    }
  }
}

function validateFilePath(filePath: string): string {
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

function validateFileData(data: ArrayBuffer): ArrayBuffer {
  if (!data) {
    throw new Error('No file data provided');
  }
  
  if (data.byteLength > 100 * 1024 * 1024) { // 100MB limit
    throw new Error('File too large (max 100MB)');
  }
  
  return data;
}

// IPC Handlers with comprehensive security validation
ipcMain.handle('open-file', async (event, options: { multiSelections?: boolean } = {}): Promise<OpenFileResult> => {
  try {
    validateSender(event);
    
    // Open file dialog with support for multiSelections
    const dialogOptions: Electron.OpenDialogOptions = {
      properties: options.multiSelections ? ['openFile', 'multiSelections'] : ['openFile'],
      filters: [
        { name: 'PDF Files', extensions: ['pdf'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    };
    
    const result = await dialog.showOpenDialog(mainWindow!, dialogOptions);

    if (!result.canceled && result.filePaths.length > 0) {
      // If multiSelections is enabled, return all selected files
      if (options.multiSelections && result.filePaths.length > 1) {
        const files = [];
        for (const filePath of result.filePaths) {
          const data = await fsPromises.readFile(filePath);
          // Convert SharedArrayBuffer to ArrayBuffer
          const arrayBuffer = new ArrayBuffer(data.buffer.byteLength);
          new Uint8Array(arrayBuffer).set(new Uint8Array(data.buffer));
          files.push({
            data: arrayBuffer,
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
        // Convert SharedArrayBuffer to ArrayBuffer
        const arrayBuffer = new ArrayBuffer(data.buffer.byteLength);
        new Uint8Array(arrayBuffer).set(new Uint8Array(data.buffer));
        return {
          success: true,
          data: arrayBuffer,
          path: filePath
        };
      }
    }
    return { success: false, cancelled: true };
  } catch (error: any) {
    console.error('Error opening file:', error);
    // Log structured error
    const errorLog = path.join(app.getPath('userData'), 'error.log');
    const errorEntry = `${new Date().toISOString()} - OPEN_FILE_ERROR - ${error.message}
`;
    fsPromises.appendFile(errorLog, errorEntry).catch(console.error);
    
    return { success: false, error: 'Failed to open file. Please try again.' };
  }
});

ipcMain.handle('save-file', async (event, filePath: string, data: ArrayBuffer): Promise<SaveFileResult> => {
  try {
    validateSender(event);
    const validatedPath = validateFilePath(filePath);
    const validatedData = validateFileData(data);
    
    const buffer = Buffer.from(validatedData);
    await fsPromises.writeFile(validatedPath, buffer);
    addToRecentFiles(validatedPath);
    return { success: true };
  } catch (error: any) {
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

ipcMain.handle('save-file-dialog', async (event, defaultName?: string): Promise<SaveFileDialogResult> => {
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
    
    const result = await dialog.showSaveDialog(mainWindow!, {
      defaultPath: validDefaultName,
      filters: [
        { name: 'PDF Files', extensions: ['pdf'] }
      ]
    });

    if (!result.canceled) {
      return { success: true, filePath: result.filePath };
    }
    return { success: false, cancelled: true };
  } catch (error: any) {
    console.error('Error showing save dialog:', error);
    return { success: false, error: error.message };
  }
});

// Preferences handlers
ipcMain.handle('get-preferences', async (event): Promise<GetPreferencesResult> => {
  try {
    validateSender(event);
    return preferences;
  } catch (error: any) {
    console.error('Error getting preferences:', error);
    return {};
  }
});

ipcMain.handle('set-preferences', async (event, prefs: Partial<Preferences>): Promise<Preferences | SetPreferencesResult> => {
  try {
    validateSender(event);
    
    // Validate preferences object
    if (!prefs || typeof prefs !== 'object' || Array.isArray(prefs)) {
      throw new Error('Invalid preferences object');
    }
    
    // Whitelist allowed preference keys
    const allowedKeys = ['theme', 'defaultZoom', 'showThumbnails', 'autoSave', 'autoSaveInterval', 'hardwareAcceleration', 'gpuEnabled'];
    const validatedPrefs: Partial<Preferences> = {};
    
    for (const [key, value] of Object.entries(prefs)) {
      if (allowedKeys.includes(key)) {
        (validatedPrefs as any)[key] = value;
      }
    }
    
    preferences = { ...preferences, ...validatedPrefs };
    
    // Save to persistent storage
    const prefsPath = path.join(app.getPath('userData'), 'preferences.json');
    await fsPromises.writeFile(prefsPath, JSON.stringify(preferences, null, 2));
    
    return preferences;
  } catch (error: any) {
    console.error('Error saving preferences:', error);
    return { success: false, error: error.message };
  }
});

// Recent files handlers
ipcMain.handle('get-recent-files', async (event): Promise<string[]> => {
  try {
    validateSender(event);
    return recentFiles;
  } catch (error: any) {
    console.error('Error getting recent files:', error);
    return [];
  }
});

ipcMain.handle('add-recent-file', async (event, filePath: string): Promise<string[]> => {
  try {
    validateSender(event);
    const validatedPath = validateFilePath(filePath);
    addToRecentFiles(validatedPath);
    return recentFiles;
  } catch (error: any) {
    console.error('Error adding recent file:', error);
    return recentFiles;
  }
});

ipcMain.handle('clear-recent-files', async (event): Promise<string[]> => {
  try {
    validateSender(event);
    recentFiles = [];
    setRecentFiles(recentFiles); // Update recent files in menu module
    createMenu(); // Rebuild menu
    return recentFiles;
  } catch (error: any) {
    console.error('Error clearing recent files:', error);
    return recentFiles;
  }
});

// Window state handlers
ipcMain.handle('is-maximized', async (event): Promise<boolean> => {
  try {
    validateSender(event);
    return mainWindow ? mainWindow.isMaximized() : false;
  } catch (error: any) {
    console.error('Error getting window state:', error);
    return false;
  }
});

ipcMain.handle('get-platform', async (event): Promise<NodeJS.Platform> => {
  try {
    validateSender(event);
    return process.platform;
  } catch (error: any) {
    console.error('Error getting platform:', error);
    return 'unknown' as NodeJS.Platform;
  }
});

ipcMain.handle('get-version', async (event): Promise<string> => {
  try {
    validateSender(event);
    return app.getVersion();
  } catch (error: any) {
    console.error('Error getting version:', error);
    return '0.0.0';
  }
});

// Window control handlers
ipcMain.on('minimize-window', (event) => {
  try {
    validateSender(event);
    if (mainWindow) mainWindow.minimize();
  } catch (error: any) {
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
  } catch (error: any) {
    console.error('Unauthorized maximize attempt:', error);
  }
});

ipcMain.on('close-window', (event) => {
  try {
    validateSender(event);
    if (mainWindow) mainWindow.close();
  } catch (error: any) {
    console.error('Unauthorized close attempt:', error);
  }
});

ipcMain.on('set-fullscreen', (event, flag: boolean) => {
  try {
    validateSender(event);
    if (typeof flag !== 'boolean') {
      throw new Error('Invalid fullscreen flag');
    }
    if (mainWindow) mainWindow.setFullScreen(flag);
  } catch (error: any) {
    console.error('Unauthorized fullscreen attempt:', error);
  }
});

// Error handler
ipcMain.on('renderer-error', (event, error: any) => {
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
  } catch (error: any) {
    console.error('Unauthorized error report attempt:', error);
  }
});

// Error logging handler
ipcMain.on('log-error', (event, errorData: any) => {
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
  } catch (error: any) {
    console.error('Unauthorized error log attempt:', error);
  }
});

// Helper functions
function addToRecentFiles(filePath: string): void {
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
async function loadUserData(): Promise<void> {
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
  } catch (error: any) {
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
      "object-src 'none'",                                         // No plugins
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

export { app };