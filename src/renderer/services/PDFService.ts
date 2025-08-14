import { PDFDocument, PDFPage, rgb, StandardFonts, degrees, PDFFont, PDFImage } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocumentProxy } from 'pdfjs-dist/types/src/display/api';

interface PDFMetadata {
  title?: string;
  author?: string;
  subject?: string;
  keywords?: string[];
  creator?: string;
  producer?: string;
  creationDate?: Date;
  modificationDate?: Date;
}

interface ExtractedPage {
  pageNumber: number;
  content: Uint8Array;
}

export class PDFService {
  // Core PDF operations
  private workerSrc: string = '';

  constructor() {
    // Set the worker source path based on environment
    const isDev = process.env.NODE_ENV === 'development';
    this.workerSrc = isDev
      ? '/node_modules/pdfjs-dist/build/pdf.worker.js'
      : './pdf.worker.min.js';
    
    // Configure PDF.js worker
    pdfjsLib.GlobalWorkerOptions.workerSrc = this.workerSrc;
  }

  /**
   * Load a PDF document from binary data
   * @param data PDF binary data
   * @returns Promise with PDF document proxy
   */
  async loadPDF(data: Uint8Array): Promise<PDFDocumentProxy> {
    try {
      console.log('Loading PDF document...');
      
      // Configure PDF.js
      const loadingTask = pdfjsLib.getDocument({
        data,
        cMapUrl: process.env.NODE_ENV === 'development'
          ? '/node_modules/pdfjs-dist/cmaps/'
          : './cmaps/',
        cMapPacked: true,
        useWorkerFetch: true,
        isEvalSupported: false,
        useSystemFonts: true
      });
      
      // Set up progress tracking
      loadingTask.onProgress = (progress) => {
        const percent = Math.round((progress.loaded / progress.total) * 100);
        console.log(`Loading PDF: ${percent}%`);
      };
      
      const pdf = await loadingTask.promise;
      console.log(`PDF loaded successfully. Pages: ${pdf.numPages}`);
      return pdf;
      
    } catch (error) {
      console.error('Error loading PDF:', error);
      throw new Error(`Failed to load PDF document: ${error.message}`);
    }
  }

  async createPDF(): Promise<PDFDocument> {
    return await PDFDocument.create();
  }

  async copyPages(
    sourcePdf: PDFDocument,
    pageIndices: number[]
  ): Promise<PDFPage[]> {
    return await sourcePdf.copyPages(sourcePdf, pageIndices);
  }

  // Merge multiple PDFs into one
  async mergePDFs(pdfBuffers: Uint8Array[]): Promise<Uint8Array> {
    const mergedPdf = await PDFDocument.create();
    
    for (const buffer of pdfBuffers) {
      const pdf = await PDFDocument.load(buffer);
      const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
      pages.forEach(page => mergedPdf.addPage(page));
    }
    
    return await mergedPdf.save();
  }

  // Split PDF at specified page
  async splitPDF(
    pdfBytes: Uint8Array,
    splitPage: number
  ): Promise<{ first: Uint8Array; second: Uint8Array }> {
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const totalPages = pdfDoc.getPageCount();
    
    if (splitPage < 1 || splitPage >= totalPages) {
      throw new Error('Invalid split page number');
    }
    
    // Create first part
    const firstPdf = await PDFDocument.create();
    const firstPages = await firstPdf.copyPages(
      pdfDoc,
      Array.from({ length: splitPage }, (_, i) => i)
    );
    firstPages.forEach(page => firstPdf.addPage(page));
    
    // Create second part
    const secondPdf = await PDFDocument.create();
    const secondPages = await secondPdf.copyPages(
      pdfDoc,
      Array.from({ length: totalPages - splitPage }, (_, i) => i + splitPage)
    );
    secondPages.forEach(page => secondPdf.addPage(page));
    
    return {
      first: await firstPdf.save(),
      second: await secondPdf.save()
    };
  }

  // Extract specific pages
  async extractPages(
    pdfBytes: Uint8Array,
    pageNumbers: number[]
  ): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const extractedPdf = await PDFDocument.create();
    
    // Convert page numbers to indices (0-based)
    const indices = pageNumbers.map(num => num - 1);
    const pages = await extractedPdf.copyPages(pdfDoc, indices);
    pages.forEach(page => extractedPdf.addPage(page));
    
    return await extractedPdf.save();
  }

  // Rotate pages
  async rotatePages(
    pdfBytes: Uint8Array,
    rotation: number,
    pageNumbers?: number[]
  ): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const pages = pdfDoc.getPages();
    
    const targetPages = pageNumbers 
      ? pageNumbers.map(n => pages[n - 1])
      : pages;
    
    targetPages.forEach(page => {
      const currentRotation = page.getRotation();
      page.setRotation(degrees(currentRotation.angle + rotation));
    });
    
    return await pdfDoc.save();
  }

  // Insert blank page
  async insertBlankPage(
    pdfBytes: Uint8Array,
    afterPage: number,
    width: number = 595.28, // A4 width in points
    height: number = 841.89 // A4 height in points
  ): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const page = pdfDoc.insertPage(afterPage, [width, height]);
    
    // Add placeholder text
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    page.drawText('Blank Page', {
      x: 50,
      y: height - 50,
      size: 10,
      font,
      color: rgb(0.8, 0.8, 0.8)
    });
    
    return await pdfDoc.save();
  }

  // Delete pages
  async deletePages(
    pdfBytes: Uint8Array,
    pageNumbers: number[]
  ): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.load(pdfBytes);
    
    // Sort in descending order to avoid index shifting issues
    const sortedPages = [...pageNumbers].sort((a, b) => b - a);
    
    sortedPages.forEach(pageNum => {
      if (pageNum > 0 && pageNum <= pdfDoc.getPageCount()) {
        pdfDoc.removePage(pageNum - 1);
      }
    });
    
    return await pdfDoc.save();
  }

  // Compress PDF (simplified compression)
  async compressPDF(
    pdfBytes: Uint8Array,
    quality: 'low' | 'medium' | 'high' = 'medium'
  ): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.load(pdfBytes);
    
    // Compression options based on quality
    const options = {
      low: { useObjectStreams: true, compress: true },
      medium: { useObjectStreams: false, compress: true },
      high: { useObjectStreams: false, compress: false }
    };
    
    const saveOptions = options[quality];
    return await pdfDoc.save(saveOptions);
  }

  // Add watermark to PDF
  async addWatermark(
    pdfBytes: Uint8Array,
    watermarkText: string,
    options: {
      fontSize?: number;
      opacity?: number;
      rotation?: number;
      color?: { r: number; g: number; b: number };
    } = {}
  ): Promise<Uint8Array> {
    const {
      fontSize = 50,
      opacity = 0.3,
      rotation = 45,
      color = { r: 0.5, g: 0.5, b: 0.5 }
    } = options;
    
    // Create safe copy to prevent ArrayBuffer detachment
    const safePdfBytes = new Uint8Array(pdfBytes.buffer.slice(pdfBytes.byteOffset, pdfBytes.byteOffset + pdfBytes.byteLength));
    const pdfDoc = await PDFDocument.load(safePdfBytes);
    const pages = pdfDoc.getPages();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    
    for (const page of pages) {
      const { width, height } = page.getSize();
      const textWidth = font.widthOfTextAtSize(watermarkText, fontSize);
      
      page.drawText(watermarkText, {
        x: (width - textWidth) / 2,
        y: height / 2,
        size: fontSize,
        font,
        color: rgb(color.r, color.g, color.b),
        opacity,
        rotate: degrees(rotation)
      });
    }
    
    return await pdfDoc.save();
  }

  // Add page numbers
  async addPageNumbers(
    pdfBytes: Uint8Array,
    options: {
      position?: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
      format?: string; // e.g., "Page {n} of {total}"
      fontSize?: number;
      margin?: number;
    } = {}
  ): Promise<Uint8Array> {
    const {
      position = 'bottom-center',
      format = 'Page {n} of {total}',
      fontSize = 10,
      margin = 30
    } = options;
    
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const pages = pdfDoc.getPages();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const totalPages = pages.length;
    
    pages.forEach((page, index) => {
      const { width, height } = page.getSize();
      const pageNum = index + 1;
      const text = format
        .replace('{n}', pageNum.toString())
        .replace('{total}', totalPages.toString());
      
      const textWidth = font.widthOfTextAtSize(text, fontSize);
      
      let x = margin;
      let y = margin;
      
      // Calculate position
      if (position.includes('center')) {
        x = (width - textWidth) / 2;
      } else if (position.includes('right')) {
        x = width - textWidth - margin;
      }
      
      if (position.includes('top')) {
        y = height - margin;
      }
      
      page.drawText(text, {
        x,
        y,
        size: fontSize,
        font,
        color: rgb(0, 0, 0)
      });
    });
    
    return await pdfDoc.save();
  }

  // Get PDF metadata
  async getMetadata(pdfBytes: Uint8Array): Promise<PDFMetadata> {
    const pdfDoc = await PDFDocument.load(pdfBytes);
    
    return {
      title: pdfDoc.getTitle(),
      author: pdfDoc.getAuthor(),
      subject: pdfDoc.getSubject(),
      keywords: pdfDoc.getKeywords()?.split(',').map(k => k.trim()) || [],
      creator: pdfDoc.getCreator(),
      producer: pdfDoc.getProducer(),
      creationDate: pdfDoc.getCreationDate(),
      modificationDate: pdfDoc.getModificationDate()
    };
  }

  // Set PDF metadata
  async setMetadata(
    pdfBytes: Uint8Array,
    metadata: PDFMetadata
  ): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.load(pdfBytes);
    
    if (metadata.title) pdfDoc.setTitle(metadata.title);
    if (metadata.author) pdfDoc.setAuthor(metadata.author);
    if (metadata.subject) pdfDoc.setSubject(metadata.subject);
    if (metadata.keywords && metadata.keywords.length > 0) {
      // setKeywords expects string array in pdf-lib
      pdfDoc.setKeywords(metadata.keywords);
    }
    if (metadata.creator) pdfDoc.setCreator(metadata.creator);
    if (metadata.producer) pdfDoc.setProducer(metadata.producer);
    if (metadata.creationDate) pdfDoc.setCreationDate(metadata.creationDate);
    if (metadata.modificationDate) pdfDoc.setModificationDate(metadata.modificationDate);
    
    return await pdfDoc.save();
  }

  // Optimize PDF for web
  async optimizeForWeb(pdfBytes: Uint8Array): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.load(pdfBytes);
    
    // Web optimization settings
    return await pdfDoc.save({
      useObjectStreams: false,
      addDefaultPage: false,
      objectsPerTick: 200,
      updateFieldAppearances: true
    });
  }

  // Add image to PDF
  async addImage(
    pdfBytes: Uint8Array,
    imageBytes: Uint8Array,
    pageNumber: number,
    options: {
      x: number;
      y: number;
      width?: number;
      height?: number;
      opacity?: number;
    }
  ): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const page = pdfDoc.getPage(pageNumber - 1);
    
    let image: PDFImage;
    
    // Detect image type and embed accordingly
    const uint8 = new Uint8Array(imageBytes);
    if (uint8[0] === 0xFF && uint8[1] === 0xD8) {
      // JPEG
      image = await pdfDoc.embedJpg(imageBytes);
    } else if (uint8[0] === 0x89 && uint8[1] === 0x50) {
      // PNG
      image = await pdfDoc.embedPng(imageBytes);
    } else {
      throw new Error('Unsupported image format');
    }
    
    const { width: imgWidth, height: imgHeight } = image;
    const width = options.width || imgWidth;
    const height = options.height || imgHeight;
    
    page.drawImage(image, {
      x: options.x,
      y: options.y,
      width,
      height,
      opacity: options.opacity || 1
    });
    
    return await pdfDoc.save();
  }

  // Reorder pages
  async reorderPages(
    pdfBytes: Uint8Array,
    newOrder: number[]
  ): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const reorderedPdf = await PDFDocument.create();
    
    // Convert 1-based to 0-based indices
    const indices = newOrder.map(n => n - 1);
    const pages = await reorderedPdf.copyPages(pdfDoc, indices);
    pages.forEach(page => reorderedPdf.addPage(page));
    
    return await reorderedPdf.save();
  }

  // Get page dimensions
  async getPageDimensions(
    pdfBytes: Uint8Array,
    pageNumber: number
  ): Promise<{ width: number; height: number; rotation: number }> {
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const page = pdfDoc.getPage(pageNumber - 1);
    const { width, height } = page.getSize();
    const rotation = page.getRotation();
    
    return {
      width,
      height,
      rotation: rotation.angle
    };
  }

  // Advanced page manipulation tools
  
  /**
   * Crop pages to specified dimensions
   */
  async cropPages(
    pdfBytes: Uint8Array,
    cropArea: { x: number; y: number; width: number; height: number },
    pageNumbers?: number[]
  ): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const pages = pdfDoc.getPages();
    
    const targetPages = pageNumbers 
      ? pageNumbers.map(n => pages[n - 1]).filter(p => p)
      : pages;
    
    targetPages.forEach(page => {
      page.setCropBox(cropArea.x, cropArea.y, cropArea.width, cropArea.height);
    });
    
    return await pdfDoc.save();
  }

  /**
   * Batch process multiple PDFs
   */
  async batchProcess(
    operations: Array<{
      type: 'merge' | 'split' | 'rotate' | 'compress' | 'watermark';
      inputFiles: Uint8Array[];
      options?: any;
    }>
  ): Promise<Uint8Array[]> {
    const results: Uint8Array[] = [];
    
    for (const operation of operations) {
      try {
        switch (operation.type) {
          case 'merge':
            const merged = await this.mergePDFs(operation.inputFiles);
            results.push(merged);
            break;
            
          case 'rotate':
            for (const file of operation.inputFiles) {
              const rotated = await this.rotatePages(
                file,
                operation.options?.rotation || 90,
                operation.options?.pageNumbers
              );
              results.push(rotated);
            }
            break;
            
          case 'compress':
            for (const file of operation.inputFiles) {
              const compressed = await this.compressPDF(
                file,
                operation.options?.quality || 'medium'
              );
              results.push(compressed);
            }
            break;
            
          case 'watermark':
            for (const file of operation.inputFiles) {
              const watermarked = await this.addWatermark(
                file,
                operation.options?.text || 'WATERMARK',
                operation.options?.options || {}
              );
              results.push(watermarked);
            }
            break;
            
          default:
            console.warn(`Unsupported batch operation: ${operation.type}`);
            break;
        }
      } catch (error) {
        console.error(`Batch operation ${operation.type} failed:`, error);
        // Continue with other operations
      }
    }
    
    return results;
  }
}
