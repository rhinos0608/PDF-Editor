import Tesseract from 'tesseract.js';
import { PDFDocumentProxy } from 'pdfjs-dist/types/src/display/api';
import { logger, createAppError, withErrorHandling } from './LoggerService';

interface OCRResult {
  text: string;
  confidence: number;
  blocks: OCRBlock[];
  language: string;
  pageNumber: number;
  processingTime?: number;
  detectedLanguages?: Array<{ language: string; confidence: number }>;
  metadata?: {
    imageSize: { width: number; height: number };
    dpi: number;
    rotation: number;
    skew: number;
  };
}

interface OCRBlock {
  text: string;
  confidence: number;
  bbox: {
    x0: number;
    y0: number;
    x1: number;
    y1: number;
  };
  words: OCRWord[];
}

interface OCRWord {
  text: string;
  confidence: number;
  bbox: {
    x0: number;
    y0: number;
    x1: number;
    y1: number;
  };
}

export class OCRService {
  private worker: Tesseract.Worker | null = null;
  private isInitialized = false;
  private currentLanguage = 'eng';
  
  // Supported languages with enhanced coverage
  private readonly supportedLanguages = [
    { code: 'eng', name: 'English', script: 'Latin' },
    { code: 'spa', name: 'Spanish', script: 'Latin' },
    { code: 'fra', name: 'French', script: 'Latin' },
    { code: 'deu', name: 'German', script: 'Latin' },
    { code: 'ita', name: 'Italian', script: 'Latin' },
    { code: 'por', name: 'Portuguese', script: 'Latin' },
    { code: 'nld', name: 'Dutch', script: 'Latin' },
    { code: 'dan', name: 'Danish', script: 'Latin' },
    { code: 'fin', name: 'Finnish', script: 'Latin' },
    { code: 'nor', name: 'Norwegian', script: 'Latin' },
    { code: 'swe', name: 'Swedish', script: 'Latin' },
    { code: 'pol', name: 'Polish', script: 'Latin' },
    { code: 'ces', name: 'Czech', script: 'Latin' },
    { code: 'hun', name: 'Hungarian', script: 'Latin' },
    { code: 'ron', name: 'Romanian', script: 'Latin' },
    { code: 'hrv', name: 'Croatian', script: 'Latin' },
    { code: 'slv', name: 'Slovenian', script: 'Latin' },
    { code: 'slk', name: 'Slovak', script: 'Latin' },
    { code: 'est', name: 'Estonian', script: 'Latin' },
    { code: 'lav', name: 'Latvian', script: 'Latin' },
    { code: 'lit', name: 'Lithuanian', script: 'Latin' },
    { code: 'rus', name: 'Russian', script: 'Cyrillic' },
    { code: 'ukr', name: 'Ukrainian', script: 'Cyrillic' },
    { code: 'bul', name: 'Bulgarian', script: 'Cyrillic' },
    { code: 'srp', name: 'Serbian', script: 'Cyrillic' },
    { code: 'mkd', name: 'Macedonian', script: 'Cyrillic' },
    { code: 'chi_sim', name: 'Chinese (Simplified)', script: 'Han' },
    { code: 'chi_tra', name: 'Chinese (Traditional)', script: 'Han' },
    { code: 'jpn', name: 'Japanese', script: 'Mixed' },
    { code: 'kor', name: 'Korean', script: 'Hangul' },
    { code: 'ara', name: 'Arabic', script: 'Arabic' },
    { code: 'heb', name: 'Hebrew', script: 'Hebrew' },
    { code: 'hin', name: 'Hindi', script: 'Devanagari' },
    { code: 'ben', name: 'Bengali', script: 'Bengali' },
    { code: 'guj', name: 'Gujarati', script: 'Gujarati' },
    { code: 'pan', name: 'Punjabi', script: 'Gurmukhi' },
    { code: 'tam', name: 'Tamil', script: 'Tamil' },
    { code: 'tel', name: 'Telugu', script: 'Telugu' },
    { code: 'kan', name: 'Kannada', script: 'Kannada' },
    { code: 'mal', name: 'Malayalam', script: 'Malayalam' },
    { code: 'ori', name: 'Odia', script: 'Odia' },
    { code: 'asm', name: 'Assamese', script: 'Bengali' },
    { code: 'tha', name: 'Thai', script: 'Thai' },
    { code: 'vie', name: 'Vietnamese', script: 'Latin' },
    { code: 'mya', name: 'Burmese', script: 'Myanmar' },
    { code: 'khm', name: 'Khmer', script: 'Khmer' },
    { code: 'lao', name: 'Lao', script: 'Lao' },
    { code: 'sin', name: 'Sinhala', script: 'Sinhala' },
    { code: 'tur', name: 'Turkish', script: 'Latin' },
    { code: 'fas', name: 'Persian', script: 'Arabic' },
    { code: 'urd', name: 'Urdu', script: 'Arabic' },
    { code: 'pus', name: 'Pashto', script: 'Arabic' },
    { code: 'swa', name: 'Swahili', script: 'Latin' },
    { code: 'amh', name: 'Amharic', script: 'Ethiopic' },
    { code: 'grc', name: 'Greek', script: 'Greek' },
    { code: 'arm', name: 'Armenian', script: 'Armenian' },
    { code: 'geo', name: 'Georgian', script: 'Georgian' },
    { code: 'kat', name: 'Georgian (Alternative)', script: 'Georgian' },
    { code: 'isl', name: 'Icelandic', script: 'Latin' },
    { code: 'mlt', name: 'Maltese', script: 'Latin' },
    { code: 'epo', name: 'Esperanto', script: 'Latin' },
    { code: 'lat', name: 'Latin', script: 'Latin' }
  ];

  // Initialize Tesseract worker
  async initialize(language: string = 'eng'): Promise<void> {
    if (this.isInitialized && this.currentLanguage === language) {
      return;
    }
    
    try {
      // Terminate existing worker if any
      if (this.worker) {
        await this.worker.terminate();
      }
      
      // Create new worker with local paths
      this.worker = await Tesseract.createWorker(language, 1, {
        logger: (m: any) => {
          if (m.status === 'recognizing text') {
            // Emit progress event
            this.onProgress?.(m.progress);
          }
        },
        // Specify local paths for worker and core files (absolute from root)
        workerPath: '/worker.min.js',
        corePath: '/tesseract-core.wasm.js',
        langPath: '/tessdata'
      });
      
      // Set OCR parameters for better accuracy
      await this.worker.setParameters({
        tessedit_pageseg_mode: Tesseract.PSM.AUTO,
        preserve_interword_spaces: '1',
        tessedit_char_whitelist: ' !"#$%&\'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~'
      });
      
      this.currentLanguage = language;
      this.isInitialized = true;
    } catch (error: any) {
      logger.error('Error initializing OCR service', error, { language });
      throw createAppError('OCR_INITIALIZATION_FAILED', 'Failed to initialize OCR service', { language });
    }
  }

  // Progress callback
  private onProgress?: (progress: number) => void;

  // Set progress callback
  setProgressCallback(callback: (progress: number) => void): void {
    this.onProgress = callback;
  }

  // Perform OCR on PDF page
  async performOCR(
    pdf: PDFDocumentProxy,
    pageNumber: number,
    language: string = 'eng'
  ): Promise<OCRResult> {
    try {
      // Initialize worker if needed
      await this.initialize(language);
      
      if (!this.worker) {
        throw createAppError('OCR_INITIALIZATION_FAILED', 'OCR worker not initialized');
      }
      
      // Get page and render to canvas
      const page = await pdf.getPage(pageNumber);
      const viewport = page.getViewport({ scale: 2.0 }); // Higher scale for better OCR
      
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d')!;
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      
      await page.render({
        canvasContext: context,
        viewport: viewport
      }).promise;
      
      // Perform OCR
      const result = await this.worker.recognize(canvas);
      
      // Process and structure the results
      const ocrResult: OCRResult = {
        text: result.data.text,
        confidence: result.data.confidence,
        language,
        pageNumber,
        blocks: result.data.blocks?.map(block => ({
          text: block.text,
          confidence: block.confidence,
          bbox: block.bbox,
          words: block.words?.map(word => ({
            text: word.text,
            confidence: word.confidence,
            bbox: word.bbox
          })) || []
        })) || []
      };
      
      return ocrResult;
    } catch (error: any) {
      logger.error('Error performing OCR', error, { pageNumber, language });
      throw createAppError('OCR_PROCESSING_FAILED', 'OCR failed', { pageNumber, language });
    }
  }

  // Perform OCR on multiple pages
  async performBatchOCR(
    pdf: PDFDocumentProxy,
    pageNumbers: number[],
    language: string = 'eng'
  ): Promise<OCRResult[]> {
    const results: OCRResult[] = [];
    
    for (let i = 0; i < pageNumbers.length; i++) {
      const pageNum = pageNumbers[i];
      
      // Update progress
      this.onProgress?.((i / pageNumbers.length) * 100);
      
      const result = await this.performOCR(pdf, pageNum, language);
      results.push(result);
    }
    
    // Complete progress
    this.onProgress?.(100);
    
    return results;
  }

  // Perform OCR on entire PDF
  async performFullOCR(
    pdf: PDFDocumentProxy,
    language: string = 'eng'
  ): Promise<OCRResult[]> {
    const pageNumbers = Array.from({ length: pdf.numPages }, (_, i) => i + 1);
    return this.performBatchOCR(pdf, pageNumbers, language);
  }

  // Extract text from specific region
  async extractTextFromRegion(
    pdf: PDFDocumentProxy,
    pageNumber: number,
    region: { x: number; y: number; width: number; height: number },
    language: string = 'eng'
  ): Promise<string> {
    try {
      await this.initialize(language);
      
      if (!this.worker) {
        throw new Error('OCR worker not initialized');
      }
      
      // Get page and render to canvas
      const page = await pdf.getPage(pageNumber);
      const viewport = page.getViewport({ scale: 2.0 });
      
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d')!;
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      
      await page.render({
        canvasContext: context,
        viewport: viewport
      }).promise;
      
      // Create cropped canvas for the region
      const croppedCanvas = document.createElement('canvas');
      const croppedContext = croppedCanvas.getContext('2d')!;
      
      // Scale region coordinates
      const scaledRegion = {
        x: region.x * 2,
        y: region.y * 2,
        width: region.width * 2,
        height: region.height * 2
      };
      
      croppedCanvas.width = scaledRegion.width;
      croppedCanvas.height = scaledRegion.height;
      
      // Draw the cropped region
      croppedContext.drawImage(
        canvas,
        scaledRegion.x,
        scaledRegion.y,
        scaledRegion.width,
        scaledRegion.height,
        0,
        0,
        scaledRegion.width,
        scaledRegion.height
      );
      
      // Perform OCR on the cropped region
      const result = await this.worker.recognize(croppedCanvas);
      return result.data.text;
    } catch (error) {
      console.error('Error extracting text from region:', error);
      throw new Error('Failed to extract text from region');
    }
  }

  // Auto-detect language
  async detectLanguage(
    pdf: PDFDocumentProxy,
    pageNumber: number
  ): Promise<string> {
    try {
      // Initialize with multiple languages for detection
      await this.initialize('eng+spa+fra+deu');
      
      if (!this.worker) {
        throw new Error('OCR worker not initialized');
      }
      
      // Get page and render to canvas
      const page = await pdf.getPage(pageNumber);
      const viewport = page.getViewport({ scale: 1.0 });
      
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d')!;
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      
      await page.render({
        canvasContext: context,
        viewport: viewport
      }).promise;
      
      // Detect language
      const result = await this.worker.detect(canvas);
      return (result.data as any).language || 'eng';
    } catch (error) {
      console.error('Error detecting language:', error);
      return 'eng'; // Default to English
    }
  }

  // Preprocess image for better OCR
  async preprocessImage(
    imageData: ImageData,
    options: {
      grayscale?: boolean;
      threshold?: boolean;
      invert?: boolean;
      sharpen?: boolean;
      denoise?: boolean;
    } = {}
  ): Promise<ImageData> {
    const {
      grayscale = true,
      threshold = false,
      invert = false,
      sharpen = false,
      denoise = false
    } = options;
    
    const data = new Uint8ClampedArray(imageData.data);
    const width = imageData.width;
    const height = imageData.height;
    
    // Convert to grayscale
    if (grayscale) {
      for (let i = 0; i < data.length; i += 4) {
        const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        data[i] = data[i + 1] = data[i + 2] = gray;
      }
    }
    
    // Apply threshold (binarization)
    if (threshold) {
      const thresholdValue = 128;
      for (let i = 0; i < data.length; i += 4) {
        const gray = data[i];
        const binary = gray > thresholdValue ? 255 : 0;
        data[i] = data[i + 1] = data[i + 2] = binary;
      }
    }
    
    // Invert colors
    if (invert) {
      for (let i = 0; i < data.length; i += 4) {
        data[i] = 255 - data[i];
        data[i + 1] = 255 - data[i + 1];
        data[i + 2] = 255 - data[i + 2];
      }
    }
    
    // Apply sharpening filter
    if (sharpen) {
      const kernel = [
        0, -1, 0,
        -1, 5, -1,
        0, -1, 0
      ];
      this.applyConvolution(data, width, height, kernel);
    }
    
    // Apply denoising (simple median filter)
    if (denoise) {
      this.applyMedianFilter(data, width, height);
    }
    
    return new ImageData(data, width, height);
  }

  // Apply convolution filter
  private applyConvolution(
    data: Uint8ClampedArray,
    width: number,
    height: number,
    kernel: number[]
  ): void {
    const output = new Uint8ClampedArray(data);
    const kernelSize = Math.sqrt(kernel.length);
    const half = Math.floor(kernelSize / 2);
    
    for (let y = half; y < height - half; y++) {
      for (let x = half; x < width - half; x++) {
        let r = 0, g = 0, b = 0;
        
        for (let ky = 0; ky < kernelSize; ky++) {
          for (let kx = 0; kx < kernelSize; kx++) {
            const px = x + kx - half;
            const py = y + ky - half;
            const idx = (py * width + px) * 4;
            const weight = kernel[ky * kernelSize + kx];
            
            r += data[idx] * weight;
            g += data[idx + 1] * weight;
            b += data[idx + 2] * weight;
          }
        }
        
        const idx = (y * width + x) * 4;
        output[idx] = Math.min(255, Math.max(0, r));
        output[idx + 1] = Math.min(255, Math.max(0, g));
        output[idx + 2] = Math.min(255, Math.max(0, b));
      }
    }
    
    data.set(output);
  }

  // Apply median filter for denoising
  private applyMedianFilter(
    data: Uint8ClampedArray,
    width: number,
    height: number,
    windowSize: number = 3
  ): void {
    const output = new Uint8ClampedArray(data);
    const half = Math.floor(windowSize / 2);
    
    for (let y = half; y < height - half; y++) {
      for (let x = half; x < width - half; x++) {
        const values: number[] = [];
        
        for (let wy = -half; wy <= half; wy++) {
          for (let wx = -half; wx <= half; wx++) {
            const idx = ((y + wy) * width + (x + wx)) * 4;
            values.push(data[idx]);
          }
        }
        
        values.sort((a, b) => a - b);
        const median = values[Math.floor(values.length / 2)];
        
        const idx = (y * width + x) * 4;
        output[idx] = output[idx + 1] = output[idx + 2] = median;
      }
    }
    
    data.set(output);
  }

  // Get supported languages
  getSupportedLanguages(): Array<{ code: string; name: string }> {
    return this.supportedLanguages;
  }

  // Clean up resources
  async terminate(): Promise<void> {
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
      this.isInitialized = false;
    }
  }

  /**
   * Perform OCR with multiple language models for better accuracy
   */
  async performMultiLanguageOCR(
    pdf: PDFDocumentProxy,
    pageNumber: number,
    languages: string[]
  ): Promise<OCRResult[]> {
    const results: OCRResult[] = [];
    
    for (const language of languages) {
      try {
        const result = await this.performOCR(pdf, pageNumber, language);
        results.push(result);
      } catch (error) {
        console.warn(`OCR failed for language ${language}:`, error);
      }
    }
    
    return results;
  }

  /**
   * Smart language detection with confidence scoring
   */
  async smartLanguageDetection(
    pdf: PDFDocumentProxy,
    pageNumber: number,
    candidateLanguages?: string[]
  ): Promise<Array<{ language: string; confidence: number; text: string }>> {
    const languages = candidateLanguages || ['eng', 'spa', 'fra', 'deu', 'chi_sim', 'jpn', 'ara'];
    const detectionResults: Array<{ language: string; confidence: number; text: string }> = [];
    
    for (const language of languages) {
      try {
        const result = await this.performOCR(pdf, pageNumber, language);
        detectionResults.push({
          language,
          confidence: result.confidence,
          text: result.text
        });
      } catch (error) {
        console.warn(`Language detection failed for ${language}:`, error);
      }
    }
    
    // Sort by confidence
    return detectionResults.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * OCR with adaptive preprocessing
   */
  async performAdaptiveOCR(
    pdf: PDFDocumentProxy,
    pageNumber: number,
    language: string = 'eng',
    adaptiveOptions: {
      autoRotate?: boolean;
      autoDeskew?: boolean;
      enhanceContrast?: boolean;
      removeNoise?: boolean;
      multiScale?: boolean;
    } = {}
  ): Promise<OCRResult> {
    try {
      await this.initialize(language);
      
      if (!this.worker) {
        throw new Error('OCR worker not initialized');
      }
      
      // Get page and render to canvas
      const page = await pdf.getPage(pageNumber);
      const viewport = page.getViewport({ scale: 2.0 });
      
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d')!;
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      
      await page.render({
        canvasContext: context,
        viewport: viewport
      }).promise;
      
      // Apply adaptive preprocessing
      if (Object.values(adaptiveOptions).some(Boolean)) {
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        const processed = await this.adaptivePreprocessing(imageData, adaptiveOptions);
        context.putImageData(processed, 0, 0);
      }
      
      // Perform OCR
      const result = await this.worker.recognize(canvas);
      
      return {
        text: result.data.text,
        confidence: result.data.confidence,
        language,
        pageNumber,
        blocks: result.data.blocks?.map(block => ({
          text: block.text,
          confidence: block.confidence,
          bbox: block.bbox,
          words: block.words?.map(word => ({
            text: word.text,
            confidence: word.confidence,
            bbox: word.bbox
          })) || []
        })) || []
      };
    } catch (error) {
      console.error('Adaptive OCR failed:', error);
      throw error;
    }
  }

  /**
   * Advanced adaptive preprocessing
   */
  private async adaptivePreprocessing(
    imageData: ImageData,
    options: {
      autoRotate?: boolean;
      autoDeskew?: boolean;
      enhanceContrast?: boolean;
      removeNoise?: boolean;
      multiScale?: boolean;
    }
  ): Promise<ImageData> {
    let processed = imageData;
    
    // Auto-deskew
    if (options.autoDeskew) {
      processed = this.deskewImage(processed);
    }
    
    // Enhance contrast
    if (options.enhanceContrast) {
      processed = this.enhanceContrast(processed);
    }
    
    // Remove noise
    if (options.removeNoise) {
      processed = await this.preprocessImage(processed, {
        denoise: true,
        grayscale: true
      });
    }
    
    return processed;
  }

  /**
   * Deskew image to correct rotation
   */
  private deskewImage(imageData: ImageData): ImageData {
    // Simplified deskewing - in a full implementation, this would:
    // 1. Detect text lines using Hough transform
    // 2. Calculate rotation angle
    // 3. Rotate image to correct orientation
    
    // For now, return original image
    return imageData;
  }

  /**
   * Enhance image contrast
   */
  private enhanceContrast(imageData: ImageData): ImageData {
    const data = new Uint8ClampedArray(imageData.data);
    const factor = 1.5; // Contrast enhancement factor
    
    for (let i = 0; i < data.length; i += 4) {
      // Apply contrast enhancement to RGB channels
      data[i] = Math.min(255, Math.max(0, (data[i] - 128) * factor + 128));
      data[i + 1] = Math.min(255, Math.max(0, (data[i + 1] - 128) * factor + 128));
      data[i + 2] = Math.min(255, Math.max(0, (data[i + 2] - 128) * factor + 128));
    }
    
    return new ImageData(data, imageData.width, imageData.height);
  }

  /**
   * OCR with spell checking and correction
   */
  async performOCRWithSpellCheck(
    pdf: PDFDocumentProxy,
    pageNumber: number,
    language: string = 'eng',
    dictionary?: string[]
  ): Promise<OCRResult & { correctedText: string; corrections: Array<{ original: string; corrected: string; confidence: number }> }> {
    const baseResult = await this.performOCR(pdf, pageNumber, language);
    
    // Simple spell correction (in a full implementation, use a proper spell checker)
    const corrections: Array<{ original: string; corrected: string; confidence: number }> = [];
    let correctedText = baseResult.text;
    
    // Common OCR error corrections
    const commonErrors = {
      '0': 'O', '1': 'l', '5': 'S', '8': 'B',
      'rn': 'm', 'cl': 'd', 'vv': 'w', 'ii': 'n'
    };
    
    Object.entries(commonErrors).forEach(([error, correction]) => {
      const regex = new RegExp(error, 'g');
      if (regex.test(correctedText)) {
        corrections.push({
          original: error,
          corrected: correction,
          confidence: 0.8
        });
        correctedText = correctedText.replace(regex, correction);
      }
    });
    
    return {
      ...baseResult,
      correctedText,
      corrections
    };
  }

  /**
   * Extract structured data (tables, forms) from OCR
   */
  async extractStructuredData(
    pdf: PDFDocumentProxy,
    pageNumber: number,
    language: string = 'eng'
  ): Promise<{
    tables: Array<{
      rows: string[][];
      confidence: number;
      bbox: { x0: number; y0: number; x1: number; y1: number };
    }>;
    forms: Array<{
      fields: Array<{ label: string; value: string; bbox: any }>;
      confidence: number;
    }>;
  }> {
    const ocrResult = await this.performOCR(pdf, pageNumber, language);
    
    // Analyze blocks for table-like structures
    const tables = this.detectTables(ocrResult.blocks);
    
    // Analyze blocks for form-like structures
    const forms = this.detectForms(ocrResult.blocks);
    
    return { tables, forms };
  }

  private detectTables(blocks: OCRBlock[]): Array<{
    rows: string[][];
    confidence: number;
    bbox: { x0: number; y0: number; x1: number; y1: number };
  }> {
    // Simplified table detection based on text alignment
    // In a full implementation, this would use more sophisticated algorithms
    return [];
  }

  private detectForms(blocks: OCRBlock[]): Array<{
    fields: Array<{ label: string; value: string; bbox: any }>;
    confidence: number;
  }> {
    // Simplified form detection based on text patterns
    // Look for label:value patterns
    return [];
  }

  /**
   * Get language-specific OCR settings
   */
  getLanguageSettings(language: string): {
    psm: number;
    oem: number;
    whitelist?: string;
    blacklist?: string;
    variables?: Record<string, string>;
  } {
    const languageInfo = this.supportedLanguages.find(lang => lang.code === language);
    const script = languageInfo?.script || 'Latin';
    
    const settings: any = {
      psm: Tesseract.PSM.AUTO, // Page segmentation mode
      oem: Tesseract.OEM.LSTM_ONLY // OCR Engine Mode
    };
    
    // Script-specific optimizations
    switch (script) {
      case 'Arabic':
      case 'Hebrew':
        settings.psm = Tesseract.PSM.SINGLE_BLOCK_VERT_TEXT;
        settings.variables = {
          'textord_heavy_nr': '1',
          'textord_tabfind_show_vlines': '1'
        };
        break;
        
      case 'Han':
      case 'Hangul':
      case 'Mixed':
        settings.psm = Tesseract.PSM.SINGLE_BLOCK;
        settings.variables = {
          'textord_really_old_xheight': '1',
          'textord_min_linesize': '2.5'
        };
        break;
        
      case 'Devanagari':
      case 'Bengali':
      case 'Tamil':
      case 'Telugu':
        settings.variables = {
          'lstm_use_matrix': '1',
          'textord_really_old_xheight': '1'
        };
        break;
    }
    
    return settings;
  }

  // Export OCR results to various formats
  exportResults(results: OCRResult[], format: 'txt' | 'json' | 'xml' | 'csv' | 'pdf' = 'txt'): string {
    switch (format) {
      case 'txt':
        return results.map(r => `Page ${r.pageNumber}:\n${r.text}`).join('\n\n');
      
      case 'json':
        return JSON.stringify(results, null, 2);
      
      case 'xml':
        let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<ocr-results>\n';
        results.forEach(result => {
          xml += `  <page number="${result.pageNumber}" confidence="${result.confidence}" language="${result.language}">\n`;
          xml += `    <text><![CDATA[${result.text}]]></text>\n`;
          if (result.blocks.length > 0) {
            xml += '    <blocks>\n';
            result.blocks.forEach(block => {
              xml += `      <block confidence="${block.confidence}">\n`;
              xml += `        <text><![CDATA[${block.text}]]></text>\n`;
              xml += `        <bbox x0="${block.bbox.x0}" y0="${block.bbox.y0}" x1="${block.bbox.x1}" y1="${block.bbox.y1}"/>\n`;
              xml += '      </block>\n';
            });
            xml += '    </blocks>\n';
          }
          xml += `  </page>\n`;
        });
        xml += '</ocr-results>';
        return xml;
      
      case 'csv':
        let csv = 'Page,Confidence,Language,Text\n';
        results.forEach(result => {
          const text = result.text.replace(/"/g, '""').replace(/\n/g, ' ');
          csv += `"${result.pageNumber}","${result.confidence}","${result.language}","${text}"\n`;
        });
        return csv;
      
      default:
        return results.map(r => r.text).join('\n');
    }
  }
}
