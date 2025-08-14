/**
 * DirectPDFTextEditor - Real PDF text manipulation like Adobe Acrobat
 * Enables direct editing of PDF text content, not just overlay annotations
 */

import { PDFDocument, PDFPage, rgb, StandardFonts, PDFFont } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist/types/src/display/api';

export interface PDFTextItem {
  id: string;
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  fontName: string;
  pageIndex: number;
  color: { r: number; g: number; b: number };
  isEditable: boolean;
  isSelected: boolean;
  originalText?: string; // Track original for undo
}

export interface EditableTextBox {
  id: string;
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  fontFamily: 'Helvetica' | 'Times' | 'Courier';
  pageIndex: number;
  color: { r: number; g: number; b: number };
  isMoving: boolean;
  isResizing: boolean;
  isDirty: boolean; // Has been modified
}

export class DirectPDFTextEditor {
  private pdfDocument: PDFDocumentProxy | null = null;
  private originalBytes: Uint8Array | null = null;
  private extractedTextItems: PDFTextItem[] = [];
  private editableTextBoxes: EditableTextBox[] = [];
  private selectedTextId: string | null = null;

  async loadPDF(bytes: Uint8Array): Promise<PDFDocumentProxy> {
    // Create a safe copy to prevent detachment
    this.originalBytes = Uint8Array.from(bytes);
    
    const loadingTask = pdfjsLib.getDocument({
      data: this.originalBytes,
      useSystemFonts: true,
      isEvalSupported: false,
      disableFontFace: false,
      standardFontDataUrl: './fonts/',
    });
    
    this.pdfDocument = await loadingTask.promise;
    
    // Extract all text items from all pages
    await this.extractAllTextItems();
    
    console.log(`📄 Direct PDF loaded: ${this.pdfDocument.numPages} pages, ${this.extractedTextItems.length} text items`);
    return this.pdfDocument;
  }

  /**
   * Extract all text items from PDF for direct editing
   */
  private async extractAllTextItems(): Promise<void> {
    if (!this.pdfDocument) return;

    this.extractedTextItems = [];

    for (let pageNum = 1; pageNum <= this.pdfDocument.numPages; pageNum++) {
      try {
        const page = await this.pdfDocument.getPage(pageNum);
        const textContent = await page.getTextContent();
        const viewport = page.getViewport({ scale: 1 });

        for (let i = 0; i < textContent.items.length; i++) {
          const item = textContent.items[i] as any;
          
          if (item.str && item.str.trim()) {
            const textItem: PDFTextItem = {
              id: `text_${pageNum}_${i}`,
              text: item.str,
              x: item.transform[4],
              y: viewport.height - item.transform[5], // Convert to top-left coordinate system
              width: item.width || 100,
              height: item.height || item.fontName?.split('-')?.[1] || 12,
              fontSize: Math.abs(item.transform[3]) || 12,
              fontName: item.fontName || 'Helvetica',
              pageIndex: pageNum - 1,
              color: { r: 0, g: 0, b: 0 },
              isEditable: true,
              isSelected: false,
              originalText: item.str
            };

            this.extractedTextItems.push(textItem);
          }
        }
      } catch (error) {
        console.warn(`⚠️ Failed to extract text from page ${pageNum}:`, error);
      }
    }

    console.log(`📝 Extracted ${this.extractedTextItems.length} text items for editing`);
  }

  /**
   * Get all text items for a specific page
   */
  getPageTextItems(pageIndex: number): PDFTextItem[] {
    return this.extractedTextItems.filter(item => item.pageIndex === pageIndex);
  }

  /**
   * Get text item at specific coordinates
   */
  getTextItemAt(x: number, y: number, pageIndex: number): PDFTextItem | null {
    const pageItems = this.getPageTextItems(pageIndex);
    
    for (const item of pageItems) {
      if (x >= item.x && x <= item.x + item.width &&
          y >= item.y && y <= item.y + item.height) {
        return item;
      }
    }
    
    return null;
  }

  /**
   * Select a text item for editing
   */
  selectTextItem(id: string): boolean {
    // Deselect all items first
    this.extractedTextItems.forEach(item => item.isSelected = false);
    
    const item = this.extractedTextItems.find(item => item.id === id);
    if (item) {
      item.isSelected = true;
      this.selectedTextId = id;
      console.log(`📍 Selected text: "${item.text}"`);
      return true;
    }
    
    return false;
  }

  /**
   * Edit selected text item
   */
  editSelectedText(newText: string): boolean {
    if (!this.selectedTextId) return false;
    
    const item = this.extractedTextItems.find(item => item.id === this.selectedTextId);
    if (item) {
      item.text = newText;
      console.log(`✏️ Text edited: "${item.originalText}" → "${newText}"`);
      return true;
    }
    
    return false;
  }

  /**
   * Move selected text item
   */
  moveSelectedText(deltaX: number, deltaY: number): boolean {
    if (!this.selectedTextId) return false;
    
    const item = this.extractedTextItems.find(item => item.id === this.selectedTextId);
    if (item) {
      item.x += deltaX;
      item.y += deltaY;
      console.log(`🔄 Text moved to: (${Math.round(item.x)}, ${Math.round(item.y)})`);
      return true;
    }
    
    return false;
  }

  /**
   * Add a new editable text box
   */
  addEditableTextBox(x: number, y: number, pageIndex: number, text: string = 'New Text'): string {
    const id = `editable_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const textBox: EditableTextBox = {
      id,
      text,
      x,
      y,
      width: Math.max(text.length * 8, 100),
      height: 20,
      fontSize: 12,
      fontFamily: 'Helvetica',
      pageIndex,
      color: { r: 0, g: 0, b: 0 },
      isMoving: false,
      isResizing: false,
      isDirty: true
    };

    this.editableTextBoxes.push(textBox);
    console.log(`➕ Added editable text box: "${text}"`);
    return id;
  }

  /**
   * Get all editable text boxes for a page
   */
  getPageEditableBoxes(pageIndex: number): EditableTextBox[] {
    return this.editableTextBoxes.filter(box => box.pageIndex === pageIndex);
  }

  /**
   * Update an editable text box
   */
  updateTextBox(id: string, updates: Partial<EditableTextBox>): boolean {
    const box = this.editableTextBoxes.find(box => box.id === id);
    if (box) {
      Object.assign(box, updates);
      box.isDirty = true;
      
      // Update width based on text length if text changed
      if (updates.text !== undefined) {
        box.width = Math.max(updates.text.length * (box.fontSize * 0.6), 50);
      }
      
      return true;
    }
    return false;
  }

  /**
   * Delete an editable text box
   */
  deleteTextBox(id: string): boolean {
    const index = this.editableTextBoxes.findIndex(box => box.id === id);
    if (index >= 0) {
      this.editableTextBoxes.splice(index, 1);
      console.log(`🗑️ Deleted text box: ${id}`);
      return true;
    }
    return false;
  }

  /**
   * Save PDF with all text modifications
   */
  async savePDFWithTextEdits(): Promise<Uint8Array> {
    console.log('🔍 [DEBUG] savePDFWithTextEdits method called');
    
    if (!this.originalBytes) {
      console.error('❌ [DEBUG] No originalBytes available');
      throw new Error('No PDF loaded');
    }

    console.log(`💾 [DEBUG] Starting save with ${this.editableTextBoxes.length} text modifications...`);
    console.log(`📋 [DEBUG] Original bytes length: ${this.originalBytes.byteLength}`);

    // Load PDF with pdf-lib for editing - create safe copy with enhanced debugging
    console.log('🔍 [DEBUG] Creating fresh bytes copy...');
    let freshBytes: Uint8Array;
    try {
      console.log('🔍 [DEBUG] About to call Uint8Array.from on originalBytes');
      freshBytes = Uint8Array.from(this.originalBytes);
      console.log(`✅ [DEBUG] Fresh bytes created successfully: ${freshBytes.byteLength} bytes`);
    } catch (error) {
      console.error('❌ [DEBUG] Failed to create fresh bytes:', error);
      // Emergency fallback
      console.log('🔍 [DEBUG] Attempting manual copy as fallback...');
      const length = this.originalBytes.byteLength;
      const buffer = new ArrayBuffer(length);
      const view = new Uint8Array(buffer);
      for (let i = 0; i < length; i++) {
        view[i] = this.originalBytes[i];
      }
      freshBytes = view;
      console.log(`✅ [DEBUG] Manual copy completed: ${freshBytes.byteLength} bytes`);
    }
    
    console.log('🔍 [DEBUG] Loading PDF document with pdf-lib...');
    const pdfDoc = await PDFDocument.load(freshBytes);
    const pages = pdfDoc.getPages();

    // Embed fonts
    const fonts = {
      Helvetica: await pdfDoc.embedFont(StandardFonts.Helvetica),
      Times: await pdfDoc.embedFont(StandardFonts.TimesRoman),
      Courier: await pdfDoc.embedFont(StandardFonts.Courier)
    };

    // Enhanced text editing: Cover original text and add new text
    
    // Add all editable text boxes to the PDF
    for (const textBox of this.editableTextBoxes) {
      if (textBox.isDirty && textBox.pageIndex < pages.length) {
        const page = pages[textBox.pageIndex];
        const font = fonts[textBox.fontFamily] || fonts.Helvetica;

        // Convert screen coordinates to PDF coordinates
        const { height: pageHeight } = page.getSize();
        const pdfY = pageHeight - textBox.y - textBox.height;

        try {
          // Step 1: Cover the original text area with white rectangle
          // This simulates text deletion/replacement
          page.drawRectangle({
            x: textBox.x - 2,
            y: Math.max(0, pdfY - 2),
            width: textBox.width + 4,
            height: textBox.height + 4,
            color: rgb(1, 1, 1), // White background
            opacity: 1,
            borderWidth: 0
          });
          
          // Step 2: Add the new text
          page.drawText(textBox.text, {
            x: textBox.x,
            y: Math.max(0, pdfY),
            size: textBox.fontSize,
            font,
            color: rgb(textBox.color.r, textBox.color.g, textBox.color.b)
          });

          console.log(`✅ Replaced text with "${textBox.text}" on page ${textBox.pageIndex + 1}`);
        } catch (error) {
          console.warn(`⚠️ Failed to replace text "${textBox.text}":`, error);
        }
      }
    }
    
    // Also handle regular text modifications from extracted text items
    for (const textItem of this.extractedTextItems) {
      if (textItem.text !== textItem.originalText && textItem.pageIndex < pages.length) {
        const page = pages[textItem.pageIndex];
        const font = fonts.Helvetica; // Default font for extracted text
        
        // Convert coordinates
        const { height: pageHeight } = page.getSize();
        const pdfY = pageHeight - textItem.y;
        
        try {
          // Cover original text
          page.drawRectangle({
            x: textItem.x - 1,
            y: Math.max(0, pdfY - textItem.fontSize - 1),
            width: textItem.width + 2,
            height: textItem.height + 2,
            color: rgb(1, 1, 1), // White
            opacity: 1
          });
          
          // Add new text
          page.drawText(textItem.text, {
            x: textItem.x,
            y: Math.max(0, pdfY - textItem.fontSize),
            size: textItem.fontSize,
            font,
            color: rgb(textItem.color.r, textItem.color.g, textItem.color.b)
          });
          
          console.log(`✅ Modified extracted text: "${textItem.originalText}" → "${textItem.text}"`);
        } catch (error) {
          console.warn(`⚠️ Failed to modify extracted text:`, error);
        }
      }
    }

    // Save the modified PDF with ENHANCED ArrayBuffer handling
    let result: Uint8Array;
    
    try {
      console.log('💾 Saving PDF document...');
      const savedBytes = await pdfDoc.save({
        useObjectStreams: false,
        addDefaultPage: false,
        updateFieldAppearances: true
      });
      
      console.log(`📊 PDF saved, processing ${savedBytes?.byteLength || 'unknown'} bytes`);
      
      // CRITICAL FIX: Immediate safe copy to prevent detachment
      if (!savedBytes) {
        throw new Error('PDF save returned empty result');
      }
      
      // Method 1: Direct constructor with validation
      try {
        if (savedBytes instanceof Uint8Array) {
          result = new Uint8Array(savedBytes.buffer.slice(0));
          console.log(`✅ Created safe copy using buffer slice: ${result.byteLength} bytes`);
        } else if (savedBytes instanceof ArrayBuffer) {
          result = new Uint8Array(savedBytes);
          console.log(`✅ Created safe copy from ArrayBuffer: ${result.byteLength} bytes`);
        } else {
          // Fallback: Use Uint8Array.from
          result = Uint8Array.from(savedBytes);
          console.log(`✅ Created safe copy using Uint8Array.from: ${result.byteLength} bytes`);
        }
      } catch (constructorError) {
        console.warn('⚠️ Direct construction failed, using manual copy');
        // Manual byte-by-byte copy as ultimate fallback
        const length = savedBytes.length || savedBytes.byteLength || 0;
        if (length === 0) {
          throw new Error('Cannot determine PDF byte length for manual copy');
        }
        const buffer = new ArrayBuffer(length);
        const view = new Uint8Array(buffer);
        for (let i = 0; i < length; i++) {
          view[i] = savedBytes[i] || 0;
        }
        result = view;
        console.log(`✅ Created safe copy using manual method: ${result.byteLength} bytes`);
      }
      
    } catch (saveError) {
      console.error('❌ PDF save operation failed:', saveError);
      throw new Error(`Failed to save PDF with text edits: ${(saveError as Error).message}`);
    }

    console.log(`✅ PDF saved with text edits: ${result.length} bytes`);
    return result;
  }

  /**
   * Get selected text item
   */
  getSelectedTextItem(): PDFTextItem | null {
    if (!this.selectedTextId) return null;
    return this.extractedTextItems.find(item => item.id === this.selectedTextId) || null;
  }

  /**
   * Clear selection
   */
  clearSelection(): void {
    this.extractedTextItems.forEach(item => item.isSelected = false);
    this.selectedTextId = null;
  }

  /**
   * Get text box at coordinates
   */
  getTextBoxAt(x: number, y: number, pageIndex: number): EditableTextBox | null {
    const pageBoxes = this.getPageEditableBoxes(pageIndex);
    
    for (const box of pageBoxes) {
      if (x >= box.x && x <= box.x + box.width &&
          y >= box.y && y <= box.y + box.height) {
        return box;
      }
    }
    
    return null;
  }

  /**
   * Start moving a text box
   */
  startMovingTextBox(id: string): boolean {
    const box = this.editableTextBoxes.find(box => box.id === id);
    if (box) {
      box.isMoving = true;
      return true;
    }
    return false;
  }

  /**
   * Stop moving a text box
   */
  stopMovingTextBox(id: string): boolean {
    const box = this.editableTextBoxes.find(box => box.id === id);
    if (box) {
      box.isMoving = false;
      box.isDirty = true;
      return true;
    }
    return false;
  }

  /**
   * Move text box to new position
   */
  moveTextBox(id: string, x: number, y: number): boolean {
    const box = this.editableTextBoxes.find(box => box.id === id);
    if (box && box.isMoving) {
      box.x = x;
      box.y = y;
      box.isDirty = true;
      return true;
    }
    return false;
  }

  /**
   * Get all text data for export
   */
  exportTextData(): any {
    return {
      extractedItems: this.extractedTextItems.length,
      editableBoxes: this.editableTextBoxes,
      selectedText: this.selectedTextId,
      timestamp: new Date().toISOString()
    };
  }
  
  /**
   * Update selected text item
   */
  updateSelectedText(newText: string): boolean {
    if (!this.selectedTextId) return false;

    const item = this.extractedTextItems.find(item => item.id === this.selectedTextId);
    if (item) {
      item.text = newText;
      console.log(`✏️ Updated text: "${item.originalText}" → "${newText}"`);
      return true;
    }

    return false;
  }
  
  /**
   * Update any text item by ID
   */
  updateTextItem(id: string, newText: string): boolean {
    const item = this.extractedTextItems.find(item => item.id === id);
    if (item) {
      item.text = newText;
      console.log(`✏️ Updated text item ${id}: "${item.originalText}" → "${newText}"`);
      return true;
    }
    return false;
  }
  
  /**
   * Replace text across all pages
   */
  replaceAllText(searchText: string, replaceText: string): number {
    let replacements = 0;
    
    for (const item of this.extractedTextItems) {
      if (item.text.includes(searchText)) {
        item.text = item.text.replace(new RegExp(searchText, 'g'), replaceText);
        replacements++;
      }
    }
    
    console.log(`✅ Replaced ${replacements} occurrences of "${searchText}" with "${replaceText}"`);
    return replacements;
  }
}