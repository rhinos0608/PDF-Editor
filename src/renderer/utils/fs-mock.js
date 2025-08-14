/**
 * File System Mock for Renderer Process
 * 
 * This mock provides safe fallbacks for Node.js fs operations in the browser environment.
 * It prevents errors when dependencies try to use fs methods but redirects to appropriate
 * alternatives or safe fallbacks.
 */

console.warn('⚠️ fs module accessed in renderer process - using safe fallback');

// Mock fs module to prevent errors
const fsMock = {
  // Synchronous methods - return safe defaults
  existsSync: (path) => {
    console.warn(`⚠️ fs.existsSync called with: ${path} - returning false (use electronAPI for file operations)`);
    return false; // Always return false to prevent assuming file exists
  },
  
  statSync: (path) => {
    console.warn(`⚠️ fs.statSync called with: ${path} - throwing error (use electronAPI for file operations)`);
    const error = new Error('fs.statSync not available in renderer process - use electronAPI');
    error.code = 'ENOENT';
    throw error;
  },
  
  readFileSync: (path, options) => {
    console.warn(`⚠️ fs.readFileSync called with: ${path} - throwing error (use electronAPI for file operations)`);
    const error = new Error('fs.readFileSync not available in renderer process - use electronAPI.openFile()');
    error.code = 'ENOENT';
    throw error;
  },
  
  writeFileSync: (path, data, options) => {
    console.warn(`⚠️ fs.writeFileSync called with: ${path} - throwing error (use electronAPI for file operations)`);
    const error = new Error('fs.writeFileSync not available in renderer process - use electronAPI.saveFile()');
    error.code = 'EACCES';
    throw error;
  },
  
  mkdirSync: (path, options) => {
    console.warn(`⚠️ fs.mkdirSync called with: ${path} - throwing error (directories should be handled by main process)`);
    const error = new Error('fs.mkdirSync not available in renderer process');
    error.code = 'EACCES';
    throw error;
  },
  
  readdirSync: (path, options) => {
    console.warn(`⚠️ fs.readdirSync called with: ${path} - returning empty array`);
    return [];
  },
  
  // Asynchronous methods - provide callback-based fallbacks
  exists: (path, callback) => {
    console.warn(`⚠️ fs.exists called with: ${path} - returning false (deprecated, use fs.existsSync or electronAPI)`);
    setTimeout(() => callback(false), 0);
  },
  
  stat: (path, callback) => {
    console.warn(`⚠️ fs.stat called with: ${path} - returning error`);
    const error = new Error('fs.stat not available in renderer process - use electronAPI');
    error.code = 'ENOENT';
    setTimeout(() => callback(error), 0);
  },
  
  readFile: (path, options, callback) => {
    if (typeof options === 'function') {
      callback = options;
      options = {};
    }
    console.warn(`⚠️ fs.readFile called with: ${path} - returning error`);
    const error = new Error('fs.readFile not available in renderer process - use electronAPI.openFile()');
    error.code = 'ENOENT';
    setTimeout(() => callback(error), 0);
  },
  
  writeFile: (path, data, options, callback) => {
    if (typeof options === 'function') {
      callback = options;
      options = {};
    }
    console.warn(`⚠️ fs.writeFile called with: ${path} - returning error`);
    const error = new Error('fs.writeFile not available in renderer process - use electronAPI.saveFile()');
    error.code = 'EACCES';
    setTimeout(() => callback(error), 0);
  },
  
  mkdir: (path, options, callback) => {
    if (typeof options === 'function') {
      callback = options;
      options = {};
    }
    console.warn(`⚠️ fs.mkdir called with: ${path} - returning error`);
    const error = new Error('fs.mkdir not available in renderer process');
    error.code = 'EACCES';
    setTimeout(() => callback(error), 0);
  },
  
  readdir: (path, options, callback) => {
    if (typeof options === 'function') {
      callback = options;
      options = {};
    }
    console.warn(`⚠️ fs.readdir called with: ${path} - returning empty array`);
    setTimeout(() => callback(null, []), 0);
  },
  
  // Constants - provide common fs constants
  constants: {
    F_OK: 0,
    R_OK: 4,
    W_OK: 2,
    X_OK: 1,
    COPYFILE_EXCL: 1,
    COPYFILE_FICLONE: 2,
    COPYFILE_FICLONE_FORCE: 4
  },
  
  // Promises API - return rejected promises
  promises: {
    access: (path, mode) => {
      console.warn(`⚠️ fs.promises.access called with: ${path} - rejecting`);
      return Promise.reject(new Error('fs.promises.access not available in renderer process'));
    },
    
    stat: (path) => {
      console.warn(`⚠️ fs.promises.stat called with: ${path} - rejecting`);
      return Promise.reject(new Error('fs.promises.stat not available in renderer process - use electronAPI'));
    },
    
    readFile: (path, options) => {
      console.warn(`⚠️ fs.promises.readFile called with: ${path} - rejecting`);
      return Promise.reject(new Error('fs.promises.readFile not available in renderer process - use electronAPI.openFile()'));
    },
    
    writeFile: (path, data, options) => {
      console.warn(`⚠️ fs.promises.writeFile called with: ${path} - rejecting`);
      return Promise.reject(new Error('fs.promises.writeFile not available in renderer process - use electronAPI.saveFile()'));
    },
    
    mkdir: (path, options) => {
      console.warn(`⚠️ fs.promises.mkdir called with: ${path} - rejecting`);
      return Promise.reject(new Error('fs.promises.mkdir not available in renderer process'));
    },
    
    readdir: (path, options) => {
      console.warn(`⚠️ fs.promises.readdir called with: ${path} - resolving with empty array`);
      return Promise.resolve([]);
    }
  }
};

// Usage instructions for developers
console.info(`
🔧 FS Mock Active in Renderer Process

Instead of fs methods, use:
- electronAPI.openFile() for reading files
- electronAPI.saveFile() for writing files  
- electronAPI.saveFileDialog() for file dialogs

This ensures security and proper Electron IPC communication.
`);

module.exports = fsMock;