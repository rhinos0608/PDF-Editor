/**
 * Array Utility Functions
 * Consolidated array manipulation utilities used throughout the application
 */

/**
 * Safely convert various data types to Uint8Array
 */
export function toUint8Array(data: ArrayBuffer | Uint8Array | Buffer | number[]): Uint8Array {
  if (data instanceof Uint8Array) {
    return data;
  }
  
  if (data instanceof ArrayBuffer) {
    return new Uint8Array(data);
  }
  
  if (Buffer && Buffer.isBuffer(data)) {
    return new Uint8Array(data);
  }
  
  if (Array.isArray(data)) {
    return new Uint8Array(data);
  }
  
  throw new Error(`Cannot convert ${typeof data} to Uint8Array`);
}

/**
 * Safely convert Uint8Array to ArrayBuffer
 */
export function toArrayBuffer(uint8Array: Uint8Array): ArrayBuffer {
  // If the Uint8Array is already backed by the exact ArrayBuffer we need
  if (uint8Array.byteOffset === 0 && uint8Array.byteLength === uint8Array.buffer.byteLength) {
    return uint8Array.buffer;
  }
  
  // Otherwise, create a new ArrayBuffer with the exact bytes
  const buffer = new ArrayBuffer(uint8Array.byteLength);
  const view = new Uint8Array(buffer);
  view.set(uint8Array);
  return buffer;
}

/**
 * Compare two Uint8Arrays for equality
 */
export function arraysEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  
  return true;
}

/**
 * Create a deep copy of a Uint8Array
 */
export function cloneUint8Array(array: Uint8Array): Uint8Array {
  const cloned = new Uint8Array(array.length);
  cloned.set(array);
  return cloned;
}

/**
 * Concatenate multiple Uint8Arrays
 */
export function concatUint8Arrays(...arrays: Uint8Array[]): Uint8Array {
  const totalLength = arrays.reduce((sum, arr) => sum + arr.length, 0);
  const result = new Uint8Array(totalLength);
  
  let offset = 0;
  for (const array of arrays) {
    result.set(array, offset);
    offset += array.length;
  }
  
  return result;
}

/**
 * Split Uint8Array into chunks of specified size
 */
export function chunkUint8Array(array: Uint8Array, chunkSize: number): Uint8Array[] {
  if (chunkSize <= 0) {
    throw new Error('Chunk size must be positive');
  }
  
  const chunks: Uint8Array[] = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  
  return chunks;
}

/**
 * Find the index of a byte pattern within a Uint8Array
 */
export function findBytePattern(haystack: Uint8Array, needle: Uint8Array): number {
  if (needle.length === 0) return 0;
  if (needle.length > haystack.length) return -1;
  
  for (let i = 0; i <= haystack.length - needle.length; i++) {
    let found = true;
    for (let j = 0; j < needle.length; j++) {
      if (haystack[i + j] !== needle[j]) {
        found = false;
        break;
      }
    }
    if (found) return i;
  }
  
  return -1;
}

/**
 * Convert Uint8Array to hex string
 */
export function uint8ArrayToHex(array: Uint8Array): string {
  return Array.from(array)
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Convert hex string to Uint8Array
 */
export function hexToUint8Array(hex: string): Uint8Array {
  if (hex.length % 2 !== 0) {
    throw new Error('Invalid hex string length');
  }
  
  const array = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    array[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  
  return array;
}

/**
 * Check if array is likely binary data
 */
export function isBinaryData(array: Uint8Array, sampleSize: number = 1024): boolean {
  const sample = array.slice(0, Math.min(sampleSize, array.length));
  let nonTextBytes = 0;
  
  for (const byte of sample) {
    // Count bytes that are not typical text characters
    if (byte === 0 || (byte < 32 && byte !== 9 && byte !== 10 && byte !== 13) || byte > 126) {
      nonTextBytes++;
    }
  }
  
  // If more than 30% of bytes are non-text, consider it binary
  return (nonTextBytes / sample.length) > 0.3;
}