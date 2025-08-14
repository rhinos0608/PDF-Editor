import { PDFDocument, rgb, StandardFonts, PDFPage, PDFFont, degrees } from 'pdf-lib';
import { v4 as uuidv4 } from 'uuid';
import { createSafePDFBytes } from '../utils/pdfUtils';

export interface Annotation {
  id: string;
  type: 'text' | 'highlight' | 'underline' | 'strikethrough' | 'note' | 'ink' | 
        'rectangle' | 'circle' | 'arrow' | 'line' | 'polygon' | 'stamp' | 'signature';
  pageIndex: number;
  x: number;
  y: number;
  width?: number;
  height?: number;
  text?: string;
  color?: { r: number; g: number; b: number };
  opacity?: number;
  fontSize?: number;
  fontFamily?: string;
  borderWidth?: number;
  borderColor?: { r: number; g: number; b: number };
  fillColor?: { r: number; g: number; b: number };
  points?: { x: number; y: number }[];
  rotation?: number;
  author?: string;
  createdAt: Date;
  modifiedAt: Date;
  replies?: AnnotationReply[];
  isLocked?: boolean;
  isHidden?: boolean;
}

export interface AnnotationReply {
  id: string;
  text: string;
  author: string;
  createdAt: Date;
}

export interface DrawingPath {
  points: { x: number; y: number }[];
  color: { r: number; g: number; b: number };
  width: number;
  opacity: number;
}

export class AnnotationService {
  private annotations: Map<string, Annotation> = new Map();
  private history: Annotation[][] = [];
  private historyIndex: number = -1;
  private maxHistorySize: number = 50;

  // Create a new annotation
  createAnnotation(
    type: Annotation['type'],
    pageIndex: number,
    x: number,
    y: number,
    options: Partial<Annotation> = {}
  ): Annotation {
    const annotation: Annotation = {
      id: uuidv4(),
      type,
      pageIndex,
      x,
      y,
      createdAt: new Date(),
      modifiedAt: new Date(),
      ...options
    };
    
    this.annotations.set(annotation.id, annotation);
    this.addToHistory();
    return annotation;
  }

  // Get all annotations for a specific page
  getPageAnnotations(pageIndex: number): Annotation[] {
    return Array.from(this.annotations.values())
      .filter(ann => ann.pageIndex === pageIndex && !ann.isHidden);
  }

  // Get all annotations
  getAllAnnotations(): Annotation[] {
    return Array.from(this.annotations.values());
  }

  // Update an annotation
  updateAnnotation(id: string, updates: Partial<Annotation>): Annotation | null {
    const annotation = this.annotations.get(id);
    if (!annotation || annotation.isLocked) return null;
    
    const updated = {
      ...annotation,
      ...updates,
      modifiedAt: new Date()
    };
    
    this.annotations.set(id, updated);
    this.addToHistory();
    return updated;
  }

  // Delete an annotation
  deleteAnnotation(id: string): boolean {
    const annotation = this.annotations.get(id);
    if (!annotation || annotation.isLocked) return false;
    
    const deleted = this.annotations.delete(id);
    if (deleted) {
      this.addToHistory();
    }
    return deleted;
  }

  // Delete multiple annotations
  deleteAnnotations(ids: string[]): number {
    let deletedCount = 0;
    ids.forEach(id => {
      if (this.deleteAnnotation(id)) {
        deletedCount++;
      }
    });
    return deletedCount;
  }

  // Clear all annotations for a page
  clearPageAnnotations(pageIndex: number): void {
    const pageAnnotations = this.getPageAnnotations(pageIndex);
    pageAnnotations.forEach(ann => {
      if (!ann.isLocked) {
        this.annotations.delete(ann.id);
      }
    });
    this.addToHistory();
  }

  // Clear all annotations
  clearAllAnnotations(): void {
    const allAnnotations = Array.from(this.annotations.values());
    allAnnotations.forEach(ann => {
      if (!ann.isLocked) {
        this.annotations.delete(ann.id);
      }
    });
    this.addToHistory();
  }

  // Apply annotations to PDF
  async applyAnnotationsToPDF(pdfBytes: Uint8Array): Promise<Uint8Array> {
    const safePdfBytes = createSafePDFBytes(pdfBytes);
    const pdfDoc = await PDFDocument.load(safePdfBytes);
    const pages = pdfDoc.getPages();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    
    for (const annotation of this.annotations.values()) {
      if (annotation.isHidden || annotation.pageIndex >= pages.length) continue;
      
      const page = pages[annotation.pageIndex];
      await this.drawAnnotation(page, annotation, font, boldFont);
    }
    
    return await pdfDoc.save();
  }

  // Draw annotation on page
  private async drawAnnotation(
    page: PDFPage,
    annotation: Annotation,
    font: PDFFont,
    boldFont: PDFFont
  ): Promise<void> {
    const color = annotation.color || { r: 0, g: 0, b: 0 };
    const opacity = annotation.opacity || 1;
    
    switch (annotation.type) {
      case 'text':
        if (annotation.text) {
          page.drawText(annotation.text, {
            x: annotation.x,
            y: annotation.y,
            size: annotation.fontSize || 12,
            font: annotation.fontFamily?.includes('Bold') ? boldFont : font,
            color: rgb(color.r, color.g, color.b),
            opacity,
            rotate: annotation.rotation ? degrees(annotation.rotation) : undefined
          });
        }
        break;
      
      case 'highlight':
        if (annotation.width && annotation.height) {
          page.drawRectangle({
            x: annotation.x,
            y: annotation.y,
            width: annotation.width,
            height: annotation.height,
            color: rgb(1, 1, 0), // Yellow highlight
            opacity: 0.3
          });
        }
        break;
      
      case 'underline':
        if (annotation.width) {
          page.drawLine({
            start: { x: annotation.x, y: annotation.y },
            end: { x: annotation.x + annotation.width, y: annotation.y },
            thickness: 1,
            color: rgb(color.r, color.g, color.b),
            opacity
          });
        }
        break;
      
      case 'strikethrough':
        if (annotation.width) {
          page.drawLine({
            start: { x: annotation.x, y: annotation.y + 5 },
            end: { x: annotation.x + annotation.width, y: annotation.y + 5 },
            thickness: 1,
            color: rgb(color.r, color.g, color.b),
            opacity
          });
        }
        break;
      
      case 'rectangle':
        if (annotation.width && annotation.height) {
          const borderColor = annotation.borderColor || color;
          const fillColor = annotation.fillColor;
          
          if (fillColor) {
            page.drawRectangle({
              x: annotation.x,
              y: annotation.y,
              width: annotation.width,
              height: annotation.height,
              color: rgb(fillColor.r, fillColor.g, fillColor.b),
              opacity: opacity * 0.5
            });
          }
          
          page.drawRectangle({
            x: annotation.x,
            y: annotation.y,
            width: annotation.width,
            height: annotation.height,
            borderColor: rgb(borderColor.r, borderColor.g, borderColor.b),
            borderWidth: annotation.borderWidth || 1,
            opacity
          });
        }
        break;
      
      case 'circle':
        if (annotation.width && annotation.height) {
          const borderColor = annotation.borderColor || color;
          const fillColor = annotation.fillColor;
          
          if (fillColor) {
            page.drawEllipse({
              x: annotation.x + annotation.width / 2,
              y: annotation.y + annotation.height / 2,
              xScale: annotation.width / 2,
              yScale: annotation.height / 2,
              color: rgb(fillColor.r, fillColor.g, fillColor.b),
              opacity: opacity * 0.5
            });
          }
          
          page.drawEllipse({
            x: annotation.x + annotation.width / 2,
            y: annotation.y + annotation.height / 2,
            xScale: annotation.width / 2,
            yScale: annotation.height / 2,
            borderColor: rgb(borderColor.r, borderColor.g, borderColor.b),
            borderWidth: annotation.borderWidth || 1,
            opacity
          });
        }
        break;
      
      case 'arrow':
        if (annotation.width) {
          const endX = annotation.x + annotation.width;
          const endY = annotation.y + (annotation.height || 0);
          
          // Draw arrow line
          page.drawLine({
            start: { x: annotation.x, y: annotation.y },
            end: { x: endX, y: endY },
            thickness: annotation.borderWidth || 2,
            color: rgb(color.r, color.g, color.b),
            opacity
          });
          
          // Draw arrowhead
          const angle = Math.atan2(endY - annotation.y, endX - annotation.x);
          const arrowLength = 10;
          const arrowAngle = Math.PI / 6;
          
          page.drawLine({
            start: { x: endX, y: endY },
            end: {
              x: endX - arrowLength * Math.cos(angle - arrowAngle),
              y: endY - arrowLength * Math.sin(angle - arrowAngle)
            },
            thickness: annotation.borderWidth || 2,
            color: rgb(color.r, color.g, color.b),
            opacity
          });
          
          page.drawLine({
            start: { x: endX, y: endY },
            end: {
              x: endX - arrowLength * Math.cos(angle + arrowAngle),
              y: endY - arrowLength * Math.sin(angle + arrowAngle)
            },
            thickness: annotation.borderWidth || 2,
            color: rgb(color.r, color.g, color.b),
            opacity
          });
        }
        break;
      
      case 'line':
        if (annotation.width) {
          page.drawLine({
            start: { x: annotation.x, y: annotation.y },
            end: { 
              x: annotation.x + annotation.width, 
              y: annotation.y + (annotation.height || 0) 
            },
            thickness: annotation.borderWidth || 1,
            color: rgb(color.r, color.g, color.b),
            opacity
          });
        }
        break;
      
      case 'ink':
        if (annotation.points && annotation.points.length > 1) {
          for (let i = 0; i < annotation.points.length - 1; i++) {
            page.drawLine({
              start: annotation.points[i],
              end: annotation.points[i + 1],
              thickness: annotation.borderWidth || 2,
              color: rgb(color.r, color.g, color.b),
              opacity
            });
          }
        }
        break;
      
      case 'note':
        // Draw note icon
        const noteSize = 20;
        page.drawRectangle({
          x: annotation.x,
          y: annotation.y,
          width: noteSize,
          height: noteSize,
          color: rgb(1, 1, 0.8),
          borderColor: rgb(0.8, 0.8, 0),
          borderWidth: 1
        });
        
        // Draw note symbol
        page.drawText('✎', {
          x: annotation.x + 5,
          y: annotation.y + 5,
          size: 12,
          font,
          color: rgb(0, 0, 0)
        });
        break;
      
      case 'stamp':
        if (annotation.text) {
          // Draw stamp background
          const stampPadding = 10;
          const textWidth = font.widthOfTextAtSize(annotation.text, annotation.fontSize || 16);
          
          page.drawRectangle({
            x: annotation.x - stampPadding,
            y: annotation.y - stampPadding / 2,
            width: textWidth + stampPadding * 2,
            height: (annotation.fontSize || 16) + stampPadding,
            color: rgb(1, 0.9, 0.9),
            borderColor: rgb(1, 0, 0),
            borderWidth: 2
          });
          
          // Draw stamp text
          page.drawText(annotation.text, {
            x: annotation.x,
            y: annotation.y,
            size: annotation.fontSize || 16,
            font: boldFont,
            color: rgb(1, 0, 0),
            rotate: annotation.rotation ? degrees(annotation.rotation) : undefined
          });
        }
        break;
      
      case 'signature':
        if (annotation.points && annotation.points.length > 1) {
          // Draw signature as ink
          for (let i = 0; i < annotation.points.length - 1; i++) {
            page.drawLine({
              start: annotation.points[i],
              end: annotation.points[i + 1],
              thickness: 2,
              color: rgb(0, 0, 0.5),
              opacity
            });
          }
        } else if (annotation.text) {
          // Draw text signature
          page.drawText(annotation.text, {
            x: annotation.x,
            y: annotation.y,
            size: annotation.fontSize || 20,
            font: boldFont,
            color: rgb(0, 0, 0.5),
            opacity
          });
        }
        break;
    }
  }

  // Add reply to annotation
  addReply(annotationId: string, text: string, author: string): AnnotationReply | null {
    const annotation = this.annotations.get(annotationId);
    if (!annotation) return null;
    
    const reply: AnnotationReply = {
      id: uuidv4(),
      text,
      author,
      createdAt: new Date()
    };
    
    if (!annotation.replies) {
      annotation.replies = [];
    }
    annotation.replies.push(reply);
    annotation.modifiedAt = new Date();
    
    this.addToHistory();
    return reply;
  }

  // Lock/unlock annotation
  setLockStatus(id: string, isLocked: boolean): boolean {
    const annotation = this.annotations.get(id);
    if (!annotation) return false;
    
    annotation.isLocked = isLocked;
    this.addToHistory();
    return true;
  }

  // Hide/show annotation
  setVisibility(id: string, isHidden: boolean): boolean {
    const annotation = this.annotations.get(id);
    if (!annotation) return false;
    
    annotation.isHidden = isHidden;
    this.addToHistory();
    return true;
  }

  // Search annotations
  searchAnnotations(query: string): Annotation[] {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.annotations.values()).filter(ann => {
      if (ann.text?.toLowerCase().includes(lowerQuery)) return true;
      if (ann.replies?.some(reply => reply.text.toLowerCase().includes(lowerQuery))) return true;
      return false;
    });
  }

  // Export annotations to JSON
  exportAnnotations(): string {
    const annotations = Array.from(this.annotations.values());
    return JSON.stringify(annotations, null, 2);
  }

  // Import annotations from JSON
  importAnnotations(json: string): void {
    try {
      const annotations = JSON.parse(json) as Annotation[];
      this.annotations.clear();
      annotations.forEach(ann => {
        this.annotations.set(ann.id, ann);
      });
      this.addToHistory();
    } catch (error) {
      console.error('Error importing annotations:', error);
      throw new Error('Invalid annotation data');
    }
  }

  // Undo/Redo functionality
  private addToHistory(): void {
    // Remove any history after current index
    this.history = this.history.slice(0, this.historyIndex + 1);
    
    // Add current state to history
    const currentState = Array.from(this.annotations.values());
    this.history.push(currentState);
    
    // Limit history size
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
    } else {
      this.historyIndex++;
    }
  }

  undo(): void {
    if (this.historyIndex > 0) {
      this.historyIndex--;
      this.restoreFromHistory();
    }
  }

  redo(): void {
    if (this.historyIndex < this.history.length - 1) {
      this.historyIndex++;
      this.restoreFromHistory();
    }
  }

  private restoreFromHistory(): void {
    const state = this.history[this.historyIndex];
    this.annotations.clear();
    state.forEach(ann => {
      this.annotations.set(ann.id, ann);
    });
  }

  canUndo(): boolean {
    return this.historyIndex > 0;
  }

  canRedo(): boolean {
    return this.historyIndex < this.history.length - 1;
  }

  // Get annotation statistics
  getStatistics(): {
    total: number;
    byType: Record<string, number>;
    byPage: Record<number, number>;
  } {
    const annotations = Array.from(this.annotations.values());
    const byType: Record<string, number> = {};
    const byPage: Record<number, number> = {};
    
    annotations.forEach(ann => {
      byType[ann.type] = (byType[ann.type] || 0) + 1;
      byPage[ann.pageIndex] = (byPage[ann.pageIndex] || 0) + 1;
    });
    
    return {
      total: annotations.length,
      byType,
      byPage
    };
  }
}
