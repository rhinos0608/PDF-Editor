/**
 * Unit tests for PDFService
 */

import { PDFService } from '../../../src/renderer/services/PDFService';
import { PDFDocument } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';

// Mock external dependencies
jest.mock('pdfjs-dist', () => ({
  GlobalWorkerOptions: {
    workerSrc: ''
  },
  getDocument: jest.fn()
}));

jest.mock('pdf-lib', () => ({
  PDFDocument: {
    create: jest.fn(),
    load: jest.fn()
  },
  rgb: jest.fn(() => ({ r: 1, g: 0, b: 0 })),
  StandardFonts: {
    Helvetica: 'Helvetica'
  },
  degrees: jest.fn((deg: number) => deg * Math.PI / 180)
}));

// Mock common utils
jest.mock('../../../src/common/utils', () => ({
  loadPDFSafely: jest.fn(),
  validatePDFBytes: jest.fn(() => true),
  createSafePDFBytes: jest.fn((bytes: Uint8Array) => new Uint8Array(bytes))
}));

describe('PDFService', () => {
  let pdfService: PDFService;
  let mockPDFDocument: jest.Mocked<PDFDocument>;

  beforeEach(() => {
    pdfService = new PDFService();
    
    // Create mock PDF document
    mockPDFDocument = {
      save: jest.fn().mockResolvedValue(new Uint8Array([1, 2, 3, 4])),
      getPageCount: jest.fn().mockReturnValue(5),
      addPage: jest.fn(),
      removePage: jest.fn(),
      getPages: jest.fn().mockReturnValue([]),
      getTitle: jest.fn().mockReturnValue('Test PDF'),
      setTitle: jest.fn(),
      getAuthor: jest.fn().mockReturnValue('Test Author'),
      setAuthor: jest.fn(),
      getSubject: jest.fn().mockReturnValue('Test Subject'),
      setSubject: jest.fn(),
      getKeywords: jest.fn().mockReturnValue(['test', 'pdf']),
      setKeywords: jest.fn(),
      getCreator: jest.fn().mockReturnValue('Test Creator'),
      setCreator: jest.fn(),
      getProducer: jest.fn().mockReturnValue('Test Producer'),
      setProducer: jest.fn(),
      getCreationDate: jest.fn().mockReturnValue(new Date('2024-01-01')),
      setCreationDate: jest.fn(),
      getModificationDate: jest.fn().mockReturnValue(new Date('2024-01-02')),
      setModificationDate: jest.fn()
    } as any;

    jest.clearAllMocks();
    // Mock PDFDocument.load to return a valid mockPDFDocument for recovery attempts
    (PDFDocument.load as jest.Mock).mockResolvedValue(mockPDFDocument);
  });

  describe('Constructor', () => {
    it('should initialize with empty state', () => {
      const service = new PDFService();
      expect(() => service.getCurrentPDF()).toThrow('No PDF document is currently loaded');
    });

    it('should warn if PDF.js worker is not configured', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      (pdfjsLib.GlobalWorkerOptions as any).workerSrc = '';
      
      new PDFService();
      
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('PDF.js worker not configured'));
      consoleSpy.mockRestore();
    });
  });

  describe('setCurrentPDF', () => {
    it('should set current PDF with safe bytes', () => {
      const originalBytes = new Uint8Array([1, 2, 3, 4, 5]);
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      pdfService.setCurrentPDF(mockPDFDocument, originalBytes);

      expect(pdfService.getCurrentPDF()).toBe(mockPDFDocument);
      expect(pdfService.hasUnsavedChanges()).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Current PDF set with safe byte tracking'));
      
      consoleSpy.mockRestore();
    });

    it('should create safe copy of original bytes', () => {
      const { createSafePDFBytes } = require('../../../src/common/utils');
      const originalBytes = new Uint8Array([1, 2, 3, 4, 5]);

      pdfService.setCurrentPDF(mockPDFDocument, originalBytes);

      expect(createSafePDFBytes).toHaveBeenCalledWith(originalBytes);
    });
  });

  describe('getCurrentPDF', () => {
    it('should return current PDF when set', () => {
      const originalBytes = new Uint8Array([1, 2, 3, 4, 5]);
      pdfService.setCurrentPDF(mockPDFDocument, originalBytes);

      expect(pdfService.getCurrentPDF()).toBe(mockPDFDocument);
    });

    it('should throw error when no PDF is loaded', () => {
      expect(() => pdfService.getCurrentPDF()).toThrow('No PDF document is currently loaded');
    });
  });

  describe('markModified', () => {
    it('should mark PDF as modified', () => {
      const originalBytes = new Uint8Array([1, 2, 3, 4, 5]);
      pdfService.setCurrentPDF(mockPDFDocument, originalBytes);

      expect(pdfService.hasUnsavedChanges()).toBe(false);
      
      pdfService.markModified();
      
      expect(pdfService.hasUnsavedChanges()).toBe(true);
    });
  });

  describe('saveCurrentPDF', () => {
    it('should save current PDF and return bytes', async () => {
      const originalBytes = new Uint8Array([1, 2, 3, 4, 5]);
      const savedBytes = new Uint8Array([5, 4, 3, 2, 1]);
      
      mockPDFDocument.save.mockResolvedValue(savedBytes);
      pdfService.setCurrentPDF(mockPDFDocument, originalBytes);

      const result = await pdfService.saveCurrentPDF();

      expect(mockPDFDocument.save).toHaveBeenCalled();
      expect(result).toEqual(savedBytes);
      expect(pdfService.hasUnsavedChanges()).toBe(false); // Should reset modified flag
    });

    it('should throw error when no PDF is loaded', async () => {
      await expect(pdfService.saveCurrentPDF()).rejects.toThrow('No PDF document to save');
    });

    it('should handle save errors gracefully', async () => {
      const originalBytes = new Uint8Array([1, 2, 3, 4, 5]);
      const saveError = new Error('Save failed');
      
      // Set originalBytes before calling saveCurrentPDF to enable recovery logic
      pdfService.setCurrentPDF(mockPDFDocument, originalBytes);
      // Mock save to always reject with the saveError
      mockPDFDocument.save.mockImplementation(() => {
        throw saveError;
      });

      let caughtError: Error | undefined;
      try {
        await pdfService.saveCurrentPDF();
      } catch (error) {
        caughtError = error as Error;
      }
      expect(caughtError).toBeInstanceOf(Error);
      expect(caughtError?.message).toContain('Failed to save PDF after 3 attempts: Save failed');
    });
  });

  describe('loadPDF', () => {
    it('should load PDF from bytes', async () => {
      const { loadPDFSafely } = require('../../../src/common/utils');
      const mockPDFProxy = { numPages: 3 };
      const pdfBytes = new Uint8Array([1, 2, 3, 4, 5]);
      
      loadPDFSafely.mockResolvedValue(mockPDFProxy);

      const result = await pdfService.loadPDF(pdfBytes);

      expect(loadPDFSafely).toHaveBeenCalledWith(pdfBytes, undefined);
      expect(result).toBe(mockPDFProxy);
    });

    it('should pass options to loadPDFSafely', async () => {
      const { loadPDFSafely } = require('../../../src/common/utils');
      const mockPDFProxy = { numPages: 3 };
      const pdfBytes = new Uint8Array([1, 2, 3, 4, 5]);
      const options = { verbosity: 1 };
      
      loadPDFSafely.mockResolvedValue(mockPDFProxy);

      await pdfService.loadPDF(pdfBytes, options);

      expect(loadPDFSafely).toHaveBeenCalledWith(pdfBytes, options);
    });

    it('should handle loading errors', async () => {
      const { loadPDFSafely } = require('../../../src/common/utils');
      const loadError = new Error('Load failed');
      const pdfBytes = new Uint8Array([1, 2, 3, 4, 5]);
      
      loadPDFSafely.mockRejectedValue(loadError);

      await expect(pdfService.loadPDF(pdfBytes)).rejects.toThrow('Load failed');
    });
  });

  describe('createPDF', () => {
    it('should create new empty PDF document', async () => {
      const mockNewDoc = { ...mockPDFDocument };
      (PDFDocument.create as jest.Mock).mockResolvedValue(mockNewDoc);

      const result = await pdfService.createPDF();

      expect(PDFDocument.create).toHaveBeenCalled();
      expect(result).toBe(mockNewDoc);
    });

    it('should handle creation errors', async () => {
      const createError = new Error('Creation failed');
      (PDFDocument.create as jest.Mock).mockRejectedValue(createError);

      await expect(pdfService.createPDF()).rejects.toThrow('Creation failed');
    });
  });

  describe('mergePDFs', () => {
    it('should merge multiple PDF buffers', async () => {
      const pdfBuffer1 = new Uint8Array([1, 2, 3]);
      const pdfBuffer2 = new Uint8Array([4, 5, 6]);
      const pdfBuffers = [pdfBuffer1, pdfBuffer2];
      
      const mockDoc1 = { ...mockPDFDocument, getPageCount: () => 2, getPages: () => ['page1', 'page2'] };
      const mockDoc2 = { ...mockPDFDocument, getPageCount: () => 1, getPages: () => ['page3'] };
      const mockMergedDoc = { 
        ...mockPDFDocument, 
        copyPages: jest.fn().mockResolvedValue(['copiedPage1', 'copiedPage2', 'copiedPage3']),
        addPage: jest.fn()
      };

      (PDFDocument.load as jest.Mock)
        .mockResolvedValueOnce(mockDoc1)
        .mockResolvedValueOnce(mockDoc2);
      (PDFDocument.create as jest.Mock).mockResolvedValue(mockMergedDoc);
      
      const mergedBytes = new Uint8Array([1, 2, 3, 4, 5, 6]);
      mockMergedDoc.save.mockResolvedValue(mergedBytes);

      const result = await pdfService.mergePDFs(pdfBuffers);

      expect(PDFDocument.load).toHaveBeenCalledTimes(2);
      expect(PDFDocument.create).toHaveBeenCalled();
      expect(mockMergedDoc.copyPages).toHaveBeenCalledTimes(2);
      expect(result).toBe(mergedBytes);
    });

    it('should handle merge errors', async () => {
      const pdfBuffers = [new Uint8Array([1, 2, 3])];
      const loadError = new Error('Load failed');
      
      (PDFDocument.load as jest.Mock).mockRejectedValue(loadError);

      await expect(pdfService.mergePDFs(pdfBuffers)).rejects.toThrow('Load failed');
    });

    it('should handle empty buffers array', async () => {
      await expect(pdfService.mergePDFs([])).rejects.toThrow();
    });
  });

  describe('splitPDF', () => {
    it('should split PDF at specified page', async () => {
      const pdfBytes = new Uint8Array([1, 2, 3, 4, 5]);
      const splitPage = 3;
      
      const mockSourceDoc = {
        ...mockPDFDocument,
        getPageCount: () => 5,
        getPages: () => ['p1', 'p2', 'p3', 'p4', 'p5']
      };
      
      const mockFirstDoc = { 
        ...mockPDFDocument,
        copyPages: jest.fn().mockResolvedValue(['p1', 'p2', 'p3']),
        addPage: jest.fn(),
        save: jest.fn().mockResolvedValue(new Uint8Array([1, 2, 3]))
      };
      
      const mockSecondDoc = { 
        ...mockPDFDocument,
        copyPages: jest.fn().mockResolvedValue(['p4', 'p5']),
        addPage: jest.fn(),
        save: jest.fn().mockResolvedValue(new Uint8Array([4, 5]))
      };

      (PDFDocument.load as jest.Mock).mockResolvedValue(mockSourceDoc);
      (PDFDocument.create as jest.Mock)
        .mockResolvedValueOnce(mockFirstDoc)
        .mockResolvedValueOnce(mockSecondDoc);

      const result = await pdfService.splitPDF(pdfBytes, splitPage);

      expect(result.first).toEqual(new Uint8Array([1, 2, 3]));
      expect(result.second).toEqual(new Uint8Array([4, 5]));
    });

    it('should handle invalid split page', async () => {
      const pdfBytes = new Uint8Array([1, 2, 3, 4, 5]);
      const mockSourceDoc = { getPageCount: () => 5 };
      
      (PDFDocument.load as jest.Mock).mockResolvedValue(mockSourceDoc);

      await expect(pdfService.splitPDF(pdfBytes, 0)).rejects.toThrow('Invalid split page');
      await expect(pdfService.splitPDF(pdfBytes, 6)).rejects.toThrow('Invalid split page');
    });
  });
});

// Clean up after tests
afterAll(() => {
  jest.restoreAllMocks();
});