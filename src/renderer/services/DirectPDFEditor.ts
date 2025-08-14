import { PDFDocument, StandardFonts, rgb, PDFPage, PDFFont } from 'pdf-lib';
import { PDFTextExtractor, EditableTextRegion } from './PDFTextExtractor';
import { createSafePDFBytes } from '../utils/pdfUtils';

interface DirectEdit {
  id: string;
  pageIndex: number;
  oldText: string;
  newText: string;
  region: EditableTextRegion;
  timestamp: number;
}

interface PDFEditSession {
  originalPdfBytes: Uint8Array;
  edits: DirectEdit[];
  textExtractor: PDFTextExtractor;
  currentPdfBytes: Uint8Array;
}

/**
 * DirectPDFEditor - Real PDF content editing that modifies the actual PDF content
 * Not overlays or annotations - this changes the PDF text directly like a word processor
 */
export class DirectPDFEditor {
  private sessions = new Map<string, PDFEditSession>();
  private textExtractor = new PDFTextExtractor();

  /**
   * Start a PDF editing session - parses all text for editing
   */
  async startEditingSession(pdfBytes: Uint8Array, sessionId: string): Promise<EditableTextRegion[]> {
    console.log('🔍 Starting PDF editing session...');
    
    // Create safe copies to prevent ArrayBuffer detachment
    const safePdfBytes = createSafePDFBytes(pdfBytes);
    const currentPdfBytes = createSafePDFBytes(pdfBytes);
    
    // Extract all editable text regions
    const editableRegions = await this.textExtractor.extractEditableText(safePdfBytes);
    
    // Create editing session
    const session: PDFEditSession = {
      originalPdfBytes: safePdfBytes,
      edits: [],
      textExtractor: this.textExtractor,
      currentPdfBytes: currentPdfBytes
    };
    
    this.sessions.set(sessionId, session);
    
    console.log(`✅ Found ${editableRegions.length} editable text regions`);
    return editableRegions;
  }

  /**
   * Edit text at specific coordinates (click-to-edit functionality)
   */
  async editTextAtPoint(
    sessionId: string,
    pageIndex: number, 
    x: number, 
    y: number, 
    newText: string
  ): Promise<boolean> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      console.error('❌ No editing session found');
      return false;
    }

    console.log(`📝 Editing text at point (${x}, ${y}) on page ${pageIndex + 1}`);

    // Find text region at clicked coordinates
    const textRegion = await this.textExtractor.getTextAtCoordinates(
      session.currentPdfBytes, 
      pageIndex, 
      x, 
      y, 
      15 // tolerance
    );

    if (!textRegion) {
      console.log('❌ No text found at clicked coordinates');
      return false;
    }

    console.log(`✅ Found text: "${textRegion.originalText}" → "${newText}"`);

    // Create edit record
    const edit: DirectEdit = {
      id: `edit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      pageIndex,
      oldText: textRegion.originalText,
      newText,
      region: textRegion,
      timestamp: Date.now()
    };

    // Apply edit immediately
    const success = await this.applyEdit(session, edit);
    if (success) {
      session.edits.push(edit);
    }

    return success;
  }

  /**
   * Edit a specific text region by ID
   */
  async editTextRegion(
    sessionId: string,
    regionId: string,
    newText: string
  ): Promise<boolean> {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    // Find existing edit for this region or create new one
    const regions = await this.textExtractor.extractEditableText(session.originalPdfBytes);
    const region = regions.find(r => r.id === regionId);
    
    if (!region) {
      console.error(`❌ Text region ${regionId} not found`);
      return false;
    }

    const edit: DirectEdit = {
      id: `edit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      pageIndex: region.pageIndex,
      oldText: region.originalText,
      newText,
      region,
      timestamp: Date.now()
    };

    const success = await this.applyEdit(session, edit);
    if (success) {
      // Remove any previous edits for this region
      session.edits = session.edits.filter(e => e.region.id !== regionId);
      session.edits.push(edit);
    }

    return success;
  }

  /**
   * Apply an edit directly to the PDF content
   */
  private async applyEdit(session: PDFEditSession, edit: DirectEdit): Promise<boolean> {
    try {
      console.log('🔧 Applying direct PDF edit...');

      // Use text extractor's replace function to modify PDF content
      const updatedPdfBytes = await this.textExtractor.replaceTextInPDF(
        session.currentPdfBytes,
        [{
          region: edit.region,
          newText: edit.newText
        }]
      );

      // Update session with new PDF bytes
      session.currentPdfBytes = updatedPdfBytes;

      console.log('✅ PDF content successfully modified');
      return true;

    } catch (error) {
      console.error('❌ Failed to apply edit:', error);
      return false;
    }
  }

  /**
   * Get current PDF with all edits applied
   */
  async getCurrentPDF(sessionId: string): Promise<Uint8Array | null> {
    const session = this.sessions.get(sessionId);
    return session?.currentPdfBytes || null;
  }

  /**
   * Get all edits made in session
   */
  getEdits(sessionId: string): DirectEdit[] {
    const session = this.sessions.get(sessionId);
    return session?.edits || [];
  }

  /**
   * Undo last edit
   */
  async undoLastEdit(sessionId: string): Promise<boolean> {
    const session = this.sessions.get(sessionId);
    if (!session || session.edits.length === 0) return false;

    console.log('↶ Undoing last edit...');

    // Remove last edit
    const lastEdit = session.edits.pop();
    if (!lastEdit) return false;

    // Rebuild PDF by re-applying all remaining edits
    await this.rebuildPDFFromEdits(session);

    console.log('✅ Edit undone successfully');
    return true;
  }

  /**
   * Undo all edits (revert to original)
   */
  async revertAllEdits(sessionId: string): Promise<boolean> {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    console.log('↶ Reverting all edits...');

    // Reset to original PDF
    session.currentPdfBytes = session.originalPdfBytes;
    session.edits = [];

    console.log('✅ All edits reverted');
    return true;
  }

  /**
   * Rebuild PDF from scratch applying all edits in sequence
   */
  private async rebuildPDFFromEdits(session: PDFEditSession): Promise<void> {
    console.log('🔄 Rebuilding PDF from edits...');

    // Start with original PDF
    let currentPdfBytes = session.originalPdfBytes;

    // Apply each edit in sequence
    for (const edit of session.edits) {
      try {
        currentPdfBytes = await this.textExtractor.replaceTextInPDF(
          currentPdfBytes,
          [{
            region: edit.region,
            newText: edit.newText
          }]
        );
      } catch (error) {
        console.error(`❌ Failed to apply edit ${edit.id}:`, error);
      }
    }

    // Update session
    session.currentPdfBytes = currentPdfBytes;
    console.log('✅ PDF rebuilt successfully');
  }

  /**
   * Search and replace text throughout the PDF
   */
  async searchAndReplace(
    sessionId: string,
    searchText: string,
    replaceText: string,
    caseSensitive: boolean = false
  ): Promise<number> {
    const session = this.sessions.get(sessionId);
    if (!session) return 0;

    console.log(`🔍 Search and replace: "${searchText}" → "${replaceText}"`);

    // Get all text content
    const allTextContent = await this.textExtractor.getAllTextContent(session.currentPdfBytes);
    
    const flags = caseSensitive ? 'g' : 'gi';
    const regex = new RegExp(searchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), flags);
    
    let replacementCount = 0;
    const editsToApply: DirectEdit[] = [];

    // Find all matches
    for (const textItem of allTextContent) {
      if (regex.test(textItem.text)) {
        const newText = textItem.text.replace(regex, replaceText);
        
        // Create synthetic region for this text item
        const region: EditableTextRegion = {
          id: `search_replace_${Date.now()}_${replacementCount}`,
          originalText: textItem.text,
          x: textItem.x,
          y: textItem.y,
          width: textItem.width,
          height: textItem.height,
          fontSize: 12,
          fontName: 'Helvetica',
          pageIndex: textItem.pageIndex,
          textItems: []
        };

        const edit: DirectEdit = {
          id: `search_edit_${Date.now()}_${replacementCount}`,
          pageIndex: textItem.pageIndex,
          oldText: textItem.text,
          newText,
          region,
          timestamp: Date.now()
        };

        editsToApply.push(edit);
        replacementCount++;
      }
    }

    // Apply all replacements
    if (editsToApply.length > 0) {
      session.currentPdfBytes = await this.textExtractor.replaceTextInPDF(
        session.currentPdfBytes,
        editsToApply.map(edit => ({
          region: edit.region,
          newText: edit.newText
        }))
      );

      session.edits.push(...editsToApply);
    }

    console.log(`✅ Replaced ${replacementCount} occurrences`);
    return replacementCount;
  }

  /**
   * Get edit history for display in UI
   */
  getEditHistory(sessionId: string): Array<{
    id: string;
    pageIndex: number;
    oldText: string;
    newText: string;
    timestamp: number;
  }> {
    const session = this.sessions.get(sessionId);
    if (!session) return [];

    return session.edits.map(edit => ({
      id: edit.id,
      pageIndex: edit.pageIndex,
      oldText: edit.oldText.substring(0, 50) + (edit.oldText.length > 50 ? '...' : ''),
      newText: edit.newText.substring(0, 50) + (edit.newText.length > 50 ? '...' : ''),
      timestamp: edit.timestamp
    }));
  }

  /**
   * End editing session and clean up
   */
  async endEditingSession(sessionId: string): Promise<Uint8Array | null> {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    const finalPdfBytes = session.currentPdfBytes;
    this.sessions.delete(sessionId);

    console.log('✅ PDF editing session ended');
    return finalPdfBytes;
  }
}