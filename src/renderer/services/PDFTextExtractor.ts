import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { TextItem } from 'pdfjs-dist/types/src/display/api';
import { createSafePDFBytes } from '../utils/pdfUtils';

interface ExtractedText {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  fontName: string;
  color: { r: number; g: number; b: number };
  pageIndex: number;
  textItems: any[];
}

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
  textItems: any[];
}

// Type guard to check if an item is a TextItem
function isTextItem(item: any): item is TextItem {
  return item && typeof item === 'object' && 'str' in item && 'transform' in item;
}

export class PDFTextExtractor {
  private pdfDoc: any = null;

  /**
   * Extract all text content with positioning information for editing
   */
  async extractEditableText(pdfBytes: Uint8Array): Promise<EditableTextRegion[]> {
    console.log('🔍 Extracting editable text from PDF...');
    
    try {
      // Create a safe copy of the PDF data to prevent ArrayBuffer detachment
      const safePdfBytes = createSafePDFBytes(pdfBytes);
      
      // Load PDF with PDF.js for text extraction with better error handling
      const loadingTask = pdfjsLib.getDocument({
        data: safePdfBytes,
        useWorkerFetch: false,
        isEvalSupported: false,
        useSystemFonts: true,
        disableFontFace: false,
        disableRange: false,
        disableStream: false
      });
      
      this.pdfDoc = await loadingTask.promise;
      
      const editableRegions: EditableTextRegion[] = [];
      const numPages = this.pdfDoc.numPages;
      
      for (let pageIndex = 0; pageIndex < numPages; pageIndex++) {
        console.log(`📄 Processing page ${pageIndex + 1} of ${numPages}`);
        
        try {
          const page = await this.pdfDoc.getPage(pageIndex + 1);
          
          // Enhanced text content extraction with error handling
          const textContent = await page.getTextContent({
            normalizeWhitespace: false,
            disableCombineTextItems: false
          });
          
          // Group text items that are close together into editable regions
          const regions = this.groupTextIntoEditableRegions(textContent.items, pageIndex);
          editableRegions.push(...regions);
          
        } catch (pageError) {
          console.warn(`⚠️ Error processing page ${pageIndex + 1}:`, pageError);
          // Continue with next page rather than failing completely
          continue;
        }
      }
      
      console.log(`✅ Extracted ${editableRegions.length} editable text regions`);
      return editableRegions;
      
    } catch (error) {
      console.error('❌ Error extracting text from PDF:', error);
      // Return empty array instead of throwing, so app doesn't crash
      console.log('⚡ Falling back to empty text regions');
      return [];
    }
  }

  /**
   * Group nearby text items into logical editing regions
   */
  private groupTextIntoEditableRegions(textItems: any[], pageIndex: number): EditableTextRegion[] {
    if (!textItems || textItems.length === 0) return [];

    const regions: EditableTextRegion[] = [];
    const processedItems = new Set<number>();
    
    for (let i = 0; i < textItems.length; i++) {
      if (processedItems.has(i)) continue;
      
      const item = textItems[i];
      if (!isTextItem(item) || !item.str || item.str.trim().length === 0) continue;
      
      try {
        // Find nearby text items that should be grouped together
        const groupItems = [item];
        processedItems.add(i);
        
        // Look for items on the same line (similar y-coordinate)
        for (let j = i + 1; j < textItems.length; j++) {
          if (processedItems.has(j)) continue;
          
          const nextItem = textItems[j];
          if (!isTextItem(nextItem) || !nextItem.str || nextItem.str.trim().length === 0) continue;
          
          try {
            // Check if items are on the same line and close together
            const yDiff = Math.abs(item.transform[5] - nextItem.transform[5]);
            const xGap = nextItem.transform[4] - (item.transform[4] + (item.width || 0));
            
            if (yDiff < 3 && xGap < 50 && xGap > -10) { // Same line, reasonable gap
              groupItems.push(nextItem);
              processedItems.add(j);
            }
          } catch (itemError) {
            console.warn('⚠️ Error processing text item:', itemError);
            continue;
          }
        }
        
        // Create editable region from grouped items
        const region = this.createEditableRegion(groupItems, pageIndex);
        if (region) {
          regions.push(region);
        }
      } catch (regionError) {
        console.warn('⚠️ Error creating text region:', regionError);
        continue;
      }
    }
    
    return regions;
  }

  /**
   * Create an editable text region from grouped text items
   */
  private createEditableRegion(textItems: TextItem[], pageIndex: number): EditableTextRegion | null {
    if (textItems.length === 0) return null;
    
    // Calculate bounding box
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    
    let combinedText = '';
    let fontSize = 0;
    let fontName = '';
    
    for (const item of textItems) {
      combinedText += item.str;
      
      const x = item.transform[4];
      const y = item.transform[5];
      const itemFontSize = Math.abs(item.transform[0]); // Font size from transform matrix
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
    
    return {
      id: `text_${pageIndex}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      originalText: combinedText.trim(),
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
      fontSize: fontSize || 12,
      fontName: fontName || 'Helvetica',
      pageIndex,
      textItems
    };
  }

  /**
   * Extract text from specific coordinates (for click-to-edit functionality)
   */
  async getTextAtCoordinates(
    pdfBytes: Uint8Array, 
    pageIndex: number, 
    x: number, 
    y: number, 
    tolerance: number = 10
  ): Promise<EditableTextRegion | null> {
    try {
      // Create a safe copy of the PDF data to prevent ArrayBuffer detachment
      const safePdfBytes = createSafePDFBytes(pdfBytes);
      
      const loadingTask = pdfjsLib.getDocument({
        data: safePdfBytes,
        useWorkerFetch: false,
        isEvalSupported: false,
        useSystemFonts: true
      });
      const pdfDoc = await loadingTask.promise;
      const page = await pdfDoc.getPage(pageIndex + 1);
      
      const textContent = await page.getTextContent({
        normalizeWhitespace: false,
        disableCombineTextItems: false
      });
      
      // Find text item at clicked coordinates
      for (const item of textContent.items) {
        if (!isTextItem(item) || !item.str || item.str.trim().length === 0) continue;
        
        try {
          const itemX = item.transform[4];
          const itemY = item.transform[5];
          const itemWidth = item.width || 0;
          const itemHeight = Math.abs(item.transform[3]) || 12;
          
          // Check if click is within text bounds
          if (x >= itemX - tolerance && 
              x <= itemX + itemWidth + tolerance &&
              y >= itemY - tolerance && 
              y <= itemY + itemHeight + tolerance) {
            
            return {
              id: `clicked_text_${pageIndex}_${Date.now()}`,
              originalText: item.str.trim(),
              x: itemX,
              y: itemY,
              width: itemWidth,
              height: itemHeight,
              fontSize: Math.abs(item.transform[0]) || 12,
              fontName: item.fontName || 'Helvetica',
              pageIndex,
              textItems: [item]
            };
          }
        } catch (itemError) {
          console.warn('⚠️ Error processing text item at coordinates:', itemError);
          continue;
        }
      }
      
      return null;
      
    } catch (error) {
      console.error('❌ Error getting text at coordinates:', error);
      return null;
    }
  }

  /**
   * Replace text in PDF content (creates new PDF with replaced text)
   */
  async replaceTextInPDF(
    pdfBytes: Uint8Array, 
    edits: Array<{
      region: EditableTextRegion;
      newText: string;
    }>
  ): Promise<Uint8Array> {
    console.log('🔄 Replacing text in PDF...');
    
    try {
      // Create a safe copy of the PDF data to prevent ArrayBuffer detachment
      const safePdfBytes = createSafePDFBytes(pdfBytes);
      
      // Load PDF with pdf-lib for editing
      const pdfDoc = await PDFDocument.load(safePdfBytes);
      const pages = pdfDoc.getPages();
      
      // Group edits by page
      const editsByPage = new Map<number, typeof edits>();
      for (const edit of edits) {
        const pageIndex = edit.region.pageIndex;
        if (!editsByPage.has(pageIndex)) {
          editsByPage.set(pageIndex, []);
        }
        editsByPage.get(pageIndex)!.push(edit);
      }
      
      // Apply edits to each page
      for (const [pageIndex, pageEdits] of editsByPage.entries()) {
        const page = pages[pageIndex];
        if (!page) continue;
        
        console.log(`📝 Applying ${pageEdits.length} edits to page ${pageIndex + 1}`);
        
        // First, cover original text with white rectangles (to "erase" it)
        for (const edit of pageEdits) {
          const region = edit.region;
          page.drawRectangle({
            x: region.x,
            y: region.y,
            width: region.width,
            height: region.height,
            color: rgb(1, 1, 1), // White to cover original text
            borderColor: rgb(1, 1, 1),
            borderWidth: 0
          });
        }
        
        // Then, draw new text in the same positions
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
        
        for (const edit of pageEdits) {
          const region = edit.region;
          
          // Calculate appropriate font size to fit in the space
          let adjustedFontSize = region.fontSize;
          const textWidth = font.widthOfTextAtSize(edit.newText, adjustedFontSize);
          
          // Scale down font if text is too wide
          if (textWidth > region.width && region.width > 0) {
            adjustedFontSize = (region.fontSize * region.width) / textWidth;
            adjustedFontSize = Math.max(6, adjustedFontSize); // Minimum readable size
          }
          
          page.drawText(edit.newText, {
            x: region.x,
            y: region.y,
            size: adjustedFontSize,
            font,
            color: rgb(0, 0, 0) // Black text
          });
        }
      }
      
      console.log('✅ Text replacement completed');
      return await pdfDoc.save();
      
    } catch (error) {
      console.error('❌ Error replacing text in PDF:', error);
      throw new Error(`Failed to replace text: ${(error as Error).message}`);
    }
  }

  /**
   * Get all text content from PDF for search functionality
   */
  async getAllTextContent(pdfBytes: Uint8Array): Promise<Array<{
    text: string;
    pageIndex: number;
    x: number;
    y: number;
    width: number;
    height: number;
  }>> {
    try {
      // Create a safe copy of the PDF data to prevent ArrayBuffer detachment
      const safePdfBytes = createSafePDFBytes(pdfBytes);
      
      const loadingTask = pdfjsLib.getDocument({ data: safePdfBytes });
      const pdfDoc = await loadingTask.promise;
      const textContent: any[] = [];
      
      for (let pageIndex = 0; pageIndex < pdfDoc.numPages; pageIndex++) {
        const page = await pdfDoc.getPage(pageIndex + 1);
        const content = await page.getTextContent();
        
        for (const item of content.items) {
          if (isTextItem(item) && item.str && item.str.trim().length > 0) {
            textContent.push({
              text: item.str,
              pageIndex,
              x: item.transform[4],
              y: item.transform[5],
              width: item.width || 0,
              height: Math.abs(item.transform[3]) || 12
            });
          }
        }
      }
      
      return textContent;
      
    } catch (error) {
      console.error('❌ Error getting all text content:', error);
      return [];
    }
  }
}