const { PDFService } = require('../../src/renderer/services/PDFService');
const { PDFDocument } = require('pdf-lib');

// Mock pdf-lib
jest.mock('pdf-lib', () => ({
  PDFDocument: {
    create: jest.fn(),
    load: jest.fn()
  },
  rgb: jest.fn(),
  StandardFonts: {
    Helvetica: 'Helvetica'
  },
  degrees: jest.fn()
}));

// Mock pdfjs-dist
jest.mock('pdfjs-dist', () => ({
  GlobalWorkerOptions: {
    workerSrc: ''
  },
  getDocument: jest.fn()
}));

describe('PDFService', () => {
  let pdfService;
  
  beforeEach(() => {
    pdfService = new PDFService();
    jest.clearAllMocks();
  });

  describe('loadPDF', () => {
    it('should load a PDF document successfully', async () => {
      const mockPdf = { numPages: 5 };
      const mockLoadingTask = {
        promise: Promise.resolve(mockPdf),
        onProgress: null
      };
      
      require('pdfjs-dist').getDocument.mockReturnValue(mockLoadingTask);
      
      const data = new Uint8Array([1, 2, 3]);
      const result = await pdfService.loadPDF(data);
      
      expect(result).toEqual(mockPdf);
      expect(require('pdfjs-dist').getDocument).toHaveBeenCalledWith({
        data,
        cMapUrl: expect.any(String),
        cMapPacked: true,
        useWorkerFetch: true,
        isEvalSupported: false,
        useSystemFonts: true
      });
    });

    it('should handle PDF loading errors', async () => {
      const mockLoadingTask = {
        promise: Promise.reject(new Error('Failed to load PDF')),
        onProgress: null
      };
      
      require('pdfjs-dist').getDocument.mockReturnValue(mockLoadingTask);
      
      const data = new Uint8Array([1, 2, 3]);
      
      await expect(pdfService.loadPDF(data)).rejects.toThrow('Failed to load PDF document');
    });
  });

  describe('mergePDFs', () => {
    it('should merge multiple PDFs correctly', async () => {
      const mockMergedPdf = {
        save: jest.fn().mockResolvedValue(new Uint8Array([7, 8, 9]))
      };
      
      const mockPdf1 = {
        getPageIndices: jest.fn().mockReturnValue([0, 1]),
        copyPages: jest.fn().mockResolvedValue(['page1', 'page2'])
      };
      
      const mockPdf2 = {
        getPageIndices: jest.fn().mockReturnValue([0]),
        copyPages: jest.fn().mockResolvedValue(['page3'])
      };
      
      PDFDocument.create.mockResolvedValue(mockMergedPdf);
      PDFDocument.load
        .mockResolvedValueOnce(mockPdf1)
        .mockResolvedValueOnce(mockPdf2);
      
      mockMergedPdf.copyPages = jest.fn().mockResolvedValue(['page1', 'page2', 'page3']);
      mockMergedPdf.addPage = jest.fn();
      
      const pdfBuffers = [new Uint8Array([1, 2]), new Uint8Array([3, 4])];
      const result = await pdfService.mergePDFs(pdfBuffers);
      
      expect(result).toEqual(new Uint8Array([7, 8, 9]));
      expect(PDFDocument.create).toHaveBeenCalled();
      expect(PDFDocument.load).toHaveBeenCalledTimes(2);
    });
  });

  describe('splitPDF', () => {
    it('should split a PDF at the specified page', async () => {
      const mockPdfDoc = {
        getPageCount: jest.fn().mockReturnValue(5),
        copyPages: jest.fn().mockResolvedValue(['page']),
        addPage: jest.fn(),
        save: jest.fn().mockResolvedValue(new Uint8Array([1, 2]))
      };
      
      const mockFirstPdf = {
        copyPages: jest.fn().mockResolvedValue(['page']),
        addPage: jest.fn(),
        save: jest.fn().mockResolvedValue(new Uint8Array([3, 4]))
      };
      
      const mockSecondPdf = {
        copyPages: jest.fn().mockResolvedValue(['page']),
        addPage: jest.fn(),
        save: jest.fn().mockResolvedValue(new Uint8Array([5, 6]))
      };
      
      PDFDocument.load.mockResolvedValue(mockPdfDoc);
      PDFDocument.create
        .mockResolvedValueOnce(mockFirstPdf)
        .mockResolvedValueOnce(mockSecondPdf);
      
      const pdfBytes = new Uint8Array([1, 2, 3]);
      const result = await pdfService.splitPDF(pdfBytes, 2);
      
      expect(result.first).toEqual(new Uint8Array([3, 4]));
      expect(result.second).toEqual(new Uint8Array([5, 6]));
    });

    it('should throw an error for invalid split page number', async () => {
      const mockPdfDoc = {
        getPageCount: jest.fn().mockReturnValue(5)
      };
      
      PDFDocument.load.mockResolvedValue(mockPdfDoc);
      
      const pdfBytes = new Uint8Array([1, 2, 3]);
      
      await expect(pdfService.splitPDF(pdfBytes, 0)).rejects.toThrow('Invalid split page number');
      await expect(pdfService.splitPDF(pdfBytes, 5)).rejects.toThrow('Invalid split page number');
    });
  });
});