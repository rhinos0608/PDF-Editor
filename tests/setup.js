/**
 * Jest Test Setup File
 * Global test configuration and mocks
 */

// Mock Electron APIs for testing
const mockElectron = {
  app: {
    getPath: jest.fn().mockReturnValue('/mock/path'),
    getVersion: jest.fn().mockReturnValue('1.0.0'),
    whenReady: jest.fn().mockResolvedValue(undefined),
    quit: jest.fn(),
    relaunch: jest.fn(),
    exit: jest.fn(),
    requestSingleInstanceLock: jest.fn().mockReturnValue(true),
    disableHardwareAcceleration: jest.fn(),
    commandLine: {
      appendSwitch: jest.fn()
    },
    on: jest.fn()
  },
  
  BrowserWindow: jest.fn().mockImplementation(() => ({
    loadFile: jest.fn().mockResolvedValue(undefined),
    loadURL: jest.fn().mockResolvedValue(undefined),
    show: jest.fn(),
    hide: jest.fn(),
    close: jest.fn(),
    minimize: jest.fn(),
    maximize: jest.fn(),
    unmaximize: jest.fn(),
    isMaximized: jest.fn().mockReturnValue(false),
    setFullScreen: jest.fn(),
    focus: jest.fn(),
    restore: jest.fn(),
    isMinimized: jest.fn().mockReturnValue(false),
    webContents: {
      send: jest.fn(),
      openDevTools: jest.fn(),
      closeDevTools: jest.fn(),
      on: jest.fn(),
      session: {
        clearCache: jest.fn().mockResolvedValue(undefined)
      }
    },
    on: jest.fn(),
    once: jest.fn()
  })),
  
  ipcMain: {
    handle: jest.fn(),
    on: jest.fn(),
    removeHandler: jest.fn(),
    removeAllListeners: jest.fn()
  },
  
  ipcRenderer: {
    invoke: jest.fn(),
    send: jest.fn(),
    on: jest.fn(),
    removeAllListeners: jest.fn()
  },
  
  dialog: {
    showOpenDialog: jest.fn().mockResolvedValue({
      canceled: false,
      filePaths: ['/mock/file.pdf']
    }),
    showSaveDialog: jest.fn().mockResolvedValue({
      canceled: false,
      filePath: '/mock/save.pdf'
    }),
    showMessageBox: jest.fn().mockResolvedValue({ response: 0 }),
    showErrorBox: jest.fn()
  },
  
  Menu: {
    buildFromTemplate: jest.fn(),
    setApplicationMenu: jest.fn()
  },
  
  shell: {
    openExternal: jest.fn().mockResolvedValue(undefined)
  },
  
  session: {
    defaultSession: {
      webRequest: {
        onHeadersReceived: jest.fn()
      }
    }
  },
  
  contextBridge: {
    exposeInMainWorld: jest.fn()
  }
};

// Mock PDF.js
const mockPDFJS = {
  getDocument: jest.fn().mockImplementation(() => ({
    promise: Promise.resolve({
      numPages: 1,
      getPage: jest.fn().mockResolvedValue({
        getViewport: jest.fn().mockReturnValue({
          width: 595,
          height: 842,
          scale: 1
        }),
        render: jest.fn().mockReturnValue({
          promise: Promise.resolve()
        }),
        getTextContent: jest.fn().mockResolvedValue({
          items: [{ str: 'Mock text content' }]
        }),
        cleanup: jest.fn()
      }),
      destroy: jest.fn()
    })
  })),
  
  GlobalWorkerOptions: {
    workerSrc: ''
  },
  
  version: '3.11.0'
};

// Mock pdf-lib
const mockPDFLib = {
  PDFDocument: {
    create: jest.fn().mockResolvedValue({
      addPage: jest.fn(),
      getPages: jest.fn().mockReturnValue([]),
      save: jest.fn().mockResolvedValue(new Uint8Array([1, 2, 3]))
    }),
    load: jest.fn().mockResolvedValue({
      getPages: jest.fn().mockReturnValue([]),
      save: jest.fn().mockResolvedValue(new Uint8Array([1, 2, 3])),
      getPageCount: jest.fn().mockReturnValue(1)
    })
  },
  
  rgb: jest.fn().mockReturnValue({ r: 0, g: 0, b: 0 }),
  degrees: jest.fn().mockImplementation((deg) => deg),
  PageSizes: {
    A4: [595, 842]
  }
};

// Mock Tesseract.js
const mockTesseract = {
  recognize: jest.fn().mockResolvedValue({
    data: {
      text: 'Mock OCR text',
      confidence: 95,
      words: [
        { text: 'Mock', confidence: 95, bbox: { x0: 0, y0: 0, x1: 50, y1: 20 } },
        { text: 'OCR', confidence: 95, bbox: { x0: 55, y0: 0, x1: 85, y1: 20 } },
        { text: 'text', confidence: 95, bbox: { x0: 90, y0: 0, x1: 130, y1: 20 } }
      ]
    }
  }),
  
  createWorker: jest.fn().mockResolvedValue({
    load: jest.fn().mockResolvedValue(undefined),
    loadLanguage: jest.fn().mockResolvedValue(undefined),
    initialize: jest.fn().mockResolvedValue(undefined),
    recognize: jest.fn().mockResolvedValue({
      data: { text: 'Mock OCR text' }
    }),
    terminate: jest.fn().mockResolvedValue(undefined)
  })
};

// Mock React components for testing
const mockReact = {
  createElement: jest.fn(),
  Component: class MockComponent {
    render() {
      return null;
    }
  },
  useState: jest.fn(() => [null, jest.fn()]),
  useEffect: jest.fn(),
  useCallback: jest.fn((fn) => fn),
  useMemo: jest.fn((fn) => fn()),
  useRef: jest.fn(() => ({ current: null }))
};

// Mock file system operations
const mockFS = {
  readFile: jest.fn().mockResolvedValue(Buffer.from('mock file content')),
  writeFile: jest.fn().mockResolvedValue(undefined),
  appendFile: jest.fn().mockResolvedValue(undefined),
  exists: jest.fn().mockReturnValue(true),
  stat: jest.fn().mockImplementation((path, callback) => {
    callback(null, { size: 1024 });
  }),
  existsSync: jest.fn().mockReturnValue(true),
  readFileSync: jest.fn().mockReturnValue(Buffer.from('mock file content')),
  writeFileSync: jest.fn(),
  appendFileSync: jest.fn()
};

// Global mocks
global.electron = mockElectron;
global.pdfjsLib = mockPDFJS;
global.PDFLib = mockPDFLib;
global.Tesseract = mockTesseract;
global.React = mockReact;

// Mock modules
jest.mock('electron', () => mockElectron);
jest.mock('pdfjs-dist', () => mockPDFJS);
jest.mock('pdf-lib', () => mockPDFLib);
jest.mock('tesseract.js', () => mockTesseract);
jest.mock('fs', () => mockFS);
jest.mock('fs/promises', () => mockFS);

// Mock Canvas for PDF rendering tests
const mockCanvas = {
  getContext: jest.fn().mockReturnValue({
    drawImage: jest.fn(),
    fillRect: jest.fn(),
    clearRect: jest.fn(),
    save: jest.fn(),
    restore: jest.fn(),
    scale: jest.fn(),
    translate: jest.fn(),
    rotate: jest.fn(),
    fillText: jest.fn(),
    measureText: jest.fn().mockReturnValue({ width: 100 }),
    createImageData: jest.fn().mockReturnValue({
      data: new Uint8ClampedArray(4),
      width: 1,
      height: 1
    }),
    putImageData: jest.fn(),
    getImageData: jest.fn().mockReturnValue({
      data: new Uint8ClampedArray(4),
      width: 1,
      height: 1
    })
  }),
  toDataURL: jest.fn().mockReturnValue('data:image/png;base64,mock'),
  width: 800,
  height: 600
};

// Mock HTMLCanvasElement
Object.defineProperty(global, 'HTMLCanvasElement', {
  value: jest.fn().mockImplementation(() => mockCanvas),
  writable: true
});

// Mock CanvasRenderingContext2D
Object.defineProperty(global, 'CanvasRenderingContext2D', {
  value: jest.fn(),
  writable: true
});

// Mock window and document for renderer tests
Object.defineProperty(global, 'window', {
  value: {
    electronAPI: {
      openFile: jest.fn(),
      saveFile: jest.fn(),
      getPreferences: jest.fn().mockResolvedValue({}),
      setPreferences: jest.fn().mockResolvedValue({})
    },
    document: {
      createElement: jest.fn().mockReturnValue(mockCanvas),
      getElementById: jest.fn().mockReturnValue(mockCanvas),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn()
    },
    location: {
      href: 'file:///mock/path'
    },
    URL: {
      createObjectURL: jest.fn().mockReturnValue('mock-url'),
      revokeObjectURL: jest.fn()
    }
  },
  writable: true
});

Object.defineProperty(global, 'document', {
  value: global.window.document,
  writable: true
});

// Mock crypto for security tests
Object.defineProperty(global, 'crypto', {
  value: {
    getRandomValues: jest.fn().mockImplementation((arr) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256);
      }
      return arr;
    }),
    subtle: {
      generateKey: jest.fn().mockResolvedValue({}),
      encrypt: jest.fn().mockResolvedValue(new ArrayBuffer(16)),
      decrypt: jest.fn().mockResolvedValue(new ArrayBuffer(16))
    }
  },
  writable: true
});

// Mock console methods for cleaner test output
const originalConsole = global.console;
global.console = {
  ...originalConsole,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn()
};

// Global test utilities
global.createMockFile = (name = 'test.pdf', size = 1024) => {
  const mockFile = new Uint8Array(size);
  // Add PDF header
  const pdfHeader = new TextEncoder().encode('%PDF-1.4');
  mockFile.set(pdfHeader, 0);
  return mockFile;
};

global.createMockEvent = (overrides = {}) => ({
  sender: {
    isDestroyed: () => false,
    ...overrides.sender
  },
  senderFrame: {
    url: 'file:///app/index.html',
    ...overrides.senderFrame
  },
  ...overrides
});

// Error handling for tests
process.on('uncaughtException', (error) => {
  console.error('Unhandled error in test:', error);
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled promise rejection in test:', reason);
});

// Test environment detection
process.env.NODE_ENV = 'test';

// Increase test timeout for integration tests
jest.setTimeout(30000);

console.log('Jest setup complete - all mocks initialized');