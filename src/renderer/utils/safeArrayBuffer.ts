/**
 * SafeArrayBuffer - Prevents ArrayBuffer detachment issues
 * 
 * This utility provides safe handling of ArrayBuffer data to prevent
 * the common "ArrayBuffer is detached" errors that plague Electron apps.
 */

/**
 * Creates a safe copy of a Uint8Array that prevents detachment issues
 * @param source - The source Uint8Array to copy
 * @returns A new Uint8Array that is guaranteed to be safe from detachment
 */
export function createSafePDFBytes(source: Uint8Array): Uint8Array {
  if (!source) {
    throw new Error('Cannot create safe copy of null/undefined source');
  }
  
  if (source.length === 0) {
    return new Uint8Array(0);
  }
  
  try {
    // Method 1: Try direct copy (most efficient)
    const safeCopy = new Uint8Array(source.length);
    safeCopy.set(source);
    return safeCopy;
  } catch (error) {
    console.warn('Direct copy failed, using manual copy:', error);
    
    // Method 2: Manual byte-by-byte copy (fallback)
    const safeCopy = new Uint8Array(source.length);
    for (let i = 0; i < source.length; i++) {
      safeCopy[i] = source[i];
    }
    return safeCopy;
  }
}

/**
 * Validates PDF bytes to ensure they haven't been corrupted
 * @param bytes - The PDF bytes to validate
 * @returns boolean indicating if the bytes are valid
 */
export function validatePDFBytes(bytes: Uint8Array): boolean {
  if (!bytes) {
    console.warn('❌ PDF bytes validation failed: bytes is null/undefined');
    return false;
  }
  
  if (bytes.length === 0) {
    console.warn('❌ PDF bytes validation failed: bytes array is empty');
    return false;
  }
  
  if (bytes.length < 26) { // Minimum viable PDF size
    console.warn(`❌ PDF bytes validation failed: bytes too short (${bytes.length} bytes, minimum 26 required)`);
    return false;
  }
  
  try {
    // Check for PDF header (%PDF-)
    const headerBytes = bytes.slice(0, 8);
    const header = new TextDecoder('ascii', { fatal: false }).decode(headerBytes);
    if (!header.startsWith('%PDF-')) {
      console.warn('❌ PDF bytes validation failed: PDF header not found');
      console.warn('   Expected: %PDF-, Got:', header.substring(0, 10) + '...');
      return false;
    }
    
    // Basic structure validation
    const last1024 = bytes.slice(-1024);
    const tail = new TextDecoder('ascii', { fatal: false }).decode(last1024);
    if (!tail.includes('%%EOF')) {
      console.warn('⚠️  PDF bytes validation warning: EOF marker not found in tail (may be OK for streaming)');
      // Don't fail on this - it's common for valid PDFs to not have %%EOF in tail
    }
    
    console.log(`✅ PDF bytes validation passed (${bytes.length} bytes)`);
    return true;
  } catch (error) {
    console.warn('❌ PDF bytes validation failed with error:', error);
    return false;
  }
}

/**
 * Safely loads a PDF with multiple fallback strategies
 * @param bytes - The PDF bytes to load
 * @returns Promise resolving to loaded PDF document
 */
export async function loadPDFSafely(bytes: Uint8Array, options?: any): Promise<any> {
  if (!validatePDFBytes(bytes)) {
    throw new Error('Invalid PDF bytes provided to loadPDFSafely');
  }
  
  // Create safe copy immediately to prevent detachment
  const safeBytes = createSafePDFBytes(bytes);
  
  // Try to load with pdfjsLib
  try {
    const pdfjsLib = await import('pdfjs-dist');
    
    // Configure worker if needed
    if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
      // Try multiple strategies for worker configuration
      const workerStrategies = [
        // Strategy 1: Try bundled worker
        () => {
          try {
            const workerPath = require.resolve('pdfjs-dist/build/pdf.worker.min.js');
            pdfjsLib.GlobalWorkerOptions.workerSrc = workerPath;
            console.log('✅ PDF.js worker configured with bundled worker');
          } catch (error) {
            throw new Error('Bundled worker not found');
          }
        },
        // Strategy 2: Try CDN fallback
        () => {
          pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`;
          console.log('✅ PDF.js worker configured with CDN fallback');
        },
        // Strategy 3: Disable worker (emergency mode)
        () => {
          pdfjsLib.GlobalWorkerOptions.workerSrc = undefined;
          console.warn('⚠️ PDF.js worker disabled - performance may be degraded');
        }
      ];
      
      for (const strategy of workerStrategies) {
        try {
          strategy();
          break; // Success, exit loop
        } catch (error) {
          console.warn('PDF.js worker strategy failed:', error.message);
          continue; // Try next strategy
        }
      }
    }
    
    // Load PDF with options
    const loadingTask = pdfjsLib.getDocument({
      data: safeBytes,
      ...options
    });
    
    const pdf = await loadingTask.promise;
    console.log(`✅ PDF loaded successfully with ${pdf.numPages} pages`);
    return pdf;
  } catch (error) {
    console.error('❌ PDF loading failed:', error);
    throw new Error(`Failed to load PDF: ${error.message}`);
  }
}

/**
 * Creates a safe ArrayBuffer from a Uint8Array
 * @param uint8Array - The source Uint8Array
 * @returns A safe ArrayBuffer
 */
export function createSafeArrayBuffer(uint8Array: Uint8Array): ArrayBuffer {
  if (!uint8Array) {
    throw new Error('Cannot create ArrayBuffer from null/undefined');
  }
  
  try {
    // Method 1: Direct buffer slice (most efficient)
    if (uint8Array.buffer && uint8Array.buffer.byteLength > 0) {
      const buffer = uint8Array.buffer.slice(
        uint8Array.byteOffset,
        uint8Array.byteOffset + uint8Array.byteLength
      );
      if (buffer.byteLength === uint8Array.byteLength) {
        console.log('✅ ArrayBuffer created using direct slice method');
        return buffer;
      }
    }
    
    // Method 2: Create new buffer with byte copy (fallback)
    console.log('🔧 Using fallback buffer creation method');
    const buffer = new ArrayBuffer(uint8Array.byteLength);
    const view = new Uint8Array(buffer);
    view.set(uint8Array);
    console.log('✅ ArrayBuffer created using fallback method');
    return buffer;
  } catch (error) {
    console.error('❌ Failed to create safe ArrayBuffer:', error);
    throw new Error(`Failed to create ArrayBuffer: ${error.message}`);
  }
}

export default {
  createSafePDFBytes,
  validatePDFBytes,
  loadPDFSafely,
  createSafeArrayBuffer
};