import { Buffer } from 'buffer';

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export function isValidPath(filePath: string): ValidationResult {
  if (typeof filePath !== 'string') {
    return { isValid: false, error: 'Path must be a string' };
  }
  
  try {
    // Basic path validation
    if (filePath.length === 0) {
      return { isValid: false, error: 'Path cannot be empty' };
    }
    
    // Check for null bytes (indicates potential path traversal)
    if (filePath.includes('\0')) {
      return { isValid: false, error: 'Invalid path: null bytes not allowed' };
    }
    
    // Check for common path traversal patterns
    const normalizedPath = filePath.replace(/\\/g, '/');
    if (normalizedPath.includes('../') || normalizedPath.includes('..\\')) {
      return { isValid: false, error: 'Path traversal is not allowed' };
    }
    
    return { isValid: true };
  } catch (error) {
    return { 
      isValid: false, 
      error: `Path validation failed: ${error.message}` 
    };
  }
}

export function sanitizePath(filePath: string): string {
  if (typeof filePath !== 'string') {
    return '';
  }
  
  // Remove null bytes
  let sanitized = filePath.replace(/\0/g, '');
  
  // Replace path separators with the system's path separator
  sanitized = sanitized.replace(/[\\/]+/g, path.sep);
  
  // Remove any remaining control characters
  sanitized = sanitized.replace(/[\x00-\x1F\x7F-\x9F]/g, '');
  
  return sanitized;
}

export function isValidArrayBuffer(buffer: unknown): buffer is ArrayBufferLike {
  return (
    buffer instanceof ArrayBuffer ||
    ArrayBuffer.isView(buffer) ||
    buffer instanceof SharedArrayBuffer ||
    buffer instanceof Uint8Array ||
    buffer instanceof DataView ||
    (typeof buffer === 'object' && 
     buffer !== null && 
     'byteLength' in (buffer as object) &&
     'slice' in (buffer as object))
  );
}

export interface Preferences {
  theme?: string;
  autoSave?: boolean;
  autoSaveInterval?: number;
  defaultZoom?: number;
  showThumbnails?: boolean;
  highlightColor?: string;
  defaultFont?: string;
  viewMode?: string;
  recentFilesLimit?: number;
  enableShortcuts?: boolean;
  enableAnimations?: boolean;
  compressionQuality?: 'low' | 'medium' | 'high';
}

export function isValidPreferences(prefs: unknown): prefs is Preferences {
  if (typeof prefs !== 'object' || prefs === null) {
    return false;
  }
  
  const preferences = prefs as Preferences;
  
  // Validate autoSaveInterval if autoSave is true
  if (preferences.autoSave === true) {
    if (typeof preferences.autoSaveInterval !== 'number' || 
        preferences.autoSaveInterval < 1000 || 
        preferences.autoSaveInterval > 3600000) {
      return false;
    }
  }
  
  // Validate defaultZoom
  if (preferences.defaultZoom !== undefined && 
      (typeof preferences.defaultZoom !== 'number' || 
       preferences.defaultZoom < 25 || 
       preferences.defaultZoom > 400)) {
    return false;
  }
  
  // Validate compressionQuality
  if (preferences.compressionQuality && 
      !['low', 'medium', 'high'].includes(preferences.compressionQuality)) {
    return false;
  }
  
  return true;
}

// Helper function to validate file data before saving
export async function validateFileData(
  data: unknown, 
  maxSizeMB: number = 100
): Promise<ValidationResult> {
  if (!isValidArrayBuffer(data)) {
    return { 
      isValid: false, 
      error: 'Invalid file data: Expected ArrayBuffer or similar' 
    };
  }
  
  const byteLength = data.byteLength || (data as any).length || 0;
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  
  if (byteLength > maxSizeBytes) {
    return { 
      isValid: false, 
      error: `File size exceeds maximum allowed size of ${maxSizeMB}MB` 
    };
  }
  
  // Basic PDF validation (check for PDF header)
  if (byteLength > 4) {
    try {
      const header = Buffer.from(data).slice(0, 4).toString('utf-8');
      if (header !== '%PDF') {
        return { 
          isValid: false, 
          error: 'Invalid PDF file: Missing PDF header' 
        };
      }
    } catch (error) {
      return { 
        isValid: false, 
        error: `Error validating PDF: ${error.message}` 
      };
    }
  }
  
  return { isValid: true };
}

// Export all validation functions
export default {
  isValidPath,
  sanitizePath,
  isValidArrayBuffer,
  isValidPreferences,
  validateFileData
};
