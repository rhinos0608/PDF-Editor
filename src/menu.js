const { app, Menu, shell, dialog } = require('electron');
const path = require('path');

let mainWindow = null; // This will be set by main.js
let recentFiles = []; // This will be set by main.js

function setMainWindow(window) {
  mainWindow = window;
}

function setRecentFiles(files) {
  recentFiles = files;
}

function openRecentFile(filePath) {
  if (mainWindow) {
    mainWindow.webContents.send('open-recent-file', filePath);
  }
}

function showAboutDialog() {
  if (mainWindow) {
    dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: 'About Professional PDF Editor',
      message: 'Professional PDF Editor',
      detail: `Version: ${app.getVersion()}\n` +
              'Adobe-quality PDF editing solution\n\n' + 
              'Built with Electron, React, and PDF.js\n' + 
              'Enhanced with Transithesis Cognitive Engine\n\n' + 
              '© 2024 Professional PDF Editor Team',
      buttons: ['OK'],
      icon: path.join(__dirname, '../public/icon.png')
    });
  }
}

function checkForUpdates() {
  if (mainWindow) {
    // Placeholder for auto-updater
    dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: 'Check for Updates',
      message: 'You are using the latest version (2.0.0)', // TODO: Get actual version from electron-updater
      buttons: ['OK']
    });
  }
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

module.exports = {
  createMenu,
  setMainWindow,
  setRecentFiles
};
