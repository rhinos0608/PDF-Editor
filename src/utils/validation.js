/**
 * Utility functions for input validation
 */

// Valid menu actions
const VALID_MENU_ACTIONS = [
  'menu-open', 'menu-save', 'menu-save-as', 'menu-print',
  'menu-zoom-in', 'menu-zoom-out', 'menu-zoom-reset',
  'menu-fit-width', 'menu-fit-page',
  'menu-rotate-left', 'menu-rotate-right',
  'menu-toggle-theme', 'menu-find',
  'menu-insert-page', 'menu-delete-page',
  'menu-merge-pdfs', 'menu-split-pdf',
  'menu-compress', 'menu-ocr',
  'menu-encrypt', 'menu-decrypt',
  'menu-tool-text', 'menu-tool-highlight',
  'menu-tool-draw', 'menu-tool-shapes',
  'menu-tool-stamp', 'menu-tool-signature'
];

/**
 * Validate file path
 * @param {string} path - File path to validate
 * @returns {boolean} - True if valid, false otherwise
 */
export function isValidPath(path) {
  if (!path || typeof path !== 'string') return false;
  // Prevent path traversal attacks
  if (path.includes('..') || path.includes('~')) return false;
  // Allow PDF files and common image formats for import
  return /\.(pdf|txt|doc|docx|jpg|jpeg|png|gif|bmp|tiff|tif)$/i.test(path);
}

/**
 * Sanitize file path
 * @param {string} path - File path to sanitize
 * @returns {string} - Sanitized path
 */
export function sanitizePath(path) {
  return path.replace(/[^\w\s\-\.\/\:]/g, '');
}

/**
 * Validate ArrayBuffer or Buffer
 * @param {*} data - Data to validate
 * @returns {boolean} - True if valid, false otherwise
 */
export function isValidArrayBuffer(data) {
  // Handle both ArrayBuffer and Buffer (which Electron IPC converts to)
  if (data instanceof ArrayBuffer) {
    return data.byteLength > 0 && data.byteLength < 100 * 1024 * 1024; // Max 100MB
  }
  if (Buffer.isBuffer(data)) {
    return data.length > 0 && data.length < 100 * 1024 * 1024; // Max 100MB
  }
  return false;
}

/**
 * Validate menu action
 * @param {string} action - Menu action to validate
 * @returns {boolean} - True if valid, false otherwise
 */
export function isValidMenuAction(action) {
  return VALID_MENU_ACTIONS.includes(action);
}

/**
 * Validate preferences object
 * @param {*} preferences - Preferences object to validate
 * @returns {boolean} - True if valid, false otherwise
 */
export function isValidPreferences(preferences) {
  if (!preferences || typeof preferences !== 'object') {
    return false;
  }
  
  // Validate specific fields
  if (preferences.theme && !['dark', 'light'].includes(preferences.theme)) {
    return false;
  }
  
  if (preferences.autoSave !== undefined && typeof preferences.autoSave !== 'boolean') {
    return false;
  }
  
  if (preferences.autoSaveInterval !== undefined) {
    const interval = Number(preferences.autoSaveInterval);
    if (!Number.isInteger(interval) || interval < 1 || interval > 60) {
      return false;
    }
  }
  
  if (preferences.language && !/^[a-z]{2}(-[A-Z]{2})?$/.test(preferences.language)) {
    return false;
  }
  
  if (preferences.defaultZoom !== undefined) {
    const zoom = Number(preferences.defaultZoom);
    if (!Number.isInteger(zoom) || zoom < 25 || zoom > 500) {
      return false;
    }
  }
  
  if (preferences.highlightColor && !/^#[0-9A-Fa-f]{6}$/.test(preferences.highlightColor)) {
    return false;
  }
  
  if (preferences.defaultFont) {
    // Sanitize font name
    const fontName = preferences.defaultFont.replace(/[^\w\s-]/g, '');
    if (fontName.length > 50) {
      return false;
    }
  }
  
  return true;
}