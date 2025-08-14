/**
 * BasicPDFService - A simplified, working PDF service 
 * This replaces the complex, broken PDFService with basic functionality that actually works
 */

import { PDFDocument, rgb, StandardFonts, PDFPage } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocumentProxy } from 'pdfjs-dist/types/src/display/api';

export interface BasicAnnotation {
  id: string;
  type: 'text' | 'rectangle' | 'highlight';
  x: number;
  y: number;
  width: number;
  height: number;
  pageIndex: number;
  text?: string;
  color?: { r: number; g: number; b: number };
  fontSize?: number;
}

export class BasicPDFService {
  private pdfBytes: Uint8Array | null = null;
  private originalPdfBytes: Uint8Array | null = null;
  private pdfDocument: PDFDocumentProxy | null = null;
  private fileName: string = '';

  /**
   * Load a PDF from file bytes
   */
  async loadPDF(fileBytes: Uint8Array, fileName: string = 'document.pdf'): Promise<PDFDocumentProxy> {
    try {
      console.log(`📄 Loading PDF: ${fileName} (${fileBytes.length} bytes)`);
      
      // Store original bytes and create working copy
      this.originalPdfBytes = new Uint8Array(fileBytes);
      this.pdfBytes = new Uint8Array(this.originalPdfBytes.length);
      this.pdfBytes.set(this.originalPdfBytes);
      this.fileName = fileName;
      
      // Validate PDF header before proceeding
      const header = new TextDecoder().decode(this.pdfBytes.slice(0, 8));
      if (!header.startsWith('%PDF-')) {
        throw new Error(`Invalid PDF file: missing PDF header (found: ${header})`);
      }
      
      console.log(`📋 PDF header validated: ${header.slice(0, 8)}`);
      
      // Load with PDF.js using a separate copy to avoid corruption
      const pdfJsCopy = new Uint8Array(this.pdfBytes);
      const loadingTask = pdfjsLib.getDocument(pdfJsCopy);
      this.pdfDocument = await loadingTask.promise;
      
      console.log(`✅ PDF loaded successfully: ${this.pdfDocument.numPages} pages`);
      return this.pdfDocument;
    } catch (error) {
      console.error('❌ Failed to load PDF:', error);
      throw new Error(`Failed to load PDF: ${error}`);
    }
  }

  /**
   * Save PDF with annotations (actually working implementation)
   */
  async savePDFWithAnnotations(annotations: BasicAnnotation[] = []): Promise<Uint8Array> {
    try {
      if (!this.pdfBytes) {
        throw new Error('No PDF loaded');
      }

      console.log(`💾 Saving PDF with ${annotations.length} annotations`);

      // Always use original bytes for pdf-lib to avoid any corruption
      if (!this.originalPdfBytes) {
        throw new Error('Original PDF bytes not available');
      }
      
      const freshPdfBytes = new Uint8Array(this.originalPdfBytes.length);
      freshPdfBytes.set(this.originalPdfBytes);
      
      // Validate the bytes before sending to pdf-lib
      const header = new TextDecoder().decode(freshPdfBytes.slice(0, 8));
      if (!header.startsWith('%PDF-')) {
        console.error(`❌ Invalid PDF bytes for save: ${header}`);
        throw new Error(`PDF bytes corrupted - invalid header: ${header}`);
      }
      
      console.log(`📋 PDF bytes validated for save: ${header.slice(0, 8)} (${freshPdfBytes.length} bytes)`);

      // Load the PDF with pdf-lib for editing
      const pdfDoc = await PDFDocument.load(freshPdfBytes);
      const pages = pdfDoc.getPages();
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

      console.log(`📝 Applying ${annotations.length} annotations to ${pages.length} pages`);

      // Apply annotations to pages
      for (const annotation of annotations) {
        if (annotation.pageIndex >= 0 && annotation.pageIndex < pages.length) {
          const page = pages[annotation.pageIndex];
          await this.applyAnnotationToPage(page, annotation, font);
          console.log(`✅ Applied ${annotation.type} annotation to page ${annotation.pageIndex + 1}`);
        }
      }

      // Save the modified PDF with safe ArrayBuffer handling
      const savedBytes = await pdfDoc.save();
      
      // CRITICAL FIX: Prevent ArrayBuffer detachment
      let result: Uint8Array;
      try {
        // Method 1: Use Uint8Array.from which creates a new buffer
        result = Uint8Array.from(savedBytes);
        console.log(`✅ Created safe annotation copy using Uint8Array.from: ${result.byteLength} bytes`);
      } catch (e) {
        console.warn('⚠️ Uint8Array.from failed, using fallback method');
        try {
          // Method 2: Manual byte-by-byte copy
          const length = savedBytes.length || savedBytes.byteLength;
          const buffer = new ArrayBuffer(length);
          const view = new Uint8Array(buffer);
          for (let i = 0; i < length; i++) {
            view[i] = savedBytes[i] || 0;
          }
          result = view;
          console.log(`✅ Created safe annotation copy using manual copy: ${result.byteLength} bytes`);
        } catch (e2) {
          console.error('❌ All copy methods failed:', e2);
          throw new Error('Failed to create safe PDF bytes after annotation save');
        }
      }
      
      console.log(`✅ PDF saved successfully: ${result.length} bytes`);
      return result;
    } catch (error) {
      console.error('❌ Failed to save PDF:', error);
      console.error('❌ Error details:', error.message);
      throw new Error(`Failed to save PDF: ${error.message}`);
    }
  }

  /**
   * Apply a single annotation to a PDF page
   */
  private async applyAnnotationToPage(page: PDFPage, annotation: BasicAnnotation, font: any): Promise<void> {
    try {
      const { width, height } = page.getSize();
      
      // Ensure coordinates are valid
      const x = Math.max(0, Math.min(annotation.x, width - 10));
      const y = Math.max(0, Math.min(height - annotation.y - (annotation.height || 20), height - 20));
      
      const color = annotation.color ? 
        rgb(annotation.color.r, annotation.color.g, annotation.color.b) : 
        rgb(0, 0, 0);

      switch (annotation.type) {
        case 'text':
          if (annotation.text) {
            page.drawText(annotation.text, {
              x,
              y,
              size: annotation.fontSize || 12,
              font,
              color
            });
          }
          break;

        case 'rectangle':
          page.drawRectangle({
            x,
            y,
            width: Math.min(annotation.width, width - x),
            height: Math.min(annotation.height, height - (height - annotation.y)),
            borderColor: color,
            borderWidth: 1
          });
          break;

        case 'highlight':
          page.drawRectangle({
            x,
            y,
            width: Math.min(annotation.width, width - x),
            height: Math.min(annotation.height, height - (height - annotation.y)),
            color: rgb(
              Math.min(annotation.color?.r || 1, 1),
              Math.min(annotation.color?.g || 1, 1), 
              Math.min(annotation.color?.b || 0, 1)
            ),
            opacity: 0.3
          });
          break;
      }
    } catch (error) {
      console.warn(`⚠️ Failed to apply ${annotation.type} annotation:`, error);
      // Don't throw - continue with other annotations
    }
  }

  /**
   * Get the current PDF bytes
   */
  getPDFBytes(): Uint8Array | null {
    return this.pdfBytes;
  }

  /**
   * Get the current PDF document
   */
  getPDFDocument(): PDFDocumentProxy | null {
    return this.pdfDocument;
  }

  /**
   * Get the current file name
   */
  getFileName(): string {
    return this.fileName;
  }

  /**
   * Extract text from a specific page
   */
  async extractTextFromPage(pageNumber: number): Promise<string> {
    try {
      if (!this.pdfDocument) {
        throw new Error('No PDF loaded');
      }

      const page = await this.pdfDocument.getPage(pageNumber);
      const textContent = await page.getTextContent();
      
      return textContent.items
        .map((item: any) => item.str)
        .join(' ');
    } catch (error) {
      console.error(`❌ Failed to extract text from page ${pageNumber}:`, error);
      return '';
    }
  }

  /**
   * Create a simple form field
   */
  async addSimpleFormField(fieldName: string, x: number, y: number, width: number, height: number, pageIndex: number): Promise<Uint8Array> {
    try {
      if (!this.pdfBytes) {
        throw new Error('No PDF loaded');
      }

      const pdfDoc = await PDFDocument.load(this.pdfBytes);
      const pages = pdfDoc.getPages();
      
      if (pageIndex >= 0 && pageIndex < pages.length) {
        const page = pages[pageIndex];
        const form = pdfDoc.getForm();
        
        // Create a simple text field
        const textField = form.createTextField(fieldName);
        textField.addToPage(page, {
          x,
          y: page.getHeight() - y - height,
          width,
          height,
          borderColor: rgb(0, 0, 0),
          borderWidth: 1,
          backgroundColor: rgb(1, 1, 1)
        });
      }

      const savedBytes = await pdfDoc.save();
      // Fix ArrayBuffer detachment issue
      const result = Uint8Array.from(savedBytes);
      
      // Update our stored bytes
      this.pdfBytes = result;
      
      console.log(`✅ Form field '${fieldName}' added successfully`);
      return result;
    } catch (error) {
      console.error('❌ Failed to add form field:', error);
      throw new Error(`Failed to add form field: ${error}`);
    }
  }
}