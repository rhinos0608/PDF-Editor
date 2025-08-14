/**
 * PDF Utility Functions
 * Consolidated PDF-specific utilities used throughout the application
 */

import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocumentProxy } from 'pdfjs-dist/types/src/display/api';

/**
 * Enhanced PDF validation with comprehensive checks and detailed diagnostics
 */
export function validatePDFBytes(pdfBytes: Uint8Array): boolean {
  console.log('🔍 Starting PDF validation...');
  
  if (!pdfBytes) {
    console.error('❌ PDF bytes is null or undefined');
    return false;
  }
  
  if (pdfBytes.byteLength < 26) { // Minimum viable PDF size
    console.error(`❌ PDF bytes too short: ${pdfBytes.byteLength} bytes (minimum 26 required)`);
    return false;
  }
  
  try {
    // Enhanced header validation with more thorough checking
    const headerBytes = pdfBytes.slice(0, 10);
    const header = new TextDecoder('ascii', { fatal: false }).decode(headerBytes);
    
    console.log(`🔍 PDF header bytes (hex): ${Array.from(headerBytes.slice(0, 8)).map(b => b.toString(16).padStart(2, '0')).join(' ')}`);
    console.log(`🔍 PDF header string: "${header}"`);
    
    if (!header.startsWith('%PDF-')) {
      console.error(`❌ PDF header not found. Expected '%PDF-', got: "${header.slice(0, 8)}"`);
      
      // Additional diagnostics
      if (header.startsWith('\x00')) {
        console.error('❌ File appears to be empty or contains null bytes at start');
      } else if (header.includes('HTML') || header.includes('<!DOCTYPE')) {
        console.error('❌ File appears to be HTML, not PDF');
      } else if (header.includes('PK\x03\x04')) {
        console.error('❌ File appears to be ZIP archive, not PDF');
      } else {
        console.error(`❌ Unknown file format detected: ${header.slice(0, 8)}`);
      }
      
      return false;
    }
    
    // Validate PDF version
    const version = header.slice(5, 8);
    const validVersions = ['1.0', '1.1', '1.2', '1.3', '1.4', '1.5', '1.6', '1.7', '2.0'];
    if (!validVersions.includes(version)) {
      console.warn(`⚠️ Unusual PDF version: ${version} (might still be valid)`);
    } else {
      console.log(`✅ PDF version validated: ${version}`);
    }
    
    // Enhanced EOF marker validation
    const searchLength = Math.min(pdfBytes.byteLength, 2048);
    const tailBytes = pdfBytes.slice(-searchLength);
    const tail = new TextDecoder('ascii', { fatal: false }).decode(tailBytes);
    
    if (!tail.includes('%%EOF')) {
      console.warn('⚠️ PDF EOF marker (%%EOF) not found in last 2KB');
      
      // Try to find it in a larger section for very small files
      if (pdfBytes.byteLength <= 2048) {
        const entireFile = new TextDecoder('ascii', { fatal: false }).decode(pdfBytes);
        if (!entireFile.includes('%%EOF')) {
          console.error('❌ PDF EOF marker not found anywhere in file');
          return false;
        } else {
          console.log('✅ PDF EOF marker found in file (not in tail)');
        }
      } else {
        console.warn('⚠️ Proceeding despite missing EOF marker (file might still be valid)');
      }
    } else {
      console.log('✅ PDF EOF marker validated');
    }
    
    console.log(`✅ PDF validation passed: ${pdfBytes.byteLength} bytes, version ${version}`);
    return true;
    
  } catch (error) {
    console.error('❌ PDF validation failed with error:', (error as Error).message);
    console.error('❌ Error stack:', (error as Error).stack);
    return false;
  }
}

/**
 * Create safe PDF bytes with multiple fallback strategies
 */
export function createSafePDFBytes(data: Uint8Array): Uint8Array {
  if (!data || data.byteLength === 0) {
    throw new Error('Cannot create safe copy of null/undefined/empty PDF bytes');
  }

  try {
    console.log('🔧 Creating safe PDF bytes...');
    
    // Strategy 1: Use Uint8Array.from (most robust)
    const safeBytes = Uint8Array.from(data);
    console.log(`✅ Safe PDF bytes created: ${safeBytes.byteLength} bytes`);
    return safeBytes;
    
  } catch (error) {
    console.warn('⚠️ Primary safe copy method failed, trying fallback');
    
    // Strategy 2: Manual byte copying as fallback
    const safeBytes = new Uint8Array(data.byteLength);
    for (let i = 0; i < data.byteLength; i++) {
      safeBytes[i] = data[i] !== undefined ? data[i] : 0;
    }
    
    console.log(`✅ Safe PDF bytes created via fallback: ${safeBytes.byteLength} bytes`);
    return safeBytes;
  }
}

/**
 * Create safe ArrayBuffer with detachment prevention for Electron IPC
 * This is the CRITICAL fix for ArrayBuffer detachment issues in Electron IPC
 */
export function createSafeArrayBuffer(uint8Array: Uint8Array): ArrayBuffer {
  if (!uint8Array || uint8Array.length === 0) {
    throw new Error('Empty or null Uint8Array provided');
  }

  console.log('🔧 Creating detachment-safe ArrayBuffer...');
  console.log(`🔧 Input Uint8Array: ${uint8Array.byteLength} bytes`);
  
  // CRITICAL: Validate PDF data before converting to ArrayBuffer
  if (!validatePDFBytes(uint8Array)) {
    throw new Error('Invalid PDF data: Failed header validation before ArrayBuffer conversion');
  }

  try {
    // ELECTRON IPC FIX: Always create a completely new ArrayBuffer to prevent detachment
    // The original buffer might get detached during IPC transfer, so we MUST create a new one
    console.log('🔧 Creating new ArrayBuffer to prevent Electron IPC detachment');
    const buffer = new ArrayBuffer(uint8Array.byteLength);
    const view = new Uint8Array(buffer);
    
    // Use the most reliable copy method for Electron
    if (uint8Array.set && typeof uint8Array.set === 'function') {
      try {
        view.set(uint8Array);
        console.log('✅ ArrayBuffer created using view.set() method');
      } catch (setError) {
        console.warn('⚠️ view.set() failed, using manual copy fallback');
        // Manual copy as absolute fallback
        for (let i = 0; i < uint8Array.length; i++) {
          view[i] = uint8Array[i];
        }
        console.log('✅ ArrayBuffer created using manual copy fallback');
      }
    } else {
      // Direct manual copy if set() is not available
      for (let i = 0; i < uint8Array.length; i++) {
        view[i] = uint8Array[i];
      }
      console.log('✅ ArrayBuffer created using direct manual copy');
    }
    
    // Critical verification that the copy succeeded
    if (view.byteLength !== uint8Array.byteLength) {
      throw new Error(`ArrayBuffer size mismatch: expected ${uint8Array.byteLength}, got ${view.byteLength}`);
    }
    
    // Verify first few bytes to ensure copy integrity
    for (let i = 0; i < Math.min(10, uint8Array.length); i++) {
      if (view[i] !== uint8Array[i]) {
        throw new Error(`ArrayBuffer copy corruption detected at byte ${i}`);
      }
    }
    
    // Final PDF validation of the new buffer
    const finalView = new Uint8Array(buffer);
    if (!validatePDFBytes(finalView)) {
      throw new Error('ArrayBuffer creation corrupted PDF data - failed final validation');
    }
    
    console.log(`✅ Detachment-safe ArrayBuffer created and verified: ${buffer.byteLength} bytes`);
    
    // Return the new buffer that owns its memory and won't be detached
    return buffer;
    
  } catch (error) {
    console.error('❌ Failed to create safe ArrayBuffer:', (error as Error).message);
    throw new Error(`ArrayBuffer creation failed: ${(error as Error).message}`);
  }
}

/**
 * Safe PDF loading function that handles ArrayBuffer detachment
 */
export async function loadPDFSafely(data: Uint8Array, options?: any): Promise<PDFDocumentProxy> {
  try {
    // Ensure we have valid PDF data
    if (!validatePDFBytes(data)) {
      throw new Error('Invalid PDF data provided');
    }
    
    // Create a safe copy to prevent detachment
    const safeBytes = createSafePDFBytes(data);
    
    // Configure loading options with safe defaults
    const loadingOptions = {
      data: safeBytes,
      useWorkerFetch: false, // Disable to prevent worker conflicts
      isEvalSupported: false,
      useSystemFonts: true,
      cMapUrl: './cmaps/',
      cMapPacked: true,
      ...options
    };
    
    console.log('🔄 Loading PDF with safe configuration...');
    
    // Import PDF.js dynamically to ensure worker is configured
    const pdfjsLibModule = await import('pdfjs-dist');
    
    const loadingTask = pdfjsLibModule.getDocument(loadingOptions);
    
    // Add progress tracking
    loadingTask.onProgress = (progress) => {
      if (progress.total > 0) {
        const percent = Math.round((progress.loaded / progress.total) * 100);
        console.log(`📄 Loading PDF: ${percent}%`);
      }
    };
    
    const pdf = await loadingTask.promise;
    console.log(`✅ PDF loaded successfully: ${pdf.numPages} pages`);
    
    return pdf;
    
  } catch (error) {
    console.error('❌ Failed to load PDF safely:', (error as Error).message);
    throw new Error(`PDF loading failed: ${(error as Error).message}`);
  }
}