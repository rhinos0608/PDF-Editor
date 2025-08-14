import { PDFDocument, PDFPage, PDFFont, rgb, StandardFonts, degrees } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';

export interface TextStyle {
  fontFamily: string;
  fontSize: number;
  color: { r: number; g: number; b: number };
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strikethrough: boolean;
  letterSpacing: number;
  lineHeight: number;
  alignment: 'left' | 'center' | 'right' | 'justify';
}

export interface TextSelection {
  pageIndex: number;
  startIndex: number;
  endIndex: number;
  text: string;
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface FontInfo {
  name: string;
  family: string;
  style: 'normal' | 'italic' | 'bold' | 'bold-italic';
  weight: number;
  isEmbedded: boolean;
  subset: boolean;
}

export class AdvancedTextEditor {
  private loadedFonts: Map<string, PDFFont> = new Map();
  private customFonts: Map<string, Uint8Array> = new Map();

  constructor() {
    this.initializeFontSystem();
  }

  private async initializeFontSystem() {
    // Load standard fonts for quick access
    const tempDoc = await PDFDocument.create();
    tempDoc.registerFontkit(fontkit);
    
    const standardFonts = [
      StandardFonts.Helvetica,
      StandardFonts.HelveticaBold,
      StandardFonts.HelveticaOblique,
      StandardFonts.HelveticaBoldOblique,
      StandardFonts.TimesRoman,
      StandardFonts.TimesRomanBold,
      StandardFonts.TimesRomanItalic,
      StandardFonts.TimesRomanBoldItalic,
      StandardFonts.Courier,
      StandardFonts.CourierBold,
      StandardFonts.CourierOblique,
      StandardFonts.CourierBoldOblique
    ];

    for (const fontName of standardFonts) {
      try {
        const font = await tempDoc.embedFont(fontName);
        this.loadedFonts.set(fontName, font);
      } catch (error) {
        console.warn(`Failed to load standard font ${fontName}:`, error);
      }
    }
  }

  async loadCustomFont(fontBytes: Uint8Array, fontName: string): Promise<void> {
    this.customFonts.set(fontName, fontBytes);
  }

  async getAvailableFonts(): Promise<FontInfo[]> {
    const fonts: FontInfo[] = [];
    
    // Add standard fonts
    const standardFontInfo = [
      { name: 'Helvetica', family: 'Helvetica', style: 'normal' as const, weight: 400 },
      { name: 'Helvetica-Bold', family: 'Helvetica', style: 'bold' as const, weight: 700 },
      { name: 'Helvetica-Oblique', family: 'Helvetica', style: 'italic' as const, weight: 400 },
      { name: 'Times-Roman', family: 'Times', style: 'normal' as const, weight: 400 },
      { name: 'Times-Bold', family: 'Times', style: 'bold' as const, weight: 700 },
      { name: 'Times-Italic', family: 'Times', style: 'italic' as const, weight: 400 },
      { name: 'Courier', family: 'Courier', style: 'normal' as const, weight: 400 },
      { name: 'Courier-Bold', family: 'Courier', style: 'bold' as const, weight: 700 }
    ];

    for (const fontInfo of standardFontInfo) {
      fonts.push({
        ...fontInfo,
        isEmbedded: true,
        subset: false
      });
    }

    // Add custom fonts
    for (const [name] of this.customFonts) {
      fonts.push({
        name,
        family: name,
        style: 'normal',
        weight: 400,
        isEmbedded: true,
        subset: true
      });
    }

    return fonts;
  }

  async addText(
    pdfBytes: Uint8Array,
    pageIndex: number,
    text: string,
    x: number,
    y: number,
    style: Partial<TextStyle> = {}
  ): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.load(pdfBytes);
    pdfDoc.registerFontkit(fontkit);
    
    const page = pdfDoc.getPage(pageIndex);
    
    const textStyle: TextStyle = {
      fontFamily: 'Helvetica',
      fontSize: 12,
      color: { r: 0, g: 0, b: 0 },
      bold: false,
      italic: false,
      underline: false,
      strikethrough: false,
      letterSpacing: 0,
      lineHeight: 1.2,
      alignment: 'left',
      ...style
    };

    const font = await this.getFont(pdfDoc, textStyle.fontFamily, textStyle.bold, textStyle.italic);
    
    // Handle multi-line text
    const lines = text.split('\n');
    const lineHeight = textStyle.fontSize * textStyle.lineHeight;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const yPos = y - (i * lineHeight);
      
      let xPos = x;
      
      // Handle text alignment
      if (textStyle.alignment !== 'left') {
        const textWidth = font.widthOfTextAtSize(line, textStyle.fontSize);
        const pageWidth = page.getSize().width;
        
        switch (textStyle.alignment) {
          case 'center':
            xPos = (pageWidth - textWidth) / 2;
            break;
          case 'right':
            xPos = pageWidth - textWidth - 50; // 50pt margin
            break;
          case 'justify':
            // For justify, we'd need to adjust character spacing
            break;
        }
      }

      // Draw the text
      page.drawText(line, {
        x: xPos,
        y: yPos,
        size: textStyle.fontSize,
        font,
        color: rgb(textStyle.color.r, textStyle.color.g, textStyle.color.b)
      });

      // Add text decorations
      if (textStyle.underline || textStyle.strikethrough) {
        const textWidth = font.widthOfTextAtSize(line, textStyle.fontSize);
        const lineThickness = textStyle.fontSize * 0.05;
        
        if (textStyle.underline) {
          page.drawLine({
            start: { x: xPos, y: yPos - textStyle.fontSize * 0.1 },
            end: { x: xPos + textWidth, y: yPos - textStyle.fontSize * 0.1 },
            thickness: lineThickness,
            color: rgb(textStyle.color.r, textStyle.color.g, textStyle.color.b)
          });
        }
        
        if (textStyle.strikethrough) {
          page.drawLine({
            start: { x: xPos, y: yPos + textStyle.fontSize * 0.3 },
            end: { x: xPos + textWidth, y: yPos + textStyle.fontSize * 0.3 },
            thickness: lineThickness,
            color: rgb(textStyle.color.r, textStyle.color.g, textStyle.color.b)
          });
        }
      }
    }

    return await pdfDoc.save();
  }

  async editText(
    pdfBytes: Uint8Array,
    selection: TextSelection,
    newText: string,
    style?: Partial<TextStyle>
  ): Promise<Uint8Array> {
    // This is a complex operation that would require:
    // 1. Removing the existing text from the PDF content stream
    // 2. Adding the new text in its place
    // For now, we'll implement a simplified version that overlays new text
    
    const pdfDoc = await PDFDocument.load(pdfBytes);
    pdfDoc.registerFontkit(fontkit);
    
    const page = pdfDoc.getPage(selection.pageIndex);
    
    // Create a white rectangle to cover the old text
    page.drawRectangle({
      x: selection.bounds.x - 2,
      y: selection.bounds.y - 2,
      width: selection.bounds.width + 4,
      height: selection.bounds.height + 4,
      color: rgb(1, 1, 1) // White background
    });

    // Add the new text
    if (newText.trim()) {
      return await this.addText(
        await pdfDoc.save(),
        selection.pageIndex,
        newText,
        selection.bounds.x,
        selection.bounds.y + selection.bounds.height,
        style
      );
    }

    return await pdfDoc.save();
  }

  async replaceText(
    pdfBytes: Uint8Array,
    searchText: string,
    replaceText: string,
    options: {
      matchCase?: boolean;
      wholeWord?: boolean;
      pageIndices?: number[];
      style?: Partial<TextStyle>;
    } = {}
  ): Promise<{ pdfBytes: Uint8Array; replacements: number }> {
    // This would require text extraction and replacement
    // For now, return the original PDF
    return { pdfBytes, replacements: 0 };
  }

  async formatText(
    pdfBytes: Uint8Array,
    selection: TextSelection,
    style: Partial<TextStyle>
  ): Promise<Uint8Array> {
    return await this.editText(pdfBytes, selection, selection.text, style);
  }

  async insertTextBox(
    pdfBytes: Uint8Array,
    pageIndex: number,
    bounds: { x: number; y: number; width: number; height: number },
    text: string,
    style: Partial<TextStyle> = {}
  ): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.load(pdfBytes);
    pdfDoc.registerFontkit(fontkit);
    
    const page = pdfDoc.getPage(pageIndex);
    
    // Draw text box border (optional)
    page.drawRectangle({
      x: bounds.x,
      y: bounds.y,
      width: bounds.width,
      height: bounds.height,
      borderColor: rgb(0.8, 0.8, 0.8),
      borderWidth: 1
    });

    // Calculate text layout within bounds
    const textStyle: TextStyle = {
      fontFamily: 'Helvetica',
      fontSize: 12,
      color: { r: 0, g: 0, b: 0 },
      bold: false,
      italic: false,
      underline: false,
      strikethrough: false,
      letterSpacing: 0,
      lineHeight: 1.2,
      alignment: 'left',
      ...style
    };

    const font = await this.getFont(pdfDoc, textStyle.fontFamily, textStyle.bold, textStyle.italic);
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';
    
    // Word wrap algorithm
    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const testWidth = font.widthOfTextAtSize(testLine, textStyle.fontSize);
      
      if (testWidth <= bounds.width - 10) { // 5pt margin on each side
        currentLine = testLine;
      } else {
        if (currentLine) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          // Word is too long for the box, we need to break it
          lines.push(word);
        }
      }
    }
    
    if (currentLine) {
      lines.push(currentLine);
    }

    // Draw the text
    const lineHeight = textStyle.fontSize * textStyle.lineHeight;
    let yOffset = bounds.y + bounds.height - textStyle.fontSize - 5; // Start from top
    
    for (const line of lines) {
      if (yOffset < bounds.y + 5) break; // Don't go below the box
      
      let xPos = bounds.x + 5; // Left margin
      
      // Handle alignment
      if (textStyle.alignment !== 'left') {
        const textWidth = font.widthOfTextAtSize(line, textStyle.fontSize);
        
        switch (textStyle.alignment) {
          case 'center':
            xPos = bounds.x + (bounds.width - textWidth) / 2;
            break;
          case 'right':
            xPos = bounds.x + bounds.width - textWidth - 5;
            break;
        }
      }
      
      page.drawText(line, {
        x: xPos,
        y: yOffset,
        size: textStyle.fontSize,
        font,
        color: rgb(textStyle.color.r, textStyle.color.g, textStyle.color.b)
      });
      
      yOffset -= lineHeight;
    }

    return await pdfDoc.save();
  }

  private async getFont(
    pdfDoc: PDFDocument,
    fontFamily: string,
    bold: boolean = false,
    italic: boolean = false
  ): Promise<PDFFont> {
    let fontName = fontFamily;
    
    // Map to standard font names
    if (fontFamily.toLowerCase().includes('helvetica')) {
      if (bold && italic) fontName = StandardFonts.HelveticaBoldOblique;
      else if (bold) fontName = StandardFonts.HelveticaBold;
      else if (italic) fontName = StandardFonts.HelveticaOblique;
      else fontName = StandardFonts.Helvetica;
    } else if (fontFamily.toLowerCase().includes('times')) {
      if (bold && italic) fontName = StandardFonts.TimesRomanBoldItalic;
      else if (bold) fontName = StandardFonts.TimesRomanBold;
      else if (italic) fontName = StandardFonts.TimesRomanItalic;
      else fontName = StandardFonts.TimesRoman;
    } else if (fontFamily.toLowerCase().includes('courier')) {
      if (bold && italic) fontName = StandardFonts.CourierBoldOblique;
      else if (bold) fontName = StandardFonts.CourierBold;
      else if (italic) fontName = StandardFonts.CourierOblique;
      else fontName = StandardFonts.Courier;
    }

    // Try to get from cache first
    const cachedFont = this.loadedFonts.get(fontName);
    if (cachedFont) return cachedFont;

    // Try to embed custom font
    const customFontBytes = this.customFonts.get(fontFamily);
    if (customFontBytes) {
      const font = await pdfDoc.embedFont(customFontBytes);
      this.loadedFonts.set(fontFamily, font);
      return font;
    }

    // Fallback to standard font
    const font = await pdfDoc.embedFont(fontName as StandardFonts);
    this.loadedFonts.set(fontName, font);
    return font;
  }

  async measureText(
    text: string,
    fontFamily: string,
    fontSize: number,
    bold: boolean = false,
    italic: boolean = false
  ): Promise<{ width: number; height: number }> {
    const tempDoc = await PDFDocument.create();
    tempDoc.registerFontkit(fontkit);
    
    const font = await this.getFont(tempDoc, fontFamily, bold, italic);
    const width = font.widthOfTextAtSize(text, fontSize);
    const height = font.heightAtSize(fontSize);
    
    return { width, height };
  }

  async extractTextStyles(pdfBytes: Uint8Array, pageIndex: number): Promise<TextSelection[]> {
    // This would require parsing the PDF content stream to extract text and its styling
    // This is a complex operation that would need a more sophisticated PDF parser
    // For now, return empty array
    return [];
  }
}