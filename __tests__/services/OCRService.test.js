const { OCRService } = require('../../src/renderer/services/OCRService');

// Mock tesseract.js
jest.mock('tesseract.js', () => ({
  createWorker: jest.fn(),
  PSM: {
    AUTO: 0
  },
  OEM: {
    LSTM_ONLY: 1
  }
}));

describe('OCRService', () => {
  let ocrService;
  let mockWorker;
  
  beforeEach(() => {
    ocrService = new OCRService();
    mockWorker = {
      terminate: jest.fn(),
      setParameters: jest.fn(),
      recognize: jest.fn(),
      detect: jest.fn()
    };
    
    require('tesseract.js').createWorker.mockResolvedValue(mockWorker);
    jest.clearAllMocks();
  });

  describe('initialize', () => {
    it('should create a Tesseract worker', async () => {
      await ocrService.initialize('eng');
      
      expect(require('tesseract.js').createWorker).toHaveBeenCalledWith('eng', 1, {
        logger: expect.any(Function)
      });
      expect(mockWorker.setParameters).toHaveBeenCalled();
    });

    it('should not reinitialize if already initialized with same language', async () => {
      await ocrService.initialize('eng');
      await ocrService.initialize('eng');
      
      expect(require('tesseract.js').createWorker).toHaveBeenCalledTimes(1);
    });

    it('should reinitialize if language changes', async () => {
      await ocrService.initialize('eng');
      await ocrService.initialize('spa');
      
      expect(mockWorker.terminate).toHaveBeenCalled();
      expect(require('tesseract.js').createWorker).toHaveBeenCalledTimes(2);
    });
  });

  describe('performOCR', () => {
    it('should perform OCR on a PDF page', async () => {
      // Mock PDF.js
      const mockPage = {
        getViewport: jest.fn().mockReturnValue({ scale: 2.0, height: 100, width: 100 }),
        render: jest.fn().mockReturnValue({ promise: Promise.resolve() })
      };
      
      const mockPdf = {
        getPage: jest.fn().mockResolvedValue(mockPage),
        numPages: 5
      };
      
      // Mock worker recognition result
      mockWorker.recognize.mockResolvedValue({
        data: {
          text: 'Sample OCR text',
          confidence: 95,
          blocks: []
        }
      });
      
      const result = await ocrService.performOCR(mockPdf, 1, 'eng');
      
      expect(result).toEqual({
        text: 'Sample OCR text',
        confidence: 95,
        language: 'eng',
        pageNumber: 1,
        blocks: []
      });
      
      expect(mockPdf.getPage).toHaveBeenCalledWith(1);
      expect(mockWorker.recognize).toHaveBeenCalled();
    });

    it('should handle OCR errors', async () => {
      const mockPdf = {
        getPage: jest.fn().mockRejectedValue(new Error('Failed to get page'))
      };
      
      await expect(ocrService.performOCR(mockPdf, 1, 'eng')).rejects.toThrow('OCR failed');
    });
  });

  describe('getSupportedLanguages', () => {
    it('should return a list of supported languages', () => {
      const languages = ocrService.getSupportedLanguages();
      
      expect(languages).toBeInstanceOf(Array);
      expect(languages.length).toBeGreaterThan(0);
      expect(languages[0]).toHaveProperty('code');
      expect(languages[0]).toHaveProperty('name');
    });
  });

  describe('terminate', () => {
    it('should terminate the Tesseract worker', async () => {
      await ocrService.initialize('eng');
      await ocrService.terminate();
      
      expect(mockWorker.terminate).toHaveBeenCalled();
    });
  });
});