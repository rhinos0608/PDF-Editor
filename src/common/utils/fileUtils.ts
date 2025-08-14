/**
 * File Utility Functions
 * Consolidated file handling utilities used throughout the application
 */

/**
 * Common file extensions and their MIME types
 */
export const MIME_TYPES = {
  // Documents
  'pdf': 'application/pdf',
  'doc': 'application/msword',
  'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'txt': 'text/plain',
  'rtf': 'application/rtf',
  
  // Images
  'jpg': 'image/jpeg',
  'jpeg': 'image/jpeg',
  'png': 'image/png',
  'gif': 'image/gif',
  'svg': 'image/svg+xml',
  'webp': 'image/webp',
  'bmp': 'image/bmp',
  'tiff': 'image/tiff',
  
  // Archives
  'zip': 'application/zip',
  'rar': 'application/vnd.rar',
  '7z': 'application/x-7z-compressed',
  'tar': 'application/x-tar',
  'gz': 'application/gzip',
  
  // Other
  'json': 'application/json',
  'xml': 'application/xml',
  'csv': 'text/csv'
} as const;

/**
 * Get file extension from filename
 */
export function getFileExtension(filename: string): string {
  const lastDot = filename.lastIndexOf('.');
  return lastDot === -1 ? '' : filename.slice(lastDot + 1).toLowerCase();
}

/**
 * Get filename without extension
 */
export function getFileNameWithoutExtension(filename: string): string {
  const lastDot = filename.lastIndexOf('.');
  return lastDot === -1 ? filename : filename.slice(0, lastDot);
}

/**
 * Get MIME type from file extension
 */
export function getMimeType(filename: string): string {
  const extension = getFileExtension(filename);
  return MIME_TYPES[extension as keyof typeof MIME_TYPES] || 'application/octet-stream';
}

/**
 * Check if file is PDF
 */
export function isPdfFile(filename: string): boolean {
  return getFileExtension(filename) === 'pdf';
}

/**
 * Check if file is an image
 */
export function isImageFile(filename: string): boolean {
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'bmp', 'tiff'];
  return imageExtensions.includes(getFileExtension(filename));
}

/**
 * Check if file is a document
 */
export function isDocumentFile(filename: string): boolean {
  const documentExtensions = ['pdf', 'doc', 'docx', 'txt', 'rtf'];
  return documentExtensions.includes(getFileExtension(filename));
}

/**
 * Format file size in human readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Generate unique filename to avoid conflicts
 */
export function generateUniqueFilename(originalName: string, existingFiles: string[]): string {
  let filename = originalName;
  let counter = 1;
  
  while (existingFiles.includes(filename)) {
    const nameWithoutExt = getFileNameWithoutExtension(originalName);
    const extension = getFileExtension(originalName);
    filename = `${nameWithoutExt} (${counter})${extension ? '.' + extension : ''}`;
    counter++;
  }
  
  return filename;
}

/**
 * Validate file name for filesystem compatibility
 */
export function isValidFilename(filename: string): boolean {
  // Check for empty or whitespace-only names
  if (!filename.trim()) {
    return false;
  }
  
  // Check for invalid characters (Windows/Linux/macOS)
  const invalidChars = /[<>:"/\\|?*\x00-\x1f]/;
  if (invalidChars.test(filename)) {
    return false;
  }
  
  // Check for reserved names (Windows)
  const reservedNames = [
    'CON', 'PRN', 'AUX', 'NUL',
    'COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8', 'COM9',
    'LPT1', 'LPT2', 'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9'
  ];
  
  const nameWithoutExt = getFileNameWithoutExtension(filename).toUpperCase();
  if (reservedNames.includes(nameWithoutExt)) {
    return false;
  }
  
  // Check length (most filesystems support 255 characters)
  if (filename.length > 255) {
    return false;
  }
  
  return true;
}

/**
 * Create safe filename from potentially unsafe string
 */
export function createSafeFilename(unsafeFilename: string, defaultExtension?: string): string {
  // Replace invalid characters with underscores
  let safeFilename = unsafeFilename
    .replace(/[<>:"/\\|?*\x00-\x1f]/g, '_')
    .replace(/\s+/g, '_')
    .replace(/_{2,}/g, '_')
    .replace(/^_+|_+$/g, '');
  
  // Handle empty names
  if (!safeFilename) {
    safeFilename = 'untitled';
  }
  
  // Add extension if provided and not already present
  if (defaultExtension && !getFileExtension(safeFilename)) {
    safeFilename += `.${defaultExtension}`;
  }
  
  // Truncate if too long
  if (safeFilename.length > 255) {
    const extension = getFileExtension(safeFilename);
    const maxNameLength = 255 - (extension ? extension.length + 1 : 0);
    const nameWithoutExt = getFileNameWithoutExtension(safeFilename);
    safeFilename = nameWithoutExt.substring(0, maxNameLength) + (extension ? '.' + extension : '');
  }
  
  return safeFilename;
}

/**
 * Extract filename from file path
 */
export function getFilenameFromPath(filePath: string): string {
  return filePath.split(/[/\\]/).pop() || '';
}

/**
 * Extract directory from file path
 */
export function getDirectoryFromPath(filePath: string): string {
  const parts = filePath.split(/[/\\]/);
  parts.pop();
  return parts.join('/') || '/';
}

/**
 * Join file paths safely
 */
export function joinPaths(...paths: string[]): string {
  return paths
    .filter(path => path && path.trim())
    .map((path, index) => {
      // Remove leading slashes from all paths except the first
      if (index > 0) {
        path = path.replace(/^[/\\]+/, '');
      }
      // Remove trailing slashes from all paths except the last
      if (index < paths.length - 1) {
        path = path.replace(/[/\\]+$/, '');
      }
      return path;
    })
    .join('/');
}

/**
 * Check if path is absolute
 */
export function isAbsolutePath(path: string): boolean {
  // Unix/Linux/macOS absolute path
  if (path.startsWith('/')) {
    return true;
  }
  
  // Windows absolute path (C:\, D:\, etc.)
  if (/^[a-zA-Z]:[/\\]/.test(path)) {
    return true;
  }
  
  // UNC path (\\server\share)
  if (path.startsWith('\\\\')) {
    return true;
  }
  
  return false;
}

/**
 * Normalize path separators for current platform
 */
export function normalizePath(path: string): string {
  // Use forward slashes for web compatibility
  return path.replace(/\\/g, '/');
}

/**
 * Check if file extension matches allowed types
 */
export function hasAllowedExtension(filename: string, allowedExtensions: string[]): boolean {
  const extension = getFileExtension(filename);
  return allowedExtensions.map(ext => ext.toLowerCase()).includes(extension);
}

/**
 * Create file filter for file dialogs
 */
export function createFileFilter(name: string, extensions: string[]): { name: string; extensions: string[] } {
  return {
    name,
    extensions: extensions.map(ext => ext.replace(/^\./, '')) // Remove leading dot if present
  };
}

/**
 * Common file filters for dialogs
 */
export const FILE_FILTERS = {
  PDF: createFileFilter('PDF Files', ['pdf']),
  IMAGES: createFileFilter('Image Files', ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'tiff', 'webp']),
  DOCUMENTS: createFileFilter('Document Files', ['pdf', 'doc', 'docx', 'txt', 'rtf']),
  ALL: createFileFilter('All Files', ['*'])
};

/**
 * Get recent files list management utilities
 */
export class RecentFilesManager {
  private readonly maxRecentFiles: number;
  
  constructor(maxRecentFiles: number = 10) {
    this.maxRecentFiles = maxRecentFiles;
  }
  
  addRecentFile(filePath: string, recentFiles: string[]): string[] {
    // Remove if already exists
    const filtered = recentFiles.filter(file => file !== filePath);
    
    // Add to beginning
    const updated = [filePath, ...filtered];
    
    // Limit to max files
    return updated.slice(0, this.maxRecentFiles);
  }
  
  removeRecentFile(filePath: string, recentFiles: string[]): string[] {
    return recentFiles.filter(file => file !== filePath);
  }
  
  cleanupRecentFiles(recentFiles: string[]): string[] {
    // Here you could add file existence checks if needed
    return recentFiles.filter(file => file && file.trim());
  }
}