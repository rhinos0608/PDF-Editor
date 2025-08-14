import { app, BrowserWindow, Menu, dialog, ipcMain, shell, session, net, autoUpdater } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import * as fsExtra from 'fs-extra';
import * as os from 'os';
import Store from 'electron-store';
import * as winston from 'winston';
import 'winston-daily-rotate-file';
import { isValidPath, isValidArrayBuffer, isValidMenuAction, isValidPreferences, sanitizePath } from '../utils/validation';

// Type definitions for window state
interface WindowState {
  x: number;
  y: number;
  width: number;
  height: number;
  isMaximized: boolean;
}

// Type definitions for store schema
interface StoreSchema {
  preferences: {
    theme: string;
    autoSave: boolean;
    autoSaveInterval: number;
    defaultZoom: number;
    showThumbnails: boolean;
    highlightColor: string;
    defaultFont: string;
    viewMode: string;
    recentFilesLimit: number;
    enableShortcuts: boolean;
    enableAnimations: boolean;
    compressionQuality: 'low' | 'medium' | 'high';
  };
  recentFiles: string[];
  windowState: WindowState;
}

// Initialize electron store with schema
declare module 'electron-store' {
  interface StoreOptions<T> {
    defaults?: Partial<T>;
  }
}

const store = new Store<StoreSchema>({
  defaults: {
    preferences: {
      theme: 'dark',
      autoSave: true,
      autoSaveInterval: 30000,
      defaultZoom: 100,
      showThumbnails: true,
      highlightColor: '#FFD700',
      defaultFont: 'Arial',
      viewMode: 'single',
      recentFilesLimit: 10,
      enableShortcuts: true,
      enableAnimations: true,
      compressionQuality: 'medium' as const
    },
    recentFiles: [],
    windowState: {
      x: 0,
      y: 0,
      width: 1200,
      height: 800,
      isMaximized: false
    }
  }
});

// Initialize electron store for preferences
// interface StoreSchema {
//   preferences?: any;
//   recentFiles?: string[];
//   windowState?: WindowState;
// }

// const store = new Store<StoreSchema>();

// GPU Fix: Disable hardware acceleration if environment variable is set
if (process.env.ELECTRON_DISABLE_GPU || process.env.DISABLE_GPU) {
  app.disableHardwareAcceleration();
  console.log('Hardware acceleration disabled due to GPU issues');
}

// Configure uncaught exception handling
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  // Don't quit immediately for GPU errors
  if (error.message && error.message.includes('GLES')) {
    console.log('GPU error detected, continuing with software rendering');
    app.disableHardwareAcceleration();
  } else {
    dialog.showErrorBox('Application Error', 'An unexpected error occurred. The application will now quit.');
    app.quit();
  }
});

// Configure unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Configure source map support for better error reporting
require('source-map-support').install();

// Ensure logs directory exists
const logsDir = path.join(app.getPath('userData'), 'logs');
fsExtra.ensureDirSync(logsDir);

// Configure winston logger
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

const logger = winston.createLogger({
  level: 'info',
  format: logFormat,
  defaultMeta: { service: 'pdf-editor' },
  transports: [
    new winston.transports.File({ 
      filename: path.join(logsDir, 'error.log'), 
      level: 'error' 
    }),
    new winston.transports.File({ 
      filename: path.join(logsDir, 'combined.log') 
    })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', { error: error.message, stack: error.stack });
  dialog.showErrorBox('Application Error', 'An unexpected error occurred. The application will now quit.');
  app.quit();
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', { promise, reason });
});

let mainWindow: Electron.BrowserWindow | null = null;
let isDev = process.env.NODE_ENV === 'development';

// Enable hardware acceleration
app.commandLine.appendSwitch('enable-features', 'VaapiVideoDecoder');

// Update the window state management
const loadWindowState = (): WindowState => {
  const defaultState: WindowState = {
    x: 0,
    y: 0,
    width: 1200,
    height: 800,
    isMaximized: false
  };

  try {
    const savedState = store.get('windowState');
    if (savedState) {
      return { ...defaultState, ...savedState };
    }
  } catch (error) {
    logger.error('Error loading window state:', error);
  }
  
  return defaultState;
};

const saveWindowState = (window: BrowserWindow): void => {
  try {
    const bounds = window.getBounds();
    const state: WindowState = {
      x: bounds.x,
      y: bounds.y,
      width: bounds.width,
      height: bounds.height,
      isMaximized: window.isMaximized()
    };
    store.set('windowState', state);
  } catch (error) {
    logger.error('Error saving window state:', error);
  }
};

// Configure secure defaults for all sessions
const configureSessionSecurity = () => {
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    // More permissive CSP for development, stricter for production
    const csp = isDev ? [
      // Development CSP - more permissive for webpack-dev-server and HMR
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline'", // Allow eval and inline scripts for webpack HMR
      "style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com", // Allow inline styles for React and libraries
      "style-src-elem 'self' 'unsafe-inline' https://cdnjs.cloudflare.com", // Allow style elements from vendors
      "img-src 'self' data: blob:",
      "font-src 'self' data: https://cdnjs.cloudflare.com", // Allow FontAwesome fonts
      "worker-src 'self' blob: data:", // Allow workers for PDF.js
      "connect-src 'self' ws: wss: http: https:", // Allow all connections for HMR
      "object-src 'none'",
      "media-src 'none'",
      "frame-ancestors 'none'",
      "form-action 'self'",
      "base-uri 'self'",
      "child-src 'self' blob:"
    ].join('; ') : [
      // Production CSP - more restrictive
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval'", // Still need eval for PDF.js worker
      "style-src 'self' 'unsafe-inline'", // Allow inline styles for React components
      "img-src 'self' data: blob:",
      "font-src 'self' data:",
      "worker-src 'self' blob: data:", // Extended worker sources for PDF.js
      "connect-src 'self' https://cdnjs.cloudflare.com", // Only CDN for PDF.js fallback
      "object-src 'none'",
      "media-src 'none'",
      "frame-ancestors 'none'",
      "form-action 'self'",
      "base-uri 'self'",
      "child-src 'self' blob:"
    ].join('; ');

    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [csp],
        'X-Content-Type-Options': ['nosniff'],
        'X-Frame-Options': ['SAMEORIGIN'],
        'X-XSS-Protection': ['1; mode=block'],
        'Referrer-Policy': ['strict-origin-when-cross-origin']
      }
    });
  });
};

// Initialize auto-updater
const initAutoUpdater = () => {
  if (process.env.NODE_ENV === 'production') {
    autoUpdater.checkForUpdatesAndNotify();
    
    autoUpdater.on('update-downloaded', (info) => {
      const dialogOpts: Electron.MessageBoxOptions = {
        type: 'info',
        buttons: ['Restart', 'Later'],
        title: 'Application Update',
        message: 'A new version has been downloaded. Restart the application to apply the updates.',
        detail: `Version ${info.version} is ready to install.`,
        noLink: true,
        defaultId: 0,
        cancelId: 1
      };

      dialog.showMessageBox(mainWindow!, dialogOpts).then((returnValue) => {
        if (returnValue.response === 0) autoUpdater.quitAndInstall();
      });
    });
  }
};

const createWindow = () => {
  const windowState = loadWindowState();
  
  // Configure secure defaults and handle GPU acceleration
  process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'false';
  
  // Force disable GPU acceleration for stability
  if (process.env.ELECTRON_DISABLE_GPU || process.env.DISABLE_GPU) {
    app.disableHardwareAcceleration();
    console.log('GPU acceleration disabled for stability');
  }
  
  mainWindow = new Electron.BrowserWindow({
    x: windowState.x,
    y: windowState.y,
    width: windowState.width,
    height: windowState.height,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webSecurity: !isDev, // Disable in development for easier debugging
      allowRunningInsecureContent: false,
      webgl: !process.env.ELECTRON_DISABLE_GPU,  // Disable WebGL if GPU is disabled
      disableBlinkFeatures: 'Auxclick',
      preload: path.join(__dirname, 'preload.js'),
      // Enable additional features for PDF.js
      webviewTag: false,
      // Enable experimental features that might be needed
      experimentalFeatures: !process.env.ELECTRON_DISABLE_GPU,  // Disable if GPU issues
      // Disable background throttling for better performance
      backgroundThrottling: false,
      // Additional settings for better PDF rendering
      offscreen: false,
      nodeIntegrationInWorker: false,
      nodeIntegrationInSubFrames: false
    },
    icon: path.join(__dirname, isDev ? '../../public/icon.png' : '../../../public/icon.png'),
    titleBarStyle: 'hiddenInset',
    frame: process.platform !== 'darwin',
    backgroundColor: '#1e1e1e',
    show: false
  });

  if (windowState.isMaximized) {
    mainWindow.maximize();
  }

  // Save window state on close
  mainWindow.on('close', () => {
    if (mainWindow) {
      saveWindowState(mainWindow);
    }
  });

  // Load the app
  if (isDev) {
    // Development mode - try webpack dev server first
    const devServerUrl = 'http://localhost:8080';
    mainWindow.loadURL(devServerUrl).catch(err => {
      console.error('Dev server not running, loading built files:', err);
      // Fallback to built files in development
      const indexPath = path.join(__dirname, '../../dist/renderer/index.html');
      if (fs.existsSync(indexPath)) {
        mainWindow.loadFile(indexPath);
      } else {
        // Fallback to public/index.html if nothing else works
        mainWindow.loadFile(path.join(__dirname, '../../public/index.html'));
      }
    });
  } else {
    // Production mode - load built files
    const indexPath = path.join(__dirname, '../renderer/index.html');
    if (fs.existsSync(indexPath)) {
      mainWindow.loadFile(indexPath);
    } else {
      // Try dist folder
      const distPath = path.join(__dirname, '../../dist/renderer/index.html');
      if (fs.existsSync(distPath)) {
        mainWindow.loadFile(distPath);
      } else {
        // Final fallback
        mainWindow.loadFile(path.join(__dirname, '../../public/index.html'));
      }
    }
  }

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Create application menu
  createMenu();
  
  // Log successful window creation
  logger.info('Main window created successfully', {
    width: windowState.width,
    height: windowState.height,
    isMaximized: windowState.isMaximized
  });
};

const createMenu = () => {
  const template: any[] = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Open PDF',
          accelerator: 'CmdOrCtrl+O',
          click: () => {
            mainWindow?.webContents.send('menu-open');
          }
        },
        {
          label: 'Save',
          accelerator: 'CmdOrCtrl+S',
          click: () => {
            mainWindow?.webContents.send('menu-save');
          }
        },
        {
          label: 'Save As...',
          accelerator: 'CmdOrCtrl+Shift+S',
          click: () => {
            mainWindow?.webContents.send('menu-save-as');
          }
        },
        { type: 'separator' },
        {
          label: 'Import',
          submenu: [
            {
              label: 'From Images',
              click: () => {
                mainWindow?.webContents.send('menu-import-images');
              }
            },
            {
              label: 'From Word',
              click: () => {
                mainWindow?.webContents.send('menu-import-word');
              }
            }
          ]
        },
        {
          label: 'Export',
          submenu: [
            {
              label: 'As Images',
              click: () => {
                mainWindow?.webContents.send('menu-export-images');
              }
            },
            {
              label: 'As Word',
              click: () => {
                mainWindow?.webContents.send('menu-export-word');
              }
            },
            {
              label: 'As Text',
              click: () => {
                mainWindow?.webContents.send('menu-export-text');
              }
            }
          ]
        },
        { type: 'separator' },
        {
          label: 'Print',
          accelerator: 'CmdOrCtrl+P',
          click: () => {
            mainWindow?.webContents.send('menu-print');
          }
        },
        { type: 'separator' },
        {
          label: 'Recent Files',
          submenu: []
        },
        { type: 'separator' },
        {
          label: 'Exit',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { label: 'Undo', accelerator: 'CmdOrCtrl+Z', role: 'undo' },
        { label: 'Redo', accelerator: 'CmdOrCtrl+Y', role: 'redo' },
        { type: 'separator' },
        { label: 'Cut', accelerator: 'CmdOrCtrl+X', role: 'cut' },
        { label: 'Copy', accelerator: 'CmdOrCtrl+C', role: 'copy' },
        { label: 'Paste', accelerator: 'CmdOrCtrl+V', role: 'paste' },
        { label: 'Delete', role: 'delete' },
        { type: 'separator' },
        { label: 'Select All', accelerator: 'CmdOrCtrl+A', role: 'selectAll' },
        { type: 'separator' },
        {
          label: 'Find',
          accelerator: 'CmdOrCtrl+F',
          click: () => {
            mainWindow?.webContents.send('menu-find');
          }
        },
        {
          label: 'Replace',
          accelerator: 'CmdOrCtrl+H',
          click: () => {
            mainWindow?.webContents.send('menu-replace');
          }
        }
      ]
    },
    {
      label: 'View',
      submenu: [
        {
          label: 'Zoom In',
          accelerator: 'CmdOrCtrl+Plus',
          click: () => {
            mainWindow?.webContents.send('menu-zoom-in');
          }
        },
        {
          label: 'Zoom Out',
          accelerator: 'CmdOrCtrl+-',
          click: () => {
            mainWindow?.webContents.send('menu-zoom-out');
          }
        },
        {
          label: 'Actual Size',
          accelerator: 'CmdOrCtrl+0',
          click: () => {
            mainWindow?.webContents.send('menu-zoom-reset');
          }
        },
        {
          label: 'Fit to Width',
          click: () => {
            mainWindow?.webContents.send('menu-fit-width');
          }
        },
        {
          label: 'Fit to Page',
          click: () => {
            mainWindow?.webContents.send('menu-fit-page');
          }
        },
        { type: 'separator' },
        {
          label: 'Rotate Left',
          accelerator: 'CmdOrCtrl+L',
          click: () => {
            mainWindow?.webContents.send('menu-rotate-left');
          }
        },
        {
          label: 'Rotate Right',
          accelerator: 'CmdOrCtrl+R',
          click: () => {
            mainWindow?.webContents.send('menu-rotate-right');
          }
        },
        { type: 'separator' },
        {
          label: 'Full Screen',
          accelerator: process.platform === 'darwin' ? 'Ctrl+Cmd+F' : 'F11',
          click: () => {
            const isFullScreen = mainWindow?.isFullScreen();
            mainWindow?.setFullScreen(!isFullScreen);
          }
        },
        { type: 'separator' },
        {
          label: 'Toggle Dark Mode',
          click: () => {
            mainWindow?.webContents.send('menu-toggle-theme');
          }
        }
      ]
    },
    {
      label: 'Document',
      submenu: [
        {
          label: 'Insert Page',
          click: () => {
            mainWindow?.webContents.send('menu-insert-page');
          }
        },
        {
          label: 'Delete Page',
          click: () => {
            mainWindow?.webContents.send('menu-delete-page');
          }
        },
        {
          label: 'Rotate Page',
          click: () => {
            mainWindow?.webContents.send('menu-rotate-page');
          }
        },
        {
          label: 'Extract Pages',
          click: () => {
            mainWindow?.webContents.send('menu-extract-pages');
          }
        },
        { type: 'separator' },
        {
          label: 'Merge PDFs',
          click: () => {
            mainWindow?.webContents.send('menu-merge-pdfs');
          }
        },
        {
          label: 'Split PDF',
          click: () => {
            mainWindow?.webContents.send('menu-split-pdf');
          }
        },
        { type: 'separator' },
        {
          label: 'Compress PDF',
          click: () => {
            mainWindow?.webContents.send('menu-compress');
          }
        },
        {
          label: 'Optimize PDF',
          click: () => {
            mainWindow?.webContents.send('menu-optimize');
          }
        }
      ]
    },
    {
      label: 'Tools',
      submenu: [
        {
          label: 'Text',
          click: () => {
            mainWindow?.webContents.send('menu-tool-text');
          }
        },
        {
          label: 'Highlight',
          click: () => {
            mainWindow?.webContents.send('menu-tool-highlight');
          }
        },
        {
          label: 'Draw',
          click: () => {
            mainWindow?.webContents.send('menu-tool-draw');
          }
        },
        {
          label: 'Shapes',
          click: () => {
            mainWindow?.webContents.send('menu-tool-shapes');
          }
        },
        {
          label: 'Stamp',
          click: () => {
            mainWindow?.webContents.send('menu-tool-stamp');
          }
        },
        {
          label: 'Signature',
          click: () => {
            mainWindow?.webContents.send('menu-tool-signature');
          }
        },
        { type: 'separator' },
        {
          label: 'OCR (Text Recognition)',
          click: () => {
            mainWindow?.webContents.send('menu-ocr');
          }
        },
        {
          label: 'Redact',
          click: () => {
            mainWindow?.webContents.send('menu-redact');
          }
        },
        { type: 'separator' },
        {
          label: 'Forms',
          submenu: [
            {
              label: 'Create Form Field',
              click: () => {
                mainWindow?.webContents.send('menu-create-form');
              }
            },
            {
              label: 'Edit Form Fields',
              click: () => {
                mainWindow?.webContents.send('menu-edit-forms');
              }
            },
            {
              label: 'Fill Form',
              click: () => {
                mainWindow?.webContents.send('menu-fill-form');
              }
            }
          ]
        }
      ]
    },
    {
      label: 'Security',
      submenu: [
        {
          label: 'Encrypt PDF',
          click: () => {
            mainWindow?.webContents.send('menu-encrypt');
          }
        },
        {
          label: 'Remove Password',
          click: () => {
            mainWindow?.webContents.send('menu-decrypt');
          }
        },
        {
          label: 'Digital Signature',
          click: () => {
            mainWindow?.webContents.send('menu-digital-signature');
          }
        },
        {
          label: 'Permissions',
          click: () => {
            mainWindow?.webContents.send('menu-permissions');
          }
        }
      ]
    },
    {
      label: 'Window',
      submenu: [
        { label: 'Minimize', role: 'minimize' },
        { label: 'Close', role: 'close' },
        { type: 'separator' },
        {
          label: 'Reload',
          accelerator: 'CmdOrCtrl+Shift+R',
          click: () => {
            mainWindow?.reload();
          }
        },
        {
          label: 'Toggle Developer Tools',
          accelerator: process.platform === 'darwin' ? 'Alt+Cmd+I' : 'Ctrl+Shift+I',
          click: () => {
            mainWindow?.webContents.toggleDevTools();
          }
        }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'Documentation',
          click: () => {
            shell.openExternal('https://pdf-editor-docs.com');
          }
        },
        {
          label: 'Keyboard Shortcuts',
          click: () => {
            mainWindow?.webContents.send('menu-shortcuts');
          }
        },
        { type: 'separator' },
        {
          label: 'Check for Updates',
          click: () => {
            mainWindow?.webContents.send('menu-check-updates');
          }
        },
        { type: 'separator' },
        {
          label: 'About',
          click: () => {
            dialog.showMessageBox(mainWindow!, {
              type: 'info',
              title: 'About Professional PDF Editor',
              message: 'Professional PDF Editor',
              detail: 'Version 1.0.0\n\nA comprehensive PDF editing solution with advanced features.\n\n 2024 Professional PDF Editor Team',
              buttons: ['OK']
            });
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
};

// IPC Handlers will be registered in setupIPCHandlers() function

// GPU and hardware acceleration handling
app.commandLine.appendSwitch('--disable-gpu-sandbox');
app.commandLine.appendSwitch('--disable-software-rasterizer');
app.commandLine.appendSwitch('--disable-gpu');
app.commandLine.appendSwitch('--no-sandbox');

// Force software rendering for compatibility
app.disableHardwareAcceleration();

// Input validation utilities - now imported from ../utils/validation

// Setup IPC handlers BEFORE app.whenReady()
function setupIPCHandlers() {
  console.log('Setting up IPC handlers...');
  
  ipcMain.handle('open-file-dialog', async (event) => {
    try {
      // Validate sender
      if (!event.sender || event.sender !== mainWindow?.webContents) {
        throw new Error('Unauthorized IPC sender');
      }
      
      console.log('IPC: open-file-dialog called');
      const result = await dialog.showOpenDialog(mainWindow!, {
        properties: ['openFile'],
        filters: [
          { name: 'PDF Files', extensions: ['pdf'] },
          { name: 'All Files', extensions: ['*'] }
        ]
      });
      
      if (!result.canceled && result.filePaths.length > 0) {
        const filePath = result.filePaths[0];
        
        // Validate file path
        if (!isValidPath(filePath)) {
          throw new Error('Invalid file path');
        }
        
        // Check file exists and size
        const stats = fs.statSync(filePath);
        if (!stats.isFile() || stats.size > 100 * 1024 * 1024) { // Max 100MB
          throw new Error('File too large or invalid');
        }
        
        console.log('Opening file:', filePath);
        const data = fs.readFileSync(filePath);
        return { path: filePath, data: data.buffer };
      }
      return null;
    } catch (error) {
      logger.error('Error in open-file-dialog:', error);
      throw error;
    }
  });

  ipcMain.handle('save-file-dialog', async (event, defaultPath?: string) => {
    try {
      // Validate sender
      if (!event.sender || event.sender !== mainWindow?.webContents) {
        throw new Error('Unauthorized IPC sender');
      }
      
      // Validate and sanitize defaultPath
      if (defaultPath && typeof defaultPath === 'string') {
        defaultPath = sanitizePath(defaultPath);
        if (defaultPath.length > 255) {
          throw new Error('Default path too long');
        }
      }
      
      console.log('IPC: save-file-dialog called');
      const result = await dialog.showSaveDialog(mainWindow!, {
        defaultPath: defaultPath || 'document.pdf',
        filters: [
          { name: 'PDF Files', extensions: ['pdf'] },
          { name: 'All Files', extensions: ['*'] },
        ],
      });
      
      if (!result.canceled && result.filePath) {
        // Validate the chosen path
        if (!isValidPath(result.filePath)) {
          throw new Error('Invalid save path selected');
        }
        return result.filePath;
      }
      return null;
    } catch (error) {
      logger.error('Error in save-file-dialog:', error);
      throw error;
    }
  });

  ipcMain.handle('save-file', async (event, filePath: string, data: ArrayBuffer) => {
    try {
      // Validate sender
      if (!event.sender || event.sender !== mainWindow?.webContents) {
        throw new Error('Unauthorized IPC sender');
      }
      
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
      
      console.log('IPC: Saving file to:', sanitizedPath);
      
      // Check if directory exists and is writable
      const dir = path.dirname(sanitizedPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      // Handle different data types properly to avoid corruption
      let buffer: Buffer;
      if (Buffer.isBuffer(data)) {
        buffer = data;
      } else if (data instanceof ArrayBuffer) {
        buffer = Buffer.from(data);
      } else {
        throw new Error('Unsupported data type for file writing');
      }
      
      fs.writeFileSync(sanitizedPath, buffer);
      return { success: true };
    } catch (error) {
      console.error('IPC: Save file error:', error);
      logger.error('Save file error:', error);
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  });

  ipcMain.handle('get-preferences', (event) => {
    try {
      // Validate sender
      if (!event.sender || event.sender !== mainWindow?.webContents) {
        throw new Error('Unauthorized IPC sender');
      }
      
      return store.get('preferences', {
        theme: 'dark',
        autoSave: true,
        autoSaveInterval: 5,
        language: 'en',
        defaultZoom: 100,
        showThumbnails: true,
        highlightColor: '#FFFF00',
        defaultFont: 'Helvetica'
      });
    } catch (error) {
      logger.error('Error getting preferences:', error);
      throw error;
    }
  });

  ipcMain.handle('set-preferences', (event, preferences) => {
    try {
      // Validate sender
      if (!event.sender || event.sender !== mainWindow?.webContents) {
        throw new Error('Unauthorized IPC sender');
      }
      
      // Validate preferences object
      if (!preferences || typeof preferences !== 'object') {
        throw new Error('Invalid preferences data');
      }
      
      // Validate specific fields
      const validatedPrefs: any = {};
      
      if (preferences.theme) {
        if (!['dark', 'light'].includes(preferences.theme)) {
          throw new Error('Invalid theme value');
        }
        validatedPrefs.theme = preferences.theme;
      }
      
      if (preferences.autoSave !== undefined) {
        if (typeof preferences.autoSave !== 'boolean') {
          throw new Error('Invalid autoSave value');
        }
        validatedPrefs.autoSave = preferences.autoSave;
      }
      
      if (preferences.autoSaveInterval !== undefined) {
        const interval = Number(preferences.autoSaveInterval);
        if (!Number.isInteger(interval) || interval < 1 || interval > 60) {
          throw new Error('Invalid autoSaveInterval value');
        }
        validatedPrefs.autoSaveInterval = interval;
      }
      
      if (preferences.language) {
        if (!/^[a-z]{2}(-[A-Z]{2})?$/.test(preferences.language)) {
          throw new Error('Invalid language code');
        }
        validatedPrefs.language = preferences.language;
      }
      
      if (preferences.defaultZoom !== undefined) {
        const zoom = Number(preferences.defaultZoom);
        if (!Number.isInteger(zoom) || zoom < 25 || zoom > 500) {
          throw new Error('Invalid defaultZoom value');
        }
        validatedPrefs.defaultZoom = zoom;
      }
      
      if (preferences.highlightColor) {
        if (!/^#[0-9A-Fa-f]{6}$/.test(preferences.highlightColor)) {
          throw new Error('Invalid highlight color format');
        }
        validatedPrefs.highlightColor = preferences.highlightColor;
      }
      
      if (preferences.defaultFont) {
        // Sanitize font name
        const fontName = preferences.defaultFont.replace(/[^\w\s-]/g, '');
        if (fontName.length > 50) {
          throw new Error('Font name too long');
        }
        validatedPrefs.defaultFont = fontName;
      }
      
      // Merge with existing preferences
      const currentPrefs = store.get('preferences', {});
      const updatedPrefs = { ...currentPrefs, ...validatedPrefs };
      
      store.set('preferences', updatedPrefs);
      return { success: true };
    } catch (error) {
      logger.error('Error setting preferences:', error);
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  });

  ipcMain.handle('get-recent-files', (event) => {
    try {
      // Validate sender
      if (!event.sender || event.sender !== mainWindow?.webContents) {
        throw new Error('Unauthorized IPC sender');
      }
      
      const recentFiles = store.get('recentFiles', []) as string[];
      // Validate and filter existing files
      const validFiles = recentFiles.filter(filePath => {
        try {
          return typeof filePath === 'string' && 
                 isValidPath(filePath) && 
                 fs.existsSync(filePath);
        } catch {
          return false;
        }
      });
      
      // Update store with valid files only
      if (validFiles.length !== recentFiles.length) {
        store.set('recentFiles', validFiles);
      }
      
      return validFiles;
    } catch (error) {
      logger.error('Error getting recent files:', error);
      return [];
    }
  });

  ipcMain.handle('add-recent-file', (event, filePath: string) => {
    try {
      // Validate sender
      if (!event.sender || event.sender !== mainWindow?.webContents) {
        throw new Error('Unauthorized IPC sender');
      }
      
      // Validate file path
      if (!filePath || typeof filePath !== 'string') {
        throw new Error('Invalid file path');
      }
      
      const sanitizedPath = sanitizePath(filePath);
      if (!isValidPath(sanitizedPath) || !fs.existsSync(sanitizedPath)) {
        throw new Error('Invalid or non-existent file path');
      }
      
      const recentFiles = store.get('recentFiles', []) as string[];
      const filtered = recentFiles.filter(f => f !== sanitizedPath);
      filtered.unshift(sanitizedPath);
      const updated = filtered.slice(0, 10); // Keep only 10 recent files
      store.set('recentFiles', updated);
      return updated;
    } catch (error) {
      logger.error('Error adding recent file:', error);
      return store.get('recentFiles', []);
    }
  });

  console.log('IPC handlers registered successfully');
}

// App event handlers
app.whenReady().then(() => {
  // Configure session security
  configureSessionSecurity();
  
  // Initialize auto-updater
  initAutoUpdater();
  
  // Setup IPC handlers
  setupIPCHandlers();
  
  // Create the main window
  createWindow();
  
  // Handle app activation (macOS)
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
  
  logger.info('Application ready and initialized');
});

// Quit when all windows are closed
app.on('window-all-closed', () => {
  logger.info('All windows closed');
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Handle app activation (macOS)
app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// Handle before quit
app.on('before-quit', () => {
  logger.info('Application is about to quit');
});

// Security: Prevent new window creation
app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', (event, navigationUrl) => {
    event.preventDefault();
    shell.openExternal(navigationUrl);
  });
});

mainWindow?.webContents.setWindowOpenHandler(({ url }) => {
  // Open external links in default browser
  if (url !== mainWindow?.webContents.getURL()) {
    shell.openExternal(url).catch(err => {
      console.error('Failed to open external URL:', err);
    });
    return { action: 'deny' };
  }
  return { action: 'allow' };
});

const loadWindowBounds = (): Electron.Rectangle => {
  const defaultBounds = { width: 1200, height: 800, x: 0, y: 0 };
  const savedBounds = store.get('windowBounds');
  return savedBounds || defaultBounds;
};

const saveWindowBounds = (): void => {
  if (mainWindow) {
    store.set('windowBounds', mainWindow.getBounds());
  }
};

const showOpenDialog = async (options: Electron.OpenDialogOptions) => {
  if (!mainWindow) {
    throw new Error('Main window is not available');
  }
  return dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [
      { name: 'PDF Files', extensions: ['pdf'] },
      { name: 'All Files', extensions: ['*'] },
    ],
    ...options,
  });
};

ipcMain.handle('open-file', async () => {
  const { filePaths } = await showOpenDialog({
    title: 'Open PDF',
    properties: ['openFile'],
    filters: [{ name: 'PDF Files', extensions: ['pdf'] }],
  });
  
  if (filePaths.length === 0) {
    return null;
  }
  
  const filePath = filePaths[0];
  try {
    const data = await fs.promises.readFile(filePath);
    return { path: filePath, data: data.buffer };
  } catch (error) {
    console.error('Error reading file:', error);
    throw new Error(`Failed to read file: ${error.message}`);
  }
});
