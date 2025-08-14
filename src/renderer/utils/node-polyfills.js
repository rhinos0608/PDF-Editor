/**
 * Node.js Polyfills and Security Warnings for Renderer Process
 * 
 * This module helps identify and prevent improper Node.js module usage
 * in the renderer process while providing safe alternatives.
 */

// Track Node.js module access for debugging
const nodeModuleAccess = new Map();

// Helper function to log and track Node.js module access
function logNodeModuleAccess(moduleName, method, recommendation) {
  const key = `${moduleName}.${method}`;
  const count = nodeModuleAccess.get(key) || 0;
  nodeModuleAccess.set(key, count + 1);
  
  console.warn(`⚠️ [SECURITY] Node.js module access: ${key} (${count + 1} times)`);
  if (recommendation) {
    console.info(`💡 Recommendation: ${recommendation}`);
  }
}

// Export function to get access statistics
export function getNodeModuleAccessStats() {
  return Array.from(nodeModuleAccess.entries()).map(([key, count]) => ({
    module: key,
    accessCount: count
  }));
}

// Function to check if we're in a secure renderer environment
export function checkRendererSecurity() {
  const checks = {
    contextIsolation: typeof window.electronAPI !== 'undefined',
    nodeIntegration: typeof require === 'undefined',
    webSecurity: !window.process || !window.process.versions?.node,
    electronAPI: typeof window.electronAPI === 'object'
  };
  
  const securityScore = Object.values(checks).filter(Boolean).length;
  const totalChecks = Object.keys(checks).length;
  
  console.log('🔒 Renderer Security Check:', {
    ...checks,
    securityScore: `${securityScore}/${totalChecks}`,
    secure: securityScore === totalChecks
  });
  
  return {
    checks,
    securityScore,
    totalChecks,
    isSecure: securityScore === totalChecks
  };
}

// Enhanced error handler for Node.js module access
export function createNodeModuleError(moduleName, method, recommendation) {
  logNodeModuleAccess(moduleName, method, recommendation);
  
  const error = new Error(
    `${moduleName}.${method} is not available in renderer process. ${recommendation || 'Use electronAPI for file operations.'}`
  );
  error.code = 'RENDERER_NODE_ACCESS';
  error.module = moduleName;
  error.method = method;
  
  return error;
}

// Safe alternatives for common Node.js operations
export const safeAlternatives = {
  // File operations
  readFile: () => {
    throw createNodeModuleError(
      'fs', 
      'readFile', 
      'Use electronAPI.openFile() for secure file reading'
    );
  },
  
  writeFile: () => {
    throw createNodeModuleError(
      'fs', 
      'writeFile', 
      'Use electronAPI.saveFile() for secure file writing'
    );
  },
  
  existsSync: (path) => {
    logNodeModuleAccess('fs', 'existsSync', 'Use electronAPI for file system operations');
    return false; // Safe default
  },
  
  // Path operations - use browser-compatible alternatives
  join: (...paths) => {
    logNodeModuleAccess('path', 'join', 'Use URL constructor or string concatenation');
    return paths.filter(Boolean).join('/').replace(/\/+/g, '/');
  },
  
  resolve: (...paths) => {
    logNodeModuleAccess('path', 'resolve', 'Use absolute URLs in browser environment');
    return safeAlternatives.join('/', ...paths);
  },
  
  dirname: (path) => {
    logNodeModuleAccess('path', 'dirname', 'Use URL constructor or string manipulation');
    return path.split('/').slice(0, -1).join('/') || '/';
  },
  
  basename: (path) => {
    logNodeModuleAccess('path', 'basename', 'Use URL constructor or string manipulation');
    return path.split('/').pop() || '';
  },
  
  // OS operations - use browser APIs
  platform: () => {
    logNodeModuleAccess('os', 'platform', 'Use navigator.platform');
    return navigator.platform.toLowerCase().includes('win') ? 'win32' : 
           navigator.platform.toLowerCase().includes('mac') ? 'darwin' : 'linux';
  },
  
  arch: () => {
    logNodeModuleAccess('os', 'arch', 'Use navigator.userAgent');
    return navigator.userAgent.includes('x64') ? 'x64' : 'x86';
  },
  
  // Crypto operations - use Web Crypto API
  randomBytes: (size) => {
    logNodeModuleAccess('crypto', 'randomBytes', 'Use window.crypto.getRandomValues()');
    const array = new Uint8Array(size);
    window.crypto.getRandomValues(array);
    return array;
  }
};

// Initialize security check on module load
if (typeof window !== 'undefined') {
  // Run security check after DOM loads
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkRendererSecurity);
  } else {
    checkRendererSecurity();
  }
  
  // Expose debugging utilities to window for development
  if (process.env.NODE_ENV === 'development') {
    window.__nodePolyfillDebug = {
      getStats: getNodeModuleAccessStats,
      checkSecurity: checkRendererSecurity,
      alternatives: safeAlternatives
    };
    
    console.info(`
🔧 Node.js Polyfill Debug Active

Access debug utilities:
- window.__nodePolyfillDebug.getStats() - View module access statistics
- window.__nodePolyfillDebug.checkSecurity() - Check renderer security
- window.__nodePolyfillDebug.alternatives - Safe alternatives to Node.js modules

This helps identify and fix Node.js module usage in renderer process.
    `);
  }
}

export default {
  getNodeModuleAccessStats,
  checkRendererSecurity,
  createNodeModuleError,
  safeAlternatives
};