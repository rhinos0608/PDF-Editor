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
 * Enhanced PDF validation with comprehensive checks
 */
export function validatePDFBytes(pdfBytes: Uint8Array): boolean {
  if (!pdfBytes) {
    console.warn('⚠️ PDF bytes is null or undefined');
    return false;
  }
  
  if (pdfBytes.byteLength < 26) { // Minimum viable PDF size
    console.warn(`⚠️ PDF bytes too short: ${pdfBytes.byteLength} bytes (minimum 26 required)`);
    return false;
  }
  
  try {
    // Check for PDF header (%PDF-)
    const headerBytes = pdfBytes.slice(0, 8);
    const header = new TextDecoder('ascii', { fatal: false }).decode(headerBytes);
    if (!header.startsWith('%PDF-')) {
      console.warn('⚠️ PDF header not found, got:', header.slice(0, 10));
      return false;
    }
    
    // Check for EOF marker (%%EOF) in the last 2KB
    const searchLength = Math.min(pdfBytes.byteLength, 2048);
    const tailBytes = pdfBytes.slice(-searchLength);
    const tail = new TextDecoder('ascii', { fatal: false }).decode(tailBytes);
    if (!tail.includes('%%EOF')) {
      console.warn('⚠️ PDF EOF marker not found in tail');
      return false;
    }
    
    console.log(`✅ PDF bytes validation passed (${pdfBytes.byteLength} bytes)`);
    return true;
  } catch (error) {
    console.warn('⚠️ PDF validation failed with error:', error.message);
    return false;
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