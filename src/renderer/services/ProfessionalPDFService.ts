/**
 * ProfessionalPDFService - Professional-grade PDF editing service
 * Replaces BasicPDFService with advanced, production-quality features
 */

import { PDFDocument, rgb, StandardFonts, PDFPage, PDFFont, degrees } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocumentProxy } from 'pdfjs-dist/types/src/display/api';

export interface ProfessionalAnnotation {
  id: string;
  type: 'text' | 'rectangle' | 'highlight' | 'circle' | 'arrow' | 'freehand';
  x: number;
  y: number;
  width: number;
  height: number;
  pageIndex: number;
  
  // Text properties
  text?: string;
  fontSize?: number;
  fontFamily?: 'Helvetica' | 'Times' | 'Courier';
  fontWeight?: 'normal' | 'bold';
  
  // Visual properties
  color?: { r: number; g: number; b: number };
  strokeWidth?: number;
  opacity?: number;
  rotation?: number;
  
  // Advanced properties
  borderStyle?: 'solid' | 'dashed' | 'dotted';
  fillColor?: { r: number; g: number; b: number };
  
  // Metadata
  author?: string;
  createdAt?: Date;
  modifiedAt?: Date;
  notes?: string;
}

export interface AnnotationHistory {
  action: 'add' | 'modify' | 'delete';
  annotation: ProfessionalAnnotation;
  timestamp: Date;
}

export class ProfessionalPDFService {
  private pdfBytes: Uint8Array | null = null;
  private originalPdfBytes: Uint8Array | null = null;
  private pdfDocument: PDFDocumentProxy | null = null;
  private fileName: string = '';
  private annotations: ProfessionalAnnotation[] = [];
  private history: AnnotationHistory[] = [];
  private historyIndex: number = -1;

  /**
   * Load a PDF with professional validation and error handling
   */
  async loadPDF(fileBytes: Uint8Array, fileName: string = 'document.pdf'): Promise<PDFDocumentProxy> {
    try {
      console.log(`📄 [Professional] Loading PDF: ${fileName} (${fileBytes.length} bytes)`);
      
      // Store pristine original bytes
      this.originalPdfBytes = new Uint8Array(fileBytes);
      this.pdfBytes = new Uint8Array(this.originalPdfBytes.length);
      this.pdfBytes.set(this.originalPdfBytes);
      this.fileName = fileName;
      
      // Reset state
      this.annotations = [];
      this.history = [];
      this.historyIndex = -1;
      
      // Advanced PDF validation
      await this.validatePDFStructure(this.pdfBytes);
      
      // Load with PDF.js
      const pdfJsCopy = new Uint8Array(this.pdfBytes);
      const loadingTask = pdfjsLib.getDocument({
        data: pdfJsCopy,
        useSystemFonts: true,
        isEvalSupported: false,
        disableFontFace: false
      });
      
      this.pdfDocument = await loadingTask.promise;
      
      console.log(`✅ [Professional] PDF loaded: ${this.pdfDocument.numPages} pages, ${this.estimatePDFComplexity()} complexity`);
      return this.pdfDocument;
    } catch (error) {
      console.error('❌ [Professional] Failed to load PDF:', error);
      throw new Error(`Professional PDF loading failed: ${error}`);
    }
  }

  /**
   * Advanced PDF structure validation
   */
  private async validatePDFStructure(bytes: Uint8Array): Promise<void> {
    const header = new TextDecoder().decode(bytes.slice(0, 10));
    
    if (!header.startsWith('%PDF-')) {
      throw new Error(`Invalid PDF: missing header (found: ${header})`);
    }
    
    // Check PDF version
    const version = header.substring(5, 8);
    const supportedVersions = ['1.0', '1.1', '1.2', '1.3', '1.4', '1.5', '1.6', '1.7', '2.0'];
    
    if (!supportedVersions.includes(version)) {
      console.warn(`⚠️ Unsupported PDF version: ${version}. Proceeding with caution.`);
    }
    
    // Check for EOF marker
    const tail = new TextDecoder().decode(bytes.slice(-10));
    if (!tail.includes('%%EOF')) {
      console.warn('⚠️ PDF may be truncated or corrupted - missing EOF marker');
    }
    
    console.log(`📋 PDF validation passed: ${version}, ${bytes.length} bytes`);
  }

  /**
   * Estimate PDF complexity for performance optimization
   */
  private estimatePDFComplexity(): 'simple' | 'moderate' | 'complex' {
    if (!this.pdfDocument) return 'simple';
    
    const pages = this.pdfDocument.numPages;
    const fileSize = this.pdfBytes?.length || 0;
    
    if (pages > 100 || fileSize > 10 * 1024 * 1024) return 'complex';
    if (pages > 20 || fileSize > 2 * 1024 * 1024) return 'moderate';
    return 'simple';
  }

  /**
   * Add professional annotation with history tracking
   */
  addAnnotation(annotation: Omit<ProfessionalAnnotation, 'id' | 'createdAt'>): string {
    const id = `annotation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const fullAnnotation: ProfessionalAnnotation = {
      ...annotation,
      id,
      createdAt: new Date(),
      author: 'User',
      fontSize: annotation.fontSize || 12,
      fontFamily: annotation.fontFamily || 'Helvetica',
      color: annotation.color || { r: 1, g: 0, b: 0 },
      strokeWidth: annotation.strokeWidth || 1,
      opacity: annotation.opacity || 1,
      rotation: annotation.rotation || 0
    };
    
    this.annotations.push(fullAnnotation);
    
    // Add to history for undo/redo
    this.addToHistory('add', fullAnnotation);
    
    console.log(`✅ [Professional] Added ${annotation.type} annotation: ${id}`);
    return id;
  }

  /**
   * Modify existing annotation
   */
  modifyAnnotation(id: string, changes: Partial<ProfessionalAnnotation>): boolean {
    const index = this.annotations.findIndex(ann => ann.id === id);
    if (index === -1) return false;
    
    const oldAnnotation = { ...this.annotations[index] };
    const updatedAnnotation = {
      ...this.annotations[index],
      ...changes,
      modifiedAt: new Date()
    };
    
    this.annotations[index] = updatedAnnotation;
    this.addToHistory('modify', oldAnnotation);
    
    console.log(`✅ [Professional] Modified annotation: ${id}`);
    return true;
  }

  /**
   * Delete annotation
   */
  deleteAnnotation(id: string): boolean {
    const index = this.annotations.findIndex(ann => ann.id === id);
    if (index === -1) return false;
    
    const deletedAnnotation = this.annotations[index];
    this.annotations.splice(index, 1);
    this.addToHistory('delete', deletedAnnotation);
    
    console.log(`✅ [Professional] Deleted annotation: ${id}`);
    return true;
  }

  /**
   * Undo last action
   */
  undo(): boolean {
    if (this.historyIndex < 0) return false;
    
    const action = this.history[this.historyIndex];
    
    switch (action.action) {
      case 'add':
        this.annotations = this.annotations.filter(ann => ann.id !== action.annotation.id);
        break;
      case 'delete':
        this.annotations.push(action.annotation);
        break;
      case 'modify':
        const index = this.annotations.findIndex(ann => ann.id === action.annotation.id);
        if (index >= 0) {
          this.annotations[index] = action.annotation;
        }
        break;
    }
    
    this.historyIndex--;
    console.log(`↩️ [Professional] Undo: ${action.action} annotation`);
    return true;
  }

  /**
   * Redo last undone action
   */
  redo(): boolean {
    if (this.historyIndex >= this.history.length - 1) return false;
    
    this.historyIndex++;
    const action = this.history[this.historyIndex];
    
    switch (action.action) {
      case 'add':
        this.annotations.push(action.annotation);
        break;
      case 'delete':
        this.annotations = this.annotations.filter(ann => ann.id !== action.annotation.id);
        break;
      case 'modify':
        const index = this.annotations.findIndex(ann => ann.id === action.annotation.id);
        if (index >= 0) {
          this.annotations[index] = action.annotation;
        }
        break;
    }
    
    console.log(`↪️ [Professional] Redo: ${action.action} annotation`);
    return true;
  }

  /**
   * Add action to history
   */
  private addToHistory(action: AnnotationHistory['action'], annotation: ProfessionalAnnotation): void {
    // Remove any history after current index (for branching undo/redo)
    this.history = this.history.slice(0, this.historyIndex + 1);
    
    this.history.push({
      action,
      annotation: { ...annotation },
      timestamp: new Date()
    });
    
    this.historyIndex = this.history.length - 1;
    
    // Limit history size
    if (this.history.length > 100) {
      this.history.shift();
      this.historyIndex--;
    }
  }

  /**
   * Save PDF with professional annotation rendering
   */
  async savePDFWithAnnotations(): Promise<Uint8Array> {
    try {
      if (!this.originalPdfBytes) {
        throw new Error('No PDF loaded for professional saving');
      }

      console.log(`💾 [Professional] Saving PDF with ${this.annotations.length} annotations`);

      // Use fresh original bytes
      const freshBytes = new Uint8Array(this.originalPdfBytes.length);
      freshBytes.set(this.originalPdfBytes);
      
      // Load with pdf-lib for editing
      const pdfDoc = await PDFDocument.load(freshBytes);
      const pages = pdfDoc.getPages();
      
      // Embed fonts
      const fonts = {
        Helvetica: await pdfDoc.embedFont(StandardFonts.Helvetica),
        HelveticaBold: await pdfDoc.embedFont(StandardFonts.HelveticaBold),
        Times: await pdfDoc.embedFont(StandardFonts.TimesRoman),
        TimesBold: await pdfDoc.embedFont(StandardFonts.TimesRomanBold),
        Courier: await pdfDoc.embedFont(StandardFonts.Courier),
        CourierBold: await pdfDoc.embedFont(StandardFonts.CourierBold)
      };

      // Apply annotations with professional rendering
      for (const annotation of this.annotations) {
        if (annotation.pageIndex >= 0 && annotation.pageIndex < pages.length) {
          const page = pages[annotation.pageIndex];
          await this.renderProfessionalAnnotation(page, annotation, fonts);
        }
      }

      // Save with optimizations
      const savedBytes = await pdfDoc.save({
        useObjectStreams: false,
        addDefaultPage: false,
        objectsPerTick: 50
      });
      
      const result = new Uint8Array(savedBytes);
      
      console.log(`✅ [Professional] PDF saved: ${result.length} bytes, ${this.annotations.length} annotations applied`);
      return result;
    } catch (error) {
      console.error('❌ [Professional] Save failed:', error);
      throw new Error(`Professional PDF save failed: ${error}`);
    }
  }

  /**
   * Render professional annotation to PDF page
   */
  private async renderProfessionalAnnotation(
    page: PDFPage, 
    annotation: ProfessionalAnnotation, 
    fonts: Record<string, PDFFont>
  ): Promise<void> {
    try {
      const { width, height } = page.getSize();
      
      // Convert screen coordinates to PDF coordinates
      const x = Math.max(0, Math.min(annotation.x, width - 10));
      const y = Math.max(0, Math.min(height - annotation.y - (annotation.height || 20), height - 20));
      
      const color = rgb(
        annotation.color?.r || 0,
        annotation.color?.g || 0,
        annotation.color?.b || 0
      );
      
      const fillColor = annotation.fillColor ? 
        rgb(annotation.fillColor.r, annotation.fillColor.g, annotation.fillColor.b) : 
        color;

      switch (annotation.type) {
        case 'text':
          if (annotation.text) {
            const font = this.selectFont(fonts, annotation);
            page.drawText(annotation.text, {
              x,
              y,
              size: annotation.fontSize || 12,
              font,
              color,
              opacity: annotation.opacity || 1,
              rotate: degrees(annotation.rotation || 0)
            });
          }
          break;

        case 'rectangle':
          page.drawRectangle({
            x,
            y,
            width: Math.min(annotation.width, width - x),
            height: Math.min(annotation.height, height - y),
            borderColor: color,
            borderWidth: annotation.strokeWidth || 1,
            color: annotation.fillColor ? fillColor : undefined,
            opacity: annotation.opacity || 1,
            rotate: degrees(annotation.rotation || 0),
            borderOpacity: annotation.opacity || 1
          });
          break;

        case 'circle':
          const radius = Math.min(annotation.width, annotation.height) / 2;
          page.drawEllipse({
            x: x + radius,
            y: y + radius,
            xScale: radius,
            yScale: radius,
            borderColor: color,
            borderWidth: annotation.strokeWidth || 1,
            color: annotation.fillColor ? fillColor : undefined,
            opacity: annotation.opacity || 1,
            borderOpacity: annotation.opacity || 1
          });
          break;

        case 'highlight':
          page.drawRectangle({
            x,
            y,
            width: Math.min(annotation.width, width - x),
            height: Math.min(annotation.height, height - y),
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
      console.warn(`⚠️ [Professional] Failed to render ${annotation.type}:`, error);
    }
  }

  /**
   * Select appropriate font based on annotation properties
   */
  private selectFont(fonts: Record<string, PDFFont>, annotation: ProfessionalAnnotation): PDFFont {
    const family = annotation.fontFamily || 'Helvetica';
    const weight = annotation.fontWeight || 'normal';
    
    if (family === 'Times') {
      return weight === 'bold' ? fonts.TimesBold : fonts.Times;
    } else if (family === 'Courier') {
      return weight === 'bold' ? fonts.CourierBold : fonts.Courier;
    } else {
      return weight === 'bold' ? fonts.HelveticaBold : fonts.Helvetica;
    }
  }

  /**
   * Get all annotations
   */
  getAnnotations(): ProfessionalAnnotation[] {
    return [...this.annotations];
  }

  /**
   * Get annotations for specific page
   */
  getPageAnnotations(pageIndex: number): ProfessionalAnnotation[] {
    return this.annotations.filter(ann => ann.pageIndex === pageIndex);
  }

  /**
   * Get annotation by ID
   */
  getAnnotation(id: string): ProfessionalAnnotation | null {
    return this.annotations.find(ann => ann.id === id) || null;
  }

  /**
   * Clear all annotations
   */
  clearAnnotations(): void {
    this.annotations = [];
    this.history = [];
    this.historyIndex = -1;
    console.log('🧹 [Professional] All annotations cleared');
  }

  /**
   * Export annotations to JSON
   */
  exportAnnotations(): string {
    return JSON.stringify({
      fileName: this.fileName,
      annotations: this.annotations,
      exportedAt: new Date().toISOString(),
      version: '1.0'
    }, null, 2);
  }

  /**
   * Import annotations from JSON
   */
  importAnnotations(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData);
      if (data.annotations && Array.isArray(data.annotations)) {
        this.annotations = data.annotations;
        console.log(`📥 [Professional] Imported ${this.annotations.length} annotations`);
        return true;
      }
      return false;
    } catch (error) {
      console.error('❌ [Professional] Import failed:', error);
      return false;
    }
  }

  /**
   * Get current PDF document
   */
  getPDFDocument(): PDFDocumentProxy | null {
    return this.pdfDocument;
  }

  /**
   * Get current file name
   */
  getFileName(): string {
    return this.fileName;
  }

  /**
   * Get history stats
   */
  getHistoryStats(): { canUndo: boolean; canRedo: boolean; totalActions: number } {
    return {
      canUndo: this.historyIndex >= 0,
      canRedo: this.historyIndex < this.history.length - 1,
      totalActions: this.history.length
    };
  }
}