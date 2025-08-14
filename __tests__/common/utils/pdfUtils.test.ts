/**
 * Unit tests for PDF Utility Functions
 */

import {
  validatePDFBytes,
  createSafePDFBytes,
  createSafeArrayBuffer,
  loadPDFSafely
} from '../../../src/common/utils/pdfUtils';
import { fail } from '@jest/globals';

// Mock PDF.js for testing
jest.mock('pdfjs-dist', () => ({
  getDocument: jest.fn(),
  GlobalWorkerOptions: {
    workerSrc: ''
  }
}));

describe('PDF Utilities', () => {
  describe('validatePDFBytes', () => {
    it('should return true for valid PDF bytes', () => {
      // Create a minimal valid PDF header
      const validPDFBytes = new Uint8Array([
        0x25, 0x50, 0x44, 0x46, 0x2D, 0x31, 0x2E, 0x34, // %PDF-1.4
        0x0A, 0x0A, // newlines
        ...new Array(16).fill(0x20), // padding
        0x25, 0x25, 0x45, 0x4F, 0x46 // %%EOF
      ]);

      const result = validatePDFBytes(validPDFBytes);
      expect(result).toBe(true);
    });

    it('should return false for null or undefined bytes', () => {
      expect(validatePDFBytes(null as any)).toBe(false);
      expect(validatePDFBytes(undefined as any)).toBe(false);
    });

    it('should return false for empty bytes', () => {
      const emptyBytes = new Uint8Array(0);
      expect(validatePDFBytes(emptyBytes)).toBe(false);
    });

    it('should return false for bytes too short', () => {
      const shortBytes = new Uint8Array([0x25, 0x50, 0x44, 0x46]); // Just %PDF
      expect(validatePDFBytes(shortBytes)).toBe(false);
    });

    it('should return false for invalid header', () => {
      const invalidBytes = new Uint8Array(30);
      invalidBytes.fill(0x00);
      // Set first few bytes to something that's not PDF
      invalidBytes[0] = 0x48; // H
      invalidBytes[1] = 0x54; // T
      invalidBytes[2] = 0x4D; // M
      invalidBytes[3] = 0x4C; // L

      expect(validatePDFBytes(invalidBytes)).toBe(false);
    });

    it('should warn about unusual PDF versions but still validate', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      const consoloLogSpy = jest.spyOn(console, 'log').mockImplementation();

      // Create PDF with unusual version
      const unusualVersionPDF = new Uint8Array([
        0x25, 0x50, 0x44, 0x46, 0x2D, 0x33, 0x2E, 0x30, // %PDF-3.0 (unusual)
        0x0A, 0x0A,
        ...new Array(16).fill(0x20),
        0x25, 0x25, 0x45, 0x4F, 0x46 // %%EOF
      ]);

      const result = validatePDFBytes(unusualVersionPDF);
      expect(result).toBe(true);
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Unusual PDF version'));

      consoleSpy.mockRestore();
      consoloLogSpy.mockRestore();
    });
  });

  describe('createSafePDFBytes', () => {
    it('should create a safe copy of valid PDF bytes', () => {
      const originalBytes = new Uint8Array([1, 2, 3, 4, 5]);
      const safeBytes = createSafePDFBytes(originalBytes);

      expect(safeBytes).toBeInstanceOf(Uint8Array);
      expect(safeBytes.length).toBe(originalBytes.length);
      expect(Array.from(safeBytes)).toEqual(Array.from(originalBytes));
      
      // Ensure it's a different instance
      expect(safeBytes).not.toBe(originalBytes);
    });

    it('should throw error for null or undefined bytes', () => {
      expect(() => createSafePDFBytes(null as any)).toThrow();
      expect(() => createSafePDFBytes(undefined as any)).toThrow();
    });

    it('should throw error for empty bytes', () => {
      const emptyBytes = new Uint8Array(0);
      expect(() => createSafePDFBytes(emptyBytes)).toThrow();
    });

    it('should handle large byte arrays', () => {
      const largeBytes = new Uint8Array(100000);
      largeBytes.fill(0x42); // Fill with 'B'

      const safeBytes = createSafePDFBytes(largeBytes);
      expect(safeBytes.length).toBe(100000);
      expect(safeBytes[0]).toBe(0x42);
      expect(safeBytes[99999]).toBe(0x42);
    });
  });

  describe('createSafeArrayBuffer', () => {
    it('should create ArrayBuffer from valid Uint8Array', () => {
      // Mock validatePDFBytes to return true for this test
      jest.spyOn(require('../../../src/common/utils/pdfUtils'), 'validatePDFBytes')
        .mockReturnValueOnce(true)
        .mockReturnValueOnce(true); // Called twice in the function

      const uint8Array = new Uint8Array([
        0x25, 0x50, 0x44, 0x46, 0x2D, 0x31, 0x2E, 0x34, // %PDF-1.4
        0x0A, 0x0A, // newlines
        ...new Array(16).fill(0x20), // padding
        0x25, 0x25, 0x45, 0x4F, 0x46 // %%EOF
      ]);
      const arrayBuffer = createSafeArrayBuffer(uint8Array);

      expect(arrayBuffer).toBeInstanceOf(ArrayBuffer);
      expect(arrayBuffer.byteLength).toBe(uint8Array.byteLength);
      
      const view = new Uint8Array(arrayBuffer);
      expect(Array.from(view)).toEqual(Array.from(uint8Array));
    });

    it('should throw error for invalid PDF bytes', () => {
      // Mock validatePDFBytes to return false
      jest.spyOn(require('../../../src/common/utils/pdfUtils'), 'validatePDFBytes')
        .mockReturnValueOnce(false);

      const invalidPdfBytes = new Uint8Array([0x00, 0x01, 0x02, 0x03, 0x04]); // Not a PDF
      expect(() => createSafeArrayBuffer(invalidPdfBytes)).toThrow('Invalid PDF data');
    });

    it('should throw error for null or undefined input', () => {
      expect(() => createSafeArrayBuffer(null as any)).toThrow();
      expect(() => createSafeArrayBuffer(undefined as any)).toThrow();
    });

    it('should throw error for empty array', () => {
      const emptyArray = new Uint8Array(0);
      expect(() => createSafeArrayBuffer(emptyArray)).toThrow('Empty or null Uint8Array');
    });
  });

  describe('loadPDFSafely', () => {
    const mockPdfJsLib = require('pdfjs-dist');
    
    // Define a valid minimal PDF byte array for testing
    const validPdfBytes = new Uint8Array([
      0x25, 0x50, 0x44, 0x46, 0x2D, 0x31, 0x2E, 0x34, // %PDF-1.4
      0x0A, 0x0A, // newlines
      ...new Array(16).fill(0x20), // padding
      0x25, 0x25, 0x45, 0x4F, 0x46 // %%EOF
    ]);

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should load PDF with valid bytes', async () => {
      // Mock successful PDF loading
      const mockPdf = { numPages: 5 };
      const mockLoadingTask = {
        promise: Promise.resolve(mockPdf),
        onProgress: null
      };
      
      mockPdfJsLib.getDocument = jest.fn().mockReturnValue(mockLoadingTask);
      
      // Mock validatePDFBytes to return true
      jest.spyOn(require('../../../src/common/utils/pdfUtils'), 'validatePDFBytes')
        .mockReturnValue(true);

      const result = await loadPDFSafely(validPdfBytes);

      expect(result).toBe(mockPdf);
      expect(mockPdfJsLib.getDocument).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.any(Uint8Array),
          useWorkerFetch: false,
          isEvalSupported: false,
          useSystemFonts: true
        })
      );
    });

    it('should throw error for invalid PDF bytes', async () => {
      // Mock validatePDFBytes to return false
      jest.spyOn(require('../../../src/common/utils/pdfUtils'), 'validatePDFBytes')
        .mockReturnValue(false);

      const invalidBytes = new Uint8Array([0x00, 0x01, 0x02, 0x03, 0x04]); // Not a PDF
      
      await expect(loadPDFSafely(invalidBytes)).rejects.toThrow('Invalid PDF data provided');
    });

    it('should handle PDF loading errors', async () => {
      // Mock validatePDFBytes to return true
      jest.spyOn(require('../../../src/common/utils/pdfUtils'), 'validatePDFBytes')
        .mockReturnValue(true);

      // Mock PDF loading failure
      const mockLoadingTask = {
        promise: Promise.reject(new Error('PDF loading failed')).catch(() => {}), // Add .catch to prevent unhandled rejection warning
        onProgress: null
      };
      
      mockPdfJsLib.getDocument = jest.fn().mockReturnValue(mockLoadingTask);

      try {
        await loadPDFSafely(validPdfBytes);
        // If it reaches here, the promise was resolved unexpectedly, so fail the test
        fail('Expected promise to reject, but it resolved.');
      } catch (error: any) {
        expect(error.message).toContain('PDF loading failed');
      }
    });

    it('should apply custom options', async () => {
      // Mock successful PDF loading
      const mockPdf = { numPages: 3 };
      const mockLoadingTask = {
        promise: Promise.resolve(mockPdf),
        onProgress: null
      };
      
      mockPdfJsLib.getDocument = jest.fn().mockReturnValue(mockLoadingTask);
      
      // Mock validatePDFBytes to return true
      jest.spyOn(require('../../../src/common/utils/pdfUtils'), 'validatePDFBytes')
        .mockReturnValue(true);

      const customOptions = {
        cMapUrl: './custom-cmaps/',
        verbosity: 1
      };
      
      await loadPDFSafely(validPdfBytes, customOptions);

      expect(mockPdfJsLib.getDocument).toHaveBeenCalledWith(
        expect.objectContaining({
          cMapUrl: './custom-cmaps/',
          verbosity: 1,
          useWorkerFetch: false, // Should still have safe defaults
          isEvalSupported: false
        })
      );
    });
  });
});

// Clean up console spies after all tests
afterAll(() => {
  jest.restoreAllMocks();
});