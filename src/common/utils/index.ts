/**
 * Enhanced Common Utilities for Professional PDF Editor
 * Provides robust PDF handling, validation, and error recovery
 */

import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocumentProxy } from 'pdfjs-dist/types/src/display/api';

// PDF validation constants
const PDF_HEADER_SIGNATURES = [
  '%PDF-1.0', '%PDF-1.1', '%PDF-1.2', '%PDF-1.3', '%PDF-1.4',
  '%PDF-1.5', '%PDF-1.6', '%PDF-1.7', '%PDF-2.0'
];

const PDF_FOOTER_SIGNATURES = ['%%EOF', 'endobj', 'xref'];

/**
 * Enhanced PDF bytes validation with comprehensive checks
 */
export function validatePDFBytes(pdfBytes: Uint8Array | ArrayBuffer): boolean {
  try {
    if (!pdfBytes) {
      console.warn('PDF validation failed: null or undefined data');
      return false;
    }

    // Convert ArrayBuffer to Uint8Array if needed
    const bytes = pdfBytes instanceof ArrayBuffer ? new Uint8Array(pdfBytes) : pdfBytes;
    
    if (bytes.length === 0) {
      console.warn('PDF validation failed: empty data');
      return false;
    }

    // Minimum PDF size check (a valid PDF should be at least 100 bytes)
    if (bytes.length < 100) {
      console.warn('PDF validation failed: file too small');
      return false;
    }

    // Check PDF header
    const headerBytes = bytes.slice(0, 20);
    const headerString = new TextDecoder('ascii', { fatal: false }).decode(headerBytes);
    
    const hasValidHeader = PDF_HEADER_SIGNATURES.some(signature => 
      headerString.startsWith(signature)
    );
    
    if (!hasValidHeader) {
      console.warn('PDF validation failed: invalid header');
      return false;
    }

    // Check PDF footer (look in last 1024 bytes)
    const footerSearchSize = Math.min(1024, bytes.length);
    const footerBytes = bytes.slice(-footerSearchSize);
    const footerString = new TextDecoder('ascii', { fatal: false }).decode(footerBytes);
    
    const hasValidFooter = PDF_FOOTER_SIGNATURES.some(signature => 
      footerString.includes(signature)
    );
    
    if (!hasValidFooter) {
      console.warn('PDF validation failed: invalid footer');
      return false;
    }

    // Additional structural checks
    const pdfString = new TextDecoder('ascii', { fatal: false }).decode(bytes);
    
    // Check for essential PDF objects
    if (!pdfString.includes('obj') || !pdfString.includes('endobj')) {
      console.warn('PDF validation failed: missing essential objects');
      return false;
    }

    console.log('✅ PDF validation passed');
    return true;
  } catch (error) {
    console.error('PDF validation error:', error);
    return false;
  }
}

/**
 * Create a safe, detachment-resistant copy of PDF bytes
 */
export function createSafePDFBytes(originalBytes: Uint8Array | ArrayBuffer): Uint8Array {
  try {
    if (!originalBytes) {
      throw new Error('Cannot create safe copy of null/undefined PDF bytes');
    }

    // Convert ArrayBuffer to Uint8Array if needed
    const sourceBytes = originalBytes instanceof ArrayBuffer 
      ? new Uint8Array(originalBytes) 
      : originalBytes;

    if (sourceBytes.length === 0) {
      throw new Error('Cannot create safe copy of empty PDF bytes');
    }

    // Create multiple safe copies using different methods for maximum reliability
    let safeCopy: Uint8Array;

    try {
      // Method 1: Uint8Array.from() - most reliable
      safeCopy = Uint8Array.from(sourceBytes);
      console.log(`✅ Safe PDF copy created using Uint8Array.from (${safeCopy.length} bytes)`);
    } catch (fromError) {
      console.warn('⚠️ Uint8Array.from failed, trying alternative method:', fromError);
      
      try {
        // Method 2: new Uint8Array with set()
        safeCopy = new Uint8Array(sourceBytes.length);
        safeCopy.set(sourceBytes);
        console.log(`✅ Safe PDF copy created using set() method (${safeCopy.length} bytes)`);
      } catch (setError) {
        console.warn('⚠️ set() method failed, using manual copy:', setError);
        
        // Method 3: Manual byte-by-byte copy (most reliable fallback)
        safeCopy = new Uint8Array(sourceBytes.length);
        for (let i = 0; i < sourceBytes.length; i++) {
          safeCopy[i] = sourceBytes[i];
        }
        console.log(`✅ Safe PDF copy created using manual copy (${safeCopy.length} bytes)`);
      }
    }

    // Verify the copy integrity
    if (safeCopy.length !== sourceBytes.length) {
      throw new Error('Safe copy length mismatch');
    }

    // Sample verification (check first and last 100 bytes)
    const sampleSize = Math.min(100, sourceBytes.length);
    for (let i = 0; i < sampleSize; i++) {
      if (safeCopy[i] !== sourceBytes[i]) {
        throw new Error(`Byte integrity check failed at position ${i}`);
      }
    }

    // Check last bytes
    for (let i = Math.max(0, sourceBytes.length - sampleSize); i < sourceBytes.length; i++) {
      if (safeCopy[i] !== sourceBytes[i]) {
        throw new Error(`Byte integrity check failed at position ${i}`);
      }
    }

    return safeCopy;
  } catch (error) {
    console.error('❌ Failed to create safe PDF copy:', error);
    throw error;
  }
}

/**
 * Utility to check if we're running in Electron
 */
export function isElectron(): boolean {
  return typeof window !== 'undefined' && (window as any).electronAPI !== undefined;
}

/**
 * Utility to check if we're in development mode
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development';
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Generate unique ID
 */
export function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Debounce function for performance optimization
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Safely load PDF with enhanced error handling and recovery
 */
export async function loadPDFSafely(
  data: Uint8Array | ArrayBuffer,
  options: any = {}
): Promise<PDFDocumentProxy> {
  const maxRetries = 3;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`📄 PDF loading attempt ${attempt}/${maxRetries}`);

      // Create safe copy to prevent detachment issues
      const safeBytes = createSafePDFBytes(data);

      // Enhanced loading options
      const loadingOptions = {
        data: safeBytes,
        cMapUrl: '/cmaps/',
        cMapPacked: true,
        standardFontDataUrl: '/fonts/',
        useSystemFonts: false,
        disableFontFace: false,
        disableRange: false,
        disableStream: false,
        disableAutoFetch: false,
        pdfBug: false,
        maxImageSize: 16777216, // 16MB
        isEvalSupported: false,
        verbosity: 0, // Reduce console noise
        ...options
      };

      const loadingTask = pdfjsLib.getDocument(loadingOptions);
      
      // Set up progress tracking if available
      if (loadingTask.onProgress) {
        loadingTask.onProgress = (progress: any) => {
          console.log(`📊 PDF loading progress: ${Math.round((progress.loaded / progress.total) * 100)}%`);
        };
      }

      const pdf = await loadingTask.promise;
      
      console.log(`✅ PDF loaded successfully: ${pdf.numPages} pages`);
      return pdf;

    } catch (error) {
      lastError = error as Error;
      console.error(`❌ PDF loading attempt ${attempt} failed:`, lastError.message);

      // If this is not the last attempt, wait before retrying
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
        console.log(`⏳ Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  // All attempts failed
  const errorMessage = `Failed to load PDF after ${maxRetries} attempts: ${lastError?.message || 'Unknown error'}`;
  console.error('❌ All PDF loading attempts failed:', errorMessage);
  throw new Error(errorMessage);
}

/**
 * Deep clone utility
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime()) as any;
  if (obj instanceof Array) return obj.map(item => deepClone(item)) as any;
  if (typeof obj === 'object') {
    const clonedObj = {} as any;
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key]);
      }
    }
    return clonedObj;
  }
  return obj;
}