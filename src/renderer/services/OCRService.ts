import Tesseract from 'tesseract.js';
import { PDFDocumentProxy } from 'pdfjs-dist/types/src/display/api';

interface OCRResult {
  text: string;
  confidence: number;
  blocks: OCRBlock[];
  language: string;
  pageNumber: number;
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
  
  // Supported languages
  private readonly supportedLanguages = [
    { code: 'eng', name: 'English' },
    { code: 'spa', name: 'Spanish' },
    { code: 'fra', name: 'French' },
    { code: 'deu', name: 'German' },
    { code: 'ita', name: 'Italian' },
    { code: 'por', name: 'Portuguese' },
    { code: 'rus', name: 'Russian' },
    { code: 'chi_sim', name: 'Chinese (Simplified)' },
    { code: 'chi_tra', name: 'Chinese (Traditional)' },
    { code: 'jpn', name: 'Japanese' },
    { code: 'kor', name: 'Korean' },
    { code: 'ara', name: 'Arabic' },
    { code: 'hin', name: 'Hindi' }
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
      
      // Create new worker
      this.worker = await Tesseract.createWorker({
        logger: (m) => {
          if (m.status === 'recognizing text') {
            // Emit progress event
            this.onProgress?.(m.progress);
          }
        }
      });
      
      await this.worker.loadLanguage(language);
      await this.worker.initialize(language);
      
      // Set OCR parameters for better accuracy
      await this.worker.setParameters({
        tessedit_pageseg_mode: Tesseract.PSM.AUTO,
        preserve_interword_spaces: '1',
        tessedit_char_whitelist: ' !"#$%&\'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~'
      });
      
      this.currentLanguage = language;
      this.isInitialized = true;
    } catch (error) {
      console.error('Error initializing OCR service:', error);
      throw new Error('Failed to initialize OCR service');
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
        throw new Error('OCR worker not initialized');
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
        blocks: result.data.blocks.map(block => ({
          text: block.text,
          confidence: block.confidence,
          bbox: block.bbox,
          words: block.words?.map(word => ({
            text: word.text,
            confidence: word.confidence,
            bbox: word.bbox
          })) || []
        }))
      };
      
      return ocrResult;
    } catch (error) {
      console.error('Error performing OCR:', error);
      throw new Error(`OCR failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
      return result.data;
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

  // Export OCR results to various formats
  exportResults(results: OCRResult[], format: 'txt' | 'json' | 'xml' = 'txt'): string {
    switch (format) {
      case 'txt':
        return results.map(r => `Page ${r.pageNumber}:\n${r.text}`).join('\n\n');
      
      case 'json':
        return JSON.stringify(results, null, 2);
      
      case 'xml':
        let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<ocr-results>\n';
        results.forEach(result => {
          xml += `  <page number="${result.pageNumber}" confidence="${result.confidence}">\n`;
          xml += `    <text><![CDATA[${result.text}]]></text>\n`;
          xml += `  </page>\n`;
        });
        xml += '</ocr-results>';
        return xml;
      
      default:
        return results.map(r => r.text).join('\n');
    }
  }
}
