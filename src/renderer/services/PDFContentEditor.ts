import { PDFDocument, PDFPage, rgb, StandardFonts } from 'pdf-lib';

interface TextEdit {
  pageIndex: number;
  oldText: string;
  newText: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize?: number;
  fontName?: string;
}

interface ContentEdit {
  type: 'text' | 'image' | 'shape';
  action: 'add' | 'edit' | 'delete';
  data: any;
}

export class PDFContentEditor {
  private pdfDoc: PDFDocument | null = null;
  private originalBytes: Uint8Array | null = null;
  private textEdits: Map<string, TextEdit[]> = new Map();
  private contentEdits: ContentEdit[] = [];

  /**
   * Initialize with PDF document
   */
  async initialize(pdfBytes: Uint8Array): Promise<void> {
    this.originalBytes = pdfBytes;
    this.pdfDoc = await PDFDocument.load(pdfBytes);
    this.textEdits.clear();
    this.contentEdits = [];
  }

  /**
   * Add a text edit operation
   */
  addTextEdit(edit: TextEdit): void {
    const pageKey = `page_${edit.pageIndex}`;
    
    if (!this.textEdits.has(pageKey)) {
      this.textEdits.set(pageKey, []);
    }
    
    this.textEdits.get(pageKey)!.push(edit);
  }

  /**
   * Add content edit operation
   */
  addContentEdit(edit: ContentEdit): void {
    this.contentEdits.push(edit);
  }

  /**
   * Apply all edits and return modified PDF
   */
  async applyEdits(): Promise<Uint8Array> {
    if (!this.pdfDoc || !this.originalBytes) {
      throw new Error('PDF not initialized');
    }

    // Create a new PDF document from original bytes
    const modifiedDoc = await PDFDocument.load(this.originalBytes);
    
    // Apply text edits
    await this.applyTextEdits(modifiedDoc);
    
    // Apply content edits
    await this.applyContentEdits(modifiedDoc);
    
    // Return modified PDF bytes
    return await modifiedDoc.save();
  }

  /**
   * Apply text edits to PDF document
   */
  private async applyTextEdits(doc: PDFDocument): Promise<void> {
    const font = await doc.embedFont(StandardFonts.Helvetica);
    
    for (const [pageKey, edits] of this.textEdits) {
      const pageIndex = parseInt(pageKey.split('_')[1]);
      const page = doc.getPage(pageIndex);
      
      for (const edit of edits) {
        // Remove old text by drawing a white rectangle over it
        if (edit.oldText && edit.oldText.trim() !== '') {
          page.drawRectangle({
            x: edit.x,
            y: page.getHeight() - edit.y - edit.height,
            width: edit.width,
            height: edit.height,
            color: rgb(1, 1, 1), // White to cover old text
          });
        }
        
        // Add new text
        if (edit.newText && edit.newText.trim() !== '') {
          page.drawText(edit.newText, {
            x: edit.x,
            y: page.getHeight() - edit.y - edit.height + (edit.fontSize || 12) * 0.2,
            size: edit.fontSize || 12,
            font,
            color: rgb(0, 0, 0),
          });
        }
      }
    }
  }

  /**
   * Apply content edits to PDF document
   */
  private async applyContentEdits(doc: PDFDocument): Promise<void> {
    for (const edit of this.contentEdits) {
      switch (edit.type) {
        case 'text':
          await this.applyTextContentEdit(doc, edit);
          break;
        case 'image':
          await this.applyImageContentEdit(doc, edit);
          break;
        case 'shape':
          await this.applyShapeContentEdit(doc, edit);
          break;
      }
    }
  }

  /**
   * Apply text content edit
   */
  private async applyTextContentEdit(doc: PDFDocument, edit: ContentEdit): Promise<void> {
    const { pageIndex, text, x, y, fontSize, color } = edit.data;
    const page = doc.getPage(pageIndex);
    const font = await doc.embedFont(StandardFonts.Helvetica);
    
    if (edit.action === 'add') {
      page.drawText(text, {
        x,
        y: page.getHeight() - y,
        size: fontSize || 12,
        font,
        color: color ? rgb(color.r, color.g, color.b) : rgb(0, 0, 0),
      });
    }
  }

  /**
   * Apply image content edit
   */
  private async applyImageContentEdit(doc: PDFDocument, edit: ContentEdit): Promise<void> {
    // Implementation for image editing would go here
    console.log('Image edit not yet implemented:', edit);
  }

  /**
   * Apply shape content edit
   */
  private async applyShapeContentEdit(doc: PDFDocument, edit: ContentEdit): Promise<void> {
    const { pageIndex, x, y, width, height, color, type } = edit.data;
    const page = doc.getPage(pageIndex);
    
    if (edit.action === 'add') {
      switch (type) {
        case 'rectangle':
          page.drawRectangle({
            x,
            y: page.getHeight() - y - height,
            width,
            height,
            borderColor: color ? rgb(color.r, color.g, color.b) : rgb(0, 0, 0),
            borderWidth: 2,
          });
          break;
        case 'highlight':
          page.drawRectangle({
            x,
            y: page.getHeight() - y - height,
            width,
            height,
            color: rgb(1, 1, 0),
            opacity: 0.3,
          });
          break;
      }
    }
  }

  /**
   * Get all text edits
   */
  getTextEdits(): Map<string, TextEdit[]> {
    return this.textEdits;
  }

  /**
   * Get all content edits
   */
  getContentEdits(): ContentEdit[] {
    return this.contentEdits;
  }

  /**
   * Clear all edits
   */
  clearEdits(): void {
    this.textEdits.clear();
    this.contentEdits = [];
  }

  /**
   * Undo last edit
   */
  undoLastEdit(): void {
    if (this.contentEdits.length > 0) {
      this.contentEdits.pop();
    } else {
      // Find and remove last text edit
      for (const [pageKey, edits] of this.textEdits) {
        if (edits.length > 0) {
          edits.pop();
          if (edits.length === 0) {
            this.textEdits.delete(pageKey);
          }
          break;
        }
      }
    }
  }

  /**
   * Extract editable text from PDF page
   */
  async extractEditableText(pageIndex: number): Promise<any[]> {
    if (!this.pdfDoc) return [];
    
    // This would need to interface with PDF.js to extract text with positioning
    // For now, return empty array as this requires PDF.js integration
    return [];
  }
}

export default PDFContentEditor;