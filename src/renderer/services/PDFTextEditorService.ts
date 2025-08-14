import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { TextItem } from 'pdfjs-dist/types/src/display/api';
import { loadPDFSafely, validatePDFBytes, createSafePDFBytes } from '../utils/pdfUtils';

export interface EditableTextRegion {
  id: string;
  originalText: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  fontName: string;
  pageIndex: number;
  textItems: any[]; // Raw PDF.js text items
}

export interface TextEdit {
  region: EditableTextRegion;
  newText: string;
}

export interface TextAddition {
  text: string;
  pageIndex: number;
  x: number;
  y: number;
  fontSize: number;
  fontName: string;
  color?: { r: number; g: number; b: number };
}

// Type guard to check if an item is a TextItem
function isTextItem(item: any): item is TextItem {
  return item && typeof item === 'object' && 'str' in item && 'transform' in item;
}

export class PDFTextEditorService {

  /**
   * Extracts all text content with positioning information for editing.
   * Implements Emergency Recovery patterns for robustness.
   */
  async extractEditableText(pdfBytes: Uint8Array): Promise<EditableTextRegion[]> {
    console.log('🔍 PDFTextEditorService: Extracting editable text...');

    // Early validation to prevent extraction on invalid data
    if (!pdfBytes || pdfBytes.byteLength === 0) {
      console.warn('⚠️ PDFTextEditorService: No valid PDF data provided for text extraction');
      return [];
    }

    // Additional buffer validity check
    try {
      // Test if we can access the buffer properties
      const bufferSize = pdfBytes.buffer.byteLength;
      if (bufferSize === 0) {
        console.warn('⚠️ PDFTextEditorService: PDF data buffer is detached or empty');
        return [];
      }
    } catch (error) {
      console.warn('⚠️ PDFTextEditorService: Cannot access PDF data buffer:', error);
      return [];
    }

    const strategies = [
      // Strategy 1: Full extraction with all features
      async () => this.performExtraction(pdfBytes, {
        useWorkerFetch: false,
        isEvalSupported: false,
        useSystemFonts: true,
        disableFontFace: false,
        disableRange: false,
        disableStream: false
      }),
      // Strategy 2: Simplified extraction with some features disabled
      async () => this.performExtraction(pdfBytes, {
        useWorkerFetch: false,
        isEvalSupported: false,
        disableFontFace: true
      }),
      // Strategy 3: Emergency extraction (minimal)
      async () => this.performExtraction(pdfBytes, {}, true) // Emergency mode
    ];

    for (const [index, strategy] of strategies.entries()) {
      try {
        const result = await strategy();
        console.log(`✅ PDFTextEditorService: Extraction successful with strategy ${index + 1}`);
        return result;
      } catch (error) {
        console.warn(`⚠️ PDFTextEditorService: Extraction strategy ${index + 1} failed:`, error);
        if (index === strategies.length - 1) {
          console.error('❌ PDFTextEditorService: All text extraction strategies failed');
          return []; // Fallback to empty array
        }
      }
    }
    return []; // Should not be reached
  }

  private async performExtraction(pdfBytes: Uint8Array, options: any, emergencyMode: boolean = false): Promise<EditableTextRegion[]> {
    try {
      // Validate PDF bytes first
      if (!validatePDFBytes(pdfBytes)) {
        throw new Error('PDF data validation failed');
      }

      // Use the safe loading utility
      const pdfDoc = await loadPDFSafely(pdfBytes, options);
      const editableRegions: EditableTextRegion[] = [];

      for (let pageIndex = 0; pageIndex < pdfDoc.numPages; pageIndex++) {
        try {
          const page = await pdfDoc.getPage(pageIndex + 1);
          const textContent = await page.getTextContent({
            normalizeWhitespace: false,
            disableCombineTextItems: false
          });

          if (emergencyMode) {
            // In emergency mode, just get basic text items
            let pageHeight = 842; // Default A4 height
            try {
              const viewport = page.getViewport({ scale: 1.0 });
              pageHeight = viewport.height;
            } catch (error) {
              console.warn('Could not get page height in emergency mode, using default');
            }

            for (const item of textContent.items) {
              if (isTextItem(item) && item.str && item.str.trim()) {
                const pdfY = item.transform[5];
                const itemHeight = Math.abs(item.transform[3]) || 12;
                const canvasY = pageHeight - pdfY - itemHeight; // Convert coordinates

                editableRegions.push({
                  id: `text_${pageIndex}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                  originalText: item.str.trim(),
                  x: item.transform[4],
                  y: canvasY, // Use converted coordinates
                  width: item.width || 0,
                  height: itemHeight,
                  fontSize: Math.abs(item.transform[0]) || 12,
                  fontName: item.fontName || 'Helvetica',
                  pageIndex,
                  textItems: [item]
                });
              }
            }
          } else {
            // Group text items into logical regions for full mode
            const regions = this.groupTextIntoEditableRegions(textContent.items, pageIndex, page);
            editableRegions.push(...regions);
          }
        } catch (pageError) {
          console.warn(`⚠️ PDFTextEditorService: Error processing page ${pageIndex + 1} during extraction:`, pageError);
          // Continue to next page
        }
      }
      return editableRegions;
    } catch (error) {
      throw error;
    }
  }

  private groupTextIntoEditableRegions(textItems: any[], pageIndex: number, page?: any): EditableTextRegion[] {
    const regions: EditableTextRegion[] = [];
    const processedItems = new Set<number>();

    for (let i = 0; i < textItems.length; i++) {
      if (processedItems.has(i)) continue;

      const item = textItems[i];
      if (!isTextItem(item) || !item.str || item.str.trim().length === 0) continue;

      const groupItems = [item];
      processedItems.add(i);

      for (let j = i + 1; j < textItems.length; j++) {
        if (processedItems.has(j)) continue;

        const nextItem = textItems[j];
        if (!isTextItem(nextItem) || !nextItem.str || nextItem.str.trim().length === 0) continue;

        const yDiff = Math.abs(item.transform[5] - nextItem.transform[5]);
        const xGap = nextItem.transform[4] - (item.transform[4] + (item.width || 0));

        if (yDiff < 3 && xGap < 50 && xGap > -10) { // Same line, reasonable gap
          groupItems.push(nextItem);
          processedItems.add(j);
        }
      }

      const region = this.createEditableRegion(groupItems, pageIndex, page);
      if (region) {
        regions.push(region);
      }
    }
    return regions;
  }

  private createEditableRegion(textItems: TextItem[], pageIndex: number, page?: any): EditableTextRegion | null {
    if (textItems.length === 0) return null;

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    let combinedText = '';
    let fontSize = 0;
    let fontName = '';

    // Get page height for coordinate conversion
    let pageHeight = 842; // Default A4 height
    if (page) {
      try {
        const viewport = page.getViewport({ scale: 1.0 });
        pageHeight = viewport.height;
      } catch (error) {
        console.warn('Could not get page height, using default');
      }
    }

    for (const item of textItems) {
      combinedText += item.str;
      const x = item.transform[4];
      const y = item.transform[5];
      const itemFontSize = Math.abs(item.transform[0]);
      const itemWidth = item.width || 0;
      const itemHeight = Math.abs(item.transform[3]) || itemFontSize;

      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x + itemWidth);
      maxY = Math.max(maxY, y + itemHeight);

      if (itemFontSize > fontSize) {
        fontSize = itemFontSize;
      }
      if (item.fontName && !fontName) {
        fontName = item.fontName;
      }
    }

    // Convert PDF coordinates (bottom-up) to canvas coordinates (top-down)
    const canvasY = pageHeight - maxY;
    const canvasMaxY = pageHeight - minY;

    return {
      id: `text_${pageIndex}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      originalText: combinedText.trim(),
      x: minX,
      y: canvasY, // Converted Y coordinate
      width: maxX - minX,
      height: canvasMaxY - canvasY, // Adjusted height
      fontSize: fontSize || 12,
      fontName: fontName || 'Helvetica',
      pageIndex,
      textItems // Keep original text items for potential future use
    };
  }

  /**
   * Replaces text in the PDF by drawing over old text and adding new text.
   * Returns the modified PDF bytes.
   */
  async replaceTextInPDF(pdfBytes: Uint8Array, edits: TextEdit[]): Promise<Uint8Array> {
    console.log('🔄 PDFTextEditorService: Replacing text in PDF...');

    try {
      // Enhanced ArrayBuffer safety with comprehensive validation
      if (!pdfBytes || pdfBytes.byteLength === 0) {
        throw new Error('PDF data is empty or invalid');
      }

      // Create a safe copy using multiple strategies
      let dataCopy: Uint8Array;
      try {
        // Check if buffer is accessible
        const isDetached = pdfBytes.buffer.byteLength === 0;
        if (isDetached) {
          throw new Error('ArrayBuffer is detached');
        }
        
        // Create safe copy using buffer slice
        dataCopy = new Uint8Array(pdfBytes.buffer.slice(pdfBytes.byteOffset, pdfBytes.byteOffset + pdfBytes.byteLength));
      } catch (bufferError) {
        console.warn('Primary buffer copy failed for replaceTextInPDF, trying alternative method:', bufferError);
        // Alternative method: create new buffer from values
        dataCopy = new Uint8Array(pdfBytes);
      }

      const pdfDoc = await PDFDocument.load(dataCopy);
      const pages = pdfDoc.getPages();
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

      for (const edit of edits) {
        const { region, newText } = edit;
        const page = pages[region.pageIndex];
        if (!page) continue;

        // Get page height for coordinate conversion
        const pageSize = page.getSize();
        const pageHeight = pageSize.height;

        // Convert canvas coordinates back to PDF coordinates (bottom-up)
        const pdfY = pageHeight - region.y - region.height;

        // Cover original text with white rectangle
        page.drawRectangle({
          x: region.x,
          y: pdfY,
          width: region.width,
          height: region.height,
          color: rgb(1, 1, 1), // White to cover original text
          borderColor: rgb(1, 1, 1),
          borderWidth: 0
        });

        // Draw new text
        let adjustedFontSize = region.fontSize;
        const textWidth = font.widthOfTextAtSize(newText, adjustedFontSize);

        if (textWidth > region.width && region.width > 0) {
          adjustedFontSize = (region.fontSize * region.width) / textWidth;
          adjustedFontSize = Math.max(6, adjustedFontSize); // Minimum readable size
        }

        page.drawText(newText, {
          x: region.x,
          y: pdfY + (region.height * 0.2), // Slight adjustment for text baseline
          size: adjustedFontSize,
          font,
          color: rgb(0, 0, 0) // Black text
        });
        console.log(`✅ PDFTextEditorService: Replaced "${region.originalText}" with "${newText}" on page ${region.pageIndex + 1}`);
      }

      return await pdfDoc.save();
    } catch (error) {
      console.error('❌ PDFTextEditorService: Error replacing text in PDF:', error);
      throw new Error(`Failed to replace text: ${(error as Error).message}`);
    }
  }

  /**
   * Adds new text to a PDF at specified coordinates.
   * Returns the modified PDF bytes.
   */
  async addTextToPDF(pdfBytes: Uint8Array, additions: TextAddition[]): Promise<Uint8Array> {
    console.log('➕ PDFTextEditorService: Adding new text to PDF...');

    try {
      // Enhanced ArrayBuffer safety with comprehensive validation
      if (!pdfBytes || pdfBytes.byteLength === 0) {
        throw new Error('PDF data is empty or invalid');
      }

      // Create a safe copy using multiple strategies
      let dataCopy: Uint8Array;
      try {
        // Check if buffer is accessible
        const isDetached = pdfBytes.buffer.byteLength === 0;
        if (isDetached) {
          throw new Error('ArrayBuffer is detached');
        }
        
        // Create safe copy using buffer slice
        dataCopy = new Uint8Array(pdfBytes.buffer.slice(pdfBytes.byteOffset, pdfBytes.byteOffset + pdfBytes.byteLength));
      } catch (bufferError) {
        console.warn('Primary buffer copy failed for addTextToPDF, trying alternative method:', bufferError);
        // Alternative method: create new buffer from values
        dataCopy = new Uint8Array(pdfBytes);
      }

      const pdfDoc = await PDFDocument.load(dataCopy);
      const pages = pdfDoc.getPages();
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

      for (const addition of additions) {
        const page = pages[addition.pageIndex];
        if (!page) continue;

        // Get page height for coordinate conversion
        const pageSize = page.getSize();
        const pageHeight = pageSize.height;

        // Convert canvas coordinates to PDF coordinates (bottom-up)
        const pdfY = pageHeight - addition.y;

        const color = addition.color || { r: 0, g: 0, b: 0 };

        page.drawText(addition.text, {
          x: addition.x,
          y: pdfY,
          size: addition.fontSize,
          font,
          color: rgb(color.r, color.g, color.b)
        });
        console.log(`✅ PDFTextEditorService: Added text "${addition.text}" to page ${addition.pageIndex + 1}`);
      }

      return await pdfDoc.save();
    } catch (error) {
      console.error('❌ PDFTextEditorService: Error adding text to PDF:', error);
      throw new Error(`Failed to add text: ${(error as Error).message}`);
    }
  }

  /**
   * Finds text at specific coordinates for click-to-edit functionality.
   */
  findTextAtCoordinates(
    extractedRegions: EditableTextRegion[],
    pageIndex: number,
    clickX: number,
    clickY: number,
    tolerance: number = 5
  ): EditableTextRegion | null {
    for (const region of extractedRegions) {
      if (region.pageIndex !== pageIndex) continue;

      // Check if click is within text region bounds
      // Adjust Y coordinate for PDF.js vs canvas rendering (PDF.js Y is from bottom, canvas Y is from top)
      // Assuming region.y is already adjusted to be from top for canvas rendering in EnhancedPDFViewer
      if (clickX >= region.x - tolerance &&
          clickX <= region.x + region.width + tolerance &&
          clickY >= region.y - tolerance &&
          clickY <= region.y + region.height + tolerance) {
        return region;
      }
    }
    return null;
  }
}
