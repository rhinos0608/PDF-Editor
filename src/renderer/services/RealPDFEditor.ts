import { PDFDocument, PDFPage, StandardFonts, rgb, degrees, PDFFont } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';

interface TextEditOperation {
  pageIndex: number;
  originalText: string;
  newText: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  fontName: string;
  color: { r: number; g: number; b: number };
}

interface ExtractedText {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  fontName: string;
  transform: number[];
}

export class RealPDFEditor {
  private originalPdfBytes: Uint8Array | null = null;
  private pdfDocument: PDFDocument | null = null;
  private pdfjsDocument: pdfjsLib.PDFDocumentProxy | null = null;
  private textEditOperations: TextEditOperation[] = [];
  private extractedTextCache: Map<number, ExtractedText[]> = new Map();

  /**
   * Initialize with PDF bytes
   */
  async initialize(pdfBytes: Uint8Array): Promise<void> {
    try {
      // Store original bytes
      this.originalPdfBytes = pdfBytes;
      
      // Load with pdf-lib for editing
      this.pdfDocument = await PDFDocument.load(pdfBytes);
      
      // Load with PDF.js for text extraction
      const loadingTask = pdfjsLib.getDocument(pdfBytes);
      this.pdfjsDocument = await loadingTask.promise;
      
      // Clear caches
      this.textEditOperations = [];
      this.extractedTextCache.clear();
      
      console.log('✅ Real PDF Editor initialized');
    } catch (error) {
      console.error('❌ Failed to initialize PDF editor:', error);
      throw error;
    }
  }

  /**
   * Extract actual text content with positioning from a page
   */
  async extractTextFromPage(pageIndex: number): Promise<ExtractedText[]> {
    if (!this.pdfjsDocument) {
      throw new Error('PDF document not loaded');
    }

    // Check cache first
    if (this.extractedTextCache.has(pageIndex)) {
      return this.extractedTextCache.get(pageIndex)!;
    }

    try {
      const page = await this.pdfjsDocument.getPage(pageIndex + 1); // PDF.js uses 1-based indexing
      const textContent = await page.getTextContent();
      const viewport = page.getViewport({ scale: 1.0 });
      
      const extractedTexts: ExtractedText[] = [];

      textContent.items.forEach((item: any) => {
        if (item.str && item.str.trim()) {
          const transform = item.transform;
          const x = transform[4];
          const y = viewport.height - transform[5]; // Convert to top-left origin
          const fontSize = Math.abs(transform[0]);
          
          extractedTexts.push({
            text: item.str,
            x,
            y: y - fontSize, // Adjust for baseline
            width: item.width || fontSize * item.str.length * 0.6,
            height: fontSize,
            fontSize,
            fontName: item.fontName || 'Helvetica',
            transform
          });
        }
      });

      // Cache the results
      this.extractedTextCache.set(pageIndex, extractedTexts);
      
      console.log(`📝 Extracted ${extractedTexts.length} text items from page ${pageIndex}`);
      return extractedTexts;
    } catch (error) {
      console.error('❌ Failed to extract text from page:', error);
      return [];
    }
  }

  /**
   * Find text at specific coordinates
   */
  async findTextAtCoordinates(pageIndex: number, x: number, y: number, tolerance: number = 10): Promise<ExtractedText | null> {
    const textItems = await this.extractTextFromPage(pageIndex);
    
    for (const item of textItems) {
      if (x >= item.x - tolerance && 
          x <= item.x + item.width + tolerance &&
          y >= item.y - tolerance && 
          y <= item.y + item.height + tolerance) {
        return item;
      }
    }
    
    return null;
  }

  /**
   * Edit text at specific location
   */
  async editTextAtLocation(pageIndex: number, x: number, y: number, newText: string): Promise<boolean> {
    try {
      const textItem = await this.findTextAtCoordinates(pageIndex, x, y);
      
      if (!textItem) {
        console.warn('⚠️ No text found at coordinates:', { x, y });
        return false;
      }

      // Create edit operation
      const editOperation: TextEditOperation = {
        pageIndex,
        originalText: textItem.text,
        newText,
        x: textItem.x,
        y: textItem.y,
        width: textItem.width,
        height: textItem.height,
        fontSize: textItem.fontSize,
        fontName: textItem.fontName,
        color: { r: 0, g: 0, b: 0 } // Default to black
      };

      this.textEditOperations.push(editOperation);
      
      console.log('✅ Text edit operation added:', editOperation);
      return true;
    } catch (error) {
      console.error('❌ Failed to edit text:', error);
      return false;
    }
  }

  /**
   * Replace text throughout document
   */
  async replaceText(searchText: string, replaceText: string): Promise<number> {
    if (!this.pdfjsDocument) {
      throw new Error('PDF document not loaded');
    }

    let replacementCount = 0;

    for (let pageIndex = 0; pageIndex < this.pdfjsDocument.numPages; pageIndex++) {
      const textItems = await this.extractTextFromPage(pageIndex);
      
      for (const item of textItems) {
        if (item.text.includes(searchText)) {
          const newText = item.text.replace(new RegExp(searchText, 'g'), replaceText);
          
          if (newText !== item.text) {
            const editOperation: TextEditOperation = {
              pageIndex,
              originalText: item.text,
              newText,
              x: item.x,
              y: item.y,
              width: item.width,
              height: item.height,
              fontSize: item.fontSize,
              fontName: item.fontName,
              color: { r: 0, g: 0, b: 0 }
            };

            this.textEditOperations.push(editOperation);
            replacementCount++;
          }
        }
      }
    }

    console.log(`✅ ${replacementCount} text replacements scheduled`);
    return replacementCount;
  }

  /**
   * Apply all edits and return modified PDF
   */
  async applyEdits(): Promise<Uint8Array> {
    if (!this.pdfDocument || !this.originalPdfBytes) {
      throw new Error('PDF document not loaded');
    }

    if (this.textEditOperations.length === 0) {
      console.log('ℹ️ No edits to apply');
      return this.originalPdfBytes;
    }

    try {
      // Create a new PDF document from original bytes
      const modifiedDoc = await PDFDocument.load(this.originalPdfBytes);
      const font = await modifiedDoc.embedFont(StandardFonts.Helvetica);

      console.log(`🔧 Applying ${this.textEditOperations.length} text edits...`);

      for (const edit of this.textEditOperations) {
        const page = modifiedDoc.getPage(edit.pageIndex);
        const pageHeight = page.getHeight();

        // Convert coordinates to PDF coordinate system (bottom-left origin)
        const pdfY = pageHeight - edit.y - edit.height;

        // Cover the original text with a white rectangle
        page.drawRectangle({
          x: edit.x,
          y: pdfY,
          width: edit.width,
          height: edit.height,
          color: rgb(1, 1, 1), // White
        });

        // Draw the new text
        if (edit.newText.trim()) {
          page.drawText(edit.newText, {
            x: edit.x,
            y: pdfY + edit.fontSize * 0.2, // Slight vertical adjustment
            size: edit.fontSize,
            font,
            color: rgb(edit.color.r, edit.color.g, edit.color.b),
          });
        }
      }

      const modifiedBytes = await modifiedDoc.save();
      console.log('✅ PDF edits applied successfully');
      
      return modifiedBytes;
    } catch (error) {
      console.error('❌ Failed to apply edits:', error);
      throw error;
    }
  }

  /**
   * Get all pending edit operations
   */
  getPendingEdits(): TextEditOperation[] {
    return [...this.textEditOperations];
  }

  /**
   * Clear all pending edits
   */
  clearEdits(): void {
    this.textEditOperations = [];
    console.log('🗑️ All edits cleared');
  }

  /**
   * Undo last edit
   */
  undoLastEdit(): boolean {
    if (this.textEditOperations.length > 0) {
      const removed = this.textEditOperations.pop();
      console.log('↶ Undid edit:', removed);
      return true;
    }
    return false;
  }

  /**
   * Insert new text at coordinates
   */
  async insertText(pageIndex: number, x: number, y: number, text: string, fontSize: number = 12): Promise<boolean> {
    try {
      const editOperation: TextEditOperation = {
        pageIndex,
        originalText: '',
        newText: text,
        x,
        y,
        width: fontSize * text.length * 0.6, // Estimate width
        height: fontSize,
        fontSize,
        fontName: 'Helvetica',
        color: { r: 0, g: 0, b: 0 }
      };

      this.textEditOperations.push(editOperation);
      console.log('✅ Text insertion scheduled:', editOperation);
      return true;
    } catch (error) {
      console.error('❌ Failed to insert text:', error);
      return false;
    }
  }

  /**
   * Delete text at coordinates
   */
  async deleteTextAtLocation(pageIndex: number, x: number, y: number): Promise<boolean> {
    try {
      const textItem = await this.findTextAtCoordinates(pageIndex, x, y);
      
      if (!textItem) {
        console.warn('⚠️ No text found at coordinates for deletion:', { x, y });
        return false;
      }

      const editOperation: TextEditOperation = {
        pageIndex,
        originalText: textItem.text,
        newText: '', // Empty string means delete
        x: textItem.x,
        y: textItem.y,
        width: textItem.width,
        height: textItem.height,
        fontSize: textItem.fontSize,
        fontName: textItem.fontName,
        color: { r: 1, g: 1, b: 1 } // White to cover
      };

      this.textEditOperations.push(editOperation);
      console.log('✅ Text deletion scheduled:', editOperation);
      return true;
    } catch (error) {
      console.error('❌ Failed to delete text:', error);
      return false;
    }
  }

  /**
   * Get statistics about the document
   */
  getDocumentStats(): { pages: number; pendingEdits: number } {
    return {
      pages: this.pdfjsDocument?.numPages || 0,
      pendingEdits: this.textEditOperations.length
    };
  }
}