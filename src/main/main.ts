import { app, BrowserWindow, Menu, dialog, ipcMain, shell } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import Store from 'electron-store';

// Initialize electron store for preferences
const store = new Store();

let mainWindow: BrowserWindow | null = null;
let isDev = process.env.NODE_ENV === 'development';

// Enable hardware acceleration
app.commandLine.appendSwitch('enable-features', 'VaapiVideoDecoder');

interface WindowState {
  x?: number;
  y?: number;
  width: number;
  height: number;
  isMaximized: boolean;
}

const getWindowState = (): WindowState => {
  const defaultState: WindowState = {
    width: 1400,
    height: 900,
    isMaximized: false
  };

  const savedState = store.get('windowState') as WindowState;
  return savedState || defaultState;
};

const saveWindowState = (window: BrowserWindow) => {
  const bounds = window.getBounds();
  const isMaximized = window.isMaximized();
  
  store.set('windowState', {
    x: bounds.x,
    y: bounds.y,
    width: bounds.width,
    height: bounds.height,
    isMaximized
  });
};

const createWindow = () => {
  const windowState = getWindowState();
  
  mainWindow = new BrowserWindow({
    x: windowState.x,
    y: windowState.y,
    width: windowState.width,
    height: windowState.height,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, '../../public/icon.png'),
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
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
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
              detail: 'Version 1.0.0\n\nA comprehensive PDF editing solution with advanced features.\n\n© 2024 Professional PDF Editor Team',
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

// IPC Handlers
ipcMain.handle('open-file-dialog', async () => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    properties: ['openFile'],
    filters: [
      { name: 'PDF Files', extensions: ['pdf'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  });
  
  if (!result.canceled && result.filePaths.length > 0) {
    const filePath = result.filePaths[0];
    const data = fs.readFileSync(filePath);
    return { path: filePath, data: data.buffer };
  }
  return null;
});

ipcMain.handle('save-file-dialog', async (_event, defaultPath?: string) => {
  const result = await dialog.showSaveDialog(mainWindow!, {
    defaultPath: defaultPath || 'document.pdf',
    filters: [
      { name: 'PDF Files', extensions: ['pdf'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  });
  
  if (!result.canceled) {
    return result.filePath;
  }
  return null;
});

ipcMain.handle('save-file', async (_event, filePath: string, data: ArrayBuffer) => {
  try {
    fs.writeFileSync(filePath, Buffer.from(data));
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
});

ipcMain.handle('get-preferences', () => {
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
});

ipcMain.handle('set-preferences', (_event, preferences) => {
  store.set('preferences', preferences);
  return { success: true };
});

ipcMain.handle('get-recent-files', () => {
  return store.get('recentFiles', []);
});

ipcMain.handle('add-recent-file', (_event, filePath: string) => {
  const recentFiles = store.get('recentFiles', []) as string[];
  const filtered = recentFiles.filter(f => f !== filePath);
  filtered.unshift(filePath);
  const updated = filtered.slice(0, 10); // Keep only 10 recent files
  store.set('recentFiles', updated);
  return updated;
});

// App event handlers
app.whenReady().then(createWindow);

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

// Auto updater
app.on('ready', () => {
  if (!isDev) {
    // Auto-updater configuration would go here
  }
});
