import React, { useState, useRef, useEffect } from 'react';
import { EditableTextRegion } from '../services/PDFTextExtractor';
import './InlineTextEditor.css';

interface InlineTextEditorProps {
  region: EditableTextRegion;
  zoom: number;
  onSave: (newText: string) => void;
  onCancel: () => void;
  isVisible: boolean;
}

const InlineTextEditor: React.FC<InlineTextEditorProps> = ({
  region,
  zoom,
  onSave,
  onCancel,
  isVisible
}) => {
  const [text, setText] = useState(region.originalText);
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isVisible && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select(); // Select all text for easy editing
    }
  }, [isVisible]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    e.stopPropagation(); // Prevent PDF viewer shortcuts
    
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    }
  };

  const handleSave = () => {
    if (text.trim() !== region.originalText) {
      onSave(text.trim());
    } else {
      onCancel();
    }
  };

  const handleCancel = () => {
    setText(region.originalText);
    onCancel();
  };

  const handleBlur = () => {
    setIsFocused(false);
    // Auto-save on blur if text changed
    if (text.trim() !== region.originalText) {
      handleSave();
    } else {
      handleCancel();
    }
  };

  if (!isVisible) return null;

  // Calculate scaled dimensions and position
  const scaledX = region.x * zoom;
  const scaledY = region.y * zoom;
  const scaledWidth = Math.max(region.width * zoom, 100); // Minimum width
  const scaledHeight = Math.max(region.height * zoom, 20); // Minimum height
  const scaledFontSize = Math.max(region.fontSize * zoom, 10); // Minimum font size

  return (
    <div 
      className="inline-text-editor"
      style={{
        position: 'absolute',
        left: scaledX,
        top: scaledY,
        width: scaledWidth,
        minHeight: scaledHeight,
        zIndex: 1000
      }}
    >
      <textarea
        ref={textareaRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => setIsFocused(true)}
        onBlur={handleBlur}
        className="text-editor-input"
        style={{
          width: '100%',
          minHeight: scaledHeight,
          fontSize: scaledFontSize,
          fontFamily: region.fontName || 'Arial, sans-serif',
          resize: 'both',
          border: '2px solid #007bff',
          borderRadius: '3px',
          padding: '2px 4px',
          background: '#fff',
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
          outline: 'none'
        }}
        rows={Math.max(1, Math.ceil(text.length / 50))}
        autoFocus
      />
      
      {/* Edit controls */}
      <div className="edit-controls">
        <button
          className="save-btn"
          onClick={handleSave}
          title="Save changes (Enter)"
        >
          ✓
        </button>
        <button
          className="cancel-btn"
          onClick={handleCancel}
          title="Cancel changes (Escape)"
        >
          ✕
        </button>
      </div>

      {/* Word processor-like info */}
      <div className="editor-info">
        <span className="char-count">{text.length} chars</span>
        <span className="position-info">Page {region.pageIndex + 1}</span>
      </div>
    </div>
  );
};

export default InlineTextEditor;