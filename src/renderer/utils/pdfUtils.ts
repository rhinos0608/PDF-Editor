/**
 * PDF Utility functions to handle common PDF operations safely
 * Enhanced with multiple fallback strategies for ArrayBuffer detachment issues
 */

/**
 * Creates a safe copy of PDF bytes to prevent ArrayBuffer detachment issues
 * Uses multiple strategies for maximum compatibility and reliability
 */
export function createSafePDFBytes(originalBytes: Uint8Array): Uint8Array {
  if (!originalBytes) {
    throw new Error('No PDF bytes provided');
  }
  
  // Strategy 1: Check if buffer is detached and handle appropriately
  try {
    // Test if the buffer is accessible by reading first byte
    const testAccess = originalBytes[0];
    
    if (originalBytes.byteLength === 0) {
      throw new Error('Buffer appears to be detached (zero length)');
    }
    
    // Method 1: Use Uint8Array.from for safe copying (most robust)
    const safeBytes = Uint8Array.from(originalBytes);
    
    // Verify the copy is valid
    if (safeBytes.byteLength === originalBytes.byteLength && safeBytes.byteLength > 0) {
      console.log(`✅ Safe PDF bytes created successfully (${safeBytes.byteLength} bytes)`);
      return safeBytes;
    }
    
    throw new Error('Copy verification failed');
    
  } catch (error) {
    console.warn('⚠️ Primary copy method failed, trying fallback:', error.message);
    
    // Strategy 2: Manual byte copying (fallback for detached buffers)
    try {
      const length = originalBytes.length || originalBytes.byteLength;
      if (length === 0) {
        throw new Error('Cannot determine buffer size');
      }
      
      const safeBytes = new Uint8Array(length);
      
      // Copy byte by byte with error handling
      for (let i = 0; i < length; i++) {
        try {
          safeBytes[i] = originalBytes[i] !== undefined ? originalBytes[i] : 0;
        } catch (accessError) {
          console.warn(`⚠️ Byte ${i} inaccessible, setting to 0`);
          safeBytes[i] = 0;
        }
      }
      
      console.log(`✅ Fallback PDF bytes created (${safeBytes.byteLength} bytes)`);
      return safeBytes;
      
    } catch (fallbackError) {
      console.error('❌ All safe copy methods failed:', fallbackError);
      throw new Error(`Cannot create safe PDF bytes: ${fallbackError.message}`);
    }
  }
}

/**
 * Creates a safe ArrayBuffer from Uint8Array with detachment protection
 */
export function createSafeArrayBuffer(uint8Array: Uint8Array): ArrayBuffer {
  if (!uint8Array) {
    throw new Error('No Uint8Array provided');
  }
  
  try {
    // First ensure we have a safe copy
    const safeBytes = createSafePDFBytes(uint8Array);
    
    // Method 1: Direct buffer slice (most efficient if not detached)
    try {
      const buffer = safeBytes.buffer.slice(
        safeBytes.byteOffset,
        safeBytes.byteOffset + safeBytes.byteLength
      );
      
      // Verify buffer is valid
      if (buffer.byteLength === safeBytes.byteLength) {
        return buffer;
      }
      throw new Error('Buffer slice verification failed');
      
    } catch (sliceError) {
      console.warn('⚠️ Buffer slice failed, creating new buffer:', sliceError.message);
      
      // Method 2: Create new ArrayBuffer and copy data
      const buffer = new ArrayBuffer(safeBytes.byteLength);
      const view = new Uint8Array(buffer);
      view.set(safeBytes);
      
      return buffer;
    }
    
  } catch (error) {
    console.error('❌ Failed to create safe ArrayBuffer:', error);
    throw new Error(`Cannot create safe ArrayBuffer: ${error.message}`);
  }
}

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
    const headerBytes = pdfBytes.slice(0, 10); // Read more bytes for better diagnosis
    const header = new TextDecoder('ascii', { fatal: false }).decode(headerBytes);
    
    console.log(`🔍 PDF header bytes (hex): ${Array.from(headerBytes.slice(0, 8)).map(b => b.toString(16).padStart(2, '0')).join(' ')}`);
    console.log(`🔍 PDF header string: "${header}"`);
    
    if (!header.startsWith('%PDF-')) {
      console.error(`❌ PDF header not found. Expected '%PDF-', got: "${header.slice(0, 8)}"`);
      
      // Additional diagnostics to help identify the issue
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
    console.error('❌ PDF validation failed with error:', error.message);
    console.error('❌ Error stack:', error.stack);
    return false;
  }
}

/**
 * Safe PDF loading function that handles ArrayBuffer detachment
 */
export async function loadPDFSafely(data: Uint8Array, options?: any): Promise<any> {
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
    const pdfjsLib = await import('pdfjs-dist');
    
    const loadingTask = pdfjsLib.getDocument(loadingOptions);
    
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
    console.error('❌ Failed to load PDF safely:', error);
    throw new Error(`PDF loading failed: ${error.message}`);
  }
}

/**
 * Gets PDF file size in a human-readable format
 */
export function formatPDFSize(pdfBytes: Uint8Array): string {
  const bytes = pdfBytes.length;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 Bytes';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
}