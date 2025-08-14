import React, { useState, useEffect, useCallback, useRef } from 'react';
import { DirectPDFEditor } from '../services/DirectPDFEditor';
import { EditableTextRegion } from '../services/PDFTextExtractor';
import InlineTextEditor from './InlineTextEditor';
import './PDFEditMode.css';

interface PDFEditModeProps {
  pdfBytes: Uint8Array;
  currentPage: number;
  zoom: number;
  onPDFUpdate: (newPdfBytes: Uint8Array) => void;
  isActive: boolean;
}

interface ActiveEdit {
  region: EditableTextRegion;
  position: { x: number; y: number };
}

const PDFEditMode: React.FC<PDFEditModeProps> = ({
  pdfBytes,
  currentPage,
  zoom,
  onPDFUpdate,
  isActive
}) => {
  const [editableRegions, setEditableRegions] = useState<EditableTextRegion[]>([]);
  const [activeEdit, setActiveEdit] = useState<ActiveEdit | null>(null);
  const [editHistory, setEditHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [replaceTerm, setReplaceTerm] = useState('');
  
  const editorRef = useRef(new DirectPDFEditor());
  const sessionId = useRef(`session_${Date.now()}`);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Initialize editing session when activated
  useEffect(() => {
    if (isActive && pdfBytes) {
      initializeEditingSession();
    } else if (!isActive) {
      cleanup();
    }
  }, [isActive, pdfBytes]);

  const initializeEditingSession = async () => {
    setIsLoading(true);
    try {
      console.log('🔍 Initializing PDF edit mode...');
      const regions = await editorRef.current.startEditingSession(pdfBytes, sessionId.current);
      setEditableRegions(regions);
      console.log(`✅ Found ${regions.length} editable text regions`);
    } catch (error) {
      console.error('❌ Failed to initialize editing session:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const cleanup = () => {
    setEditableRegions([]);
    setActiveEdit(null);
    setEditHistory([]);
    editorRef.current.endEditingSession(sessionId.current);
  };

  // Handle click on PDF to start editing text
  const handlePDFClick = useCallback((event: React.MouseEvent) => {
    if (!isActive || activeEdit) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - rect.left) / zoom;
    const y = (event.clientY - rect.top) / zoom;

    console.log(`🖱️ PDF clicked at (${x}, ${y}) on page ${currentPage}`);

    // Find text region at click coordinates
    const clickedRegion = editableRegions.find(region => {
      if (region.pageIndex !== currentPage - 1) return false;
      
      return x >= region.x && x <= region.x + region.width &&
             y >= region.y && y <= region.y + region.height;
    });

    if (clickedRegion) {
      console.log(`✅ Found editable text: "${clickedRegion.originalText}"`);
      setActiveEdit({
        region: clickedRegion,
        position: { x: event.clientX - rect.left, y: event.clientY - rect.top }
      });
    } else {
      console.log('ℹ️ No editable text found at click location');
    }
  }, [isActive, activeEdit, editableRegions, currentPage, zoom]);

  // Save text edit
  const handleTextSave = async (newText: string) => {
    if (!activeEdit) return;

    setIsLoading(true);
    try {
      console.log(`💾 Saving text edit: "${activeEdit.region.originalText}" → "${newText}"`);
      
      const success = await editorRef.current.editTextRegion(
        sessionId.current,
        activeEdit.region.id,
        newText
      );

      if (success) {
        // Get updated PDF
        const updatedPdf = await editorRef.current.getCurrentPDF(sessionId.current);
        if (updatedPdf) {
          onPDFUpdate(updatedPdf);
          
          // Update edit history
          const history = editorRef.current.getEditHistory(sessionId.current);
          setEditHistory(history);
          
          // Re-initialize regions with updated PDF
          setTimeout(() => initializeEditingSession(), 100);
        }
        
        console.log('✅ Text edit saved successfully');
      } else {
        console.error('❌ Failed to save text edit');
      }
    } catch (error) {
      console.error('❌ Error saving text edit:', error);
    } finally {
      setActiveEdit(null);
      setIsLoading(false);
    }
  };

  // Cancel text edit
  const handleTextCancel = () => {
    console.log('↶ Text edit cancelled');
    setActiveEdit(null);
  };

  // Undo last edit
  const handleUndo = async () => {
    if (editHistory.length === 0) return;

    setIsLoading(true);
    try {
      const success = await editorRef.current.undoLastEdit(sessionId.current);
      if (success) {
        const updatedPdf = await editorRef.current.getCurrentPDF(sessionId.current);
        if (updatedPdf) {
          onPDFUpdate(updatedPdf);
          const history = editorRef.current.getEditHistory(sessionId.current);
          setEditHistory(history);
          setTimeout(() => initializeEditingSession(), 100);
        }
      }
    } catch (error) {
      console.error('❌ Error undoing edit:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Search and replace functionality
  const handleSearchReplace = async () => {
    if (!searchTerm.trim()) return;

    setIsLoading(true);
    try {
      const replaceCount = await editorRef.current.searchAndReplace(
        sessionId.current,
        searchTerm,
        replaceTerm,
        false // case insensitive
      );

      if (replaceCount > 0) {
        const updatedPdf = await editorRef.current.getCurrentPDF(sessionId.current);
        if (updatedPdf) {
          onPDFUpdate(updatedPdf);
          const history = editorRef.current.getEditHistory(sessionId.current);
          setEditHistory(history);
          setTimeout(() => initializeEditingSession(), 100);
        }
        
        console.log(`✅ Replaced ${replaceCount} occurrences`);
      } else {
        console.log('ℹ️ No occurrences found');
      }
    } catch (error) {
      console.error('❌ Error in search and replace:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isActive) return null;

  return (
    <div className="pdf-edit-mode">
      {/* Edit Mode Controls */}
      <div className="edit-mode-controls">
        <div className="edit-tools">
          <h3>✏️ PDF Edit Mode</h3>
          <p>Click on any text to edit it directly</p>
          
          {/* Search and Replace */}
          <div className="search-replace">
            <input
              type="text"
              placeholder="Search text..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            <input
              type="text"
              placeholder="Replace with..."
              value={replaceTerm}
              onChange={(e) => setReplaceTerm(e.target.value)}
              className="replace-input"
            />
            <button 
              onClick={handleSearchReplace}
              disabled={!searchTerm.trim() || isLoading}
              className="replace-btn"
            >
              Replace All
            </button>
          </div>

          {/* Edit Actions */}
          <div className="edit-actions">
            <button 
              onClick={handleUndo}
              disabled={editHistory.length === 0 || isLoading}
              className="undo-btn"
            >
              ↶ Undo ({editHistory.length})
            </button>
          </div>

          {/* Status */}
          <div className="edit-status">
            {isLoading && <span className="loading">⏳ Processing...</span>}
            <span className="regions-count">
              {editableRegions.length} editable regions found
            </span>
          </div>
        </div>

        {/* Edit History */}
        {editHistory.length > 0 && (
          <div className="edit-history">
            <h4>Recent Edits:</h4>
            <div className="history-list">
              {editHistory.slice(-5).map((edit, index) => (
                <div key={edit.id} className="history-item">
                  <span className="edit-page">P{edit.pageIndex + 1}</span>
                  <span className="edit-change">
                    "{edit.oldText}" → "{edit.newText}"
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* PDF Click Overlay */}
      <div 
        ref={overlayRef}
        className="pdf-click-overlay"
        onClick={handlePDFClick}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: isActive ? 100 : -1,
          cursor: 'text',
          pointerEvents: activeEdit ? 'none' : 'auto'
        }}
      >
        {/* Visual indicators for editable regions */}
        {editableRegions
          .filter(region => region.pageIndex === currentPage - 1)
          .map(region => (
            <div
              key={region.id}
              className="editable-region-highlight"
              style={{
                position: 'absolute',
                left: region.x * zoom,
                top: region.y * zoom,
                width: region.width * zoom,
                height: region.height * zoom,
                background: 'rgba(0, 123, 255, 0.1)',
                border: '1px dashed rgba(0, 123, 255, 0.3)',
                borderRadius: '2px',
                pointerEvents: 'none',
                transition: 'all 0.2s ease'
              }}
              title={`Click to edit: "${region.originalText.substring(0, 50)}..."`}
            />
          ))
        }
      </div>

      {/* Inline Text Editor */}
      {activeEdit && (
        <InlineTextEditor
          region={activeEdit.region}
          zoom={zoom}
          onSave={handleTextSave}
          onCancel={handleTextCancel}
          isVisible={true}
        />
      )}
    </div>
  );
};

export default PDFEditMode;