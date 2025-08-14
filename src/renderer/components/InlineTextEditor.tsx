import React, { useState, useRef, useEffect } from 'react';
import { EditableTextRegion } from '../services/PDFTextExtractor';
import './InlineTextEditor.css';

interface InlineTextEditorProps {
  region: EditableTextRegion;
  position: { x: number; y: number };
  zoom: number;
  onSave: (newText: string) => void;
  onCancel: () => void;
}

const InlineTextEditor: React.FC<InlineTextEditorProps> = ({
  region,
  position,
  zoom,
  onSave,
  onCancel
}) => {
  const [text, setText] = useState(region.originalText);
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select(); // Select all text for easy editing
    }
  }, []);

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

  // Calculate position to stay within viewport
  const calculatePosition = () => {
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight
    };

    let left = position.x;
    let top = position.y;

    // Adjust horizontal position
    if (left + 250 > viewport.width) {
      left = viewport.width - 260;
    }
    if (left < 10) {
      left = 10;
    }

    // Adjust vertical position  
    if (top + 100 > viewport.height) {
      top = position.y - 100;
    }
    if (top < 10) {
      top = 10;
    }

    return { left, top };
  };

  const editorPosition = calculatePosition();
  const scaledWidth = Math.max(region.width * zoom, 100); // Minimum width
  const scaledHeight = Math.max(region.height * zoom, 20); // Minimum height
  const scaledFontSize = Math.max(region.fontSize * zoom, 10); // Minimum font size

  return (
    <div 
      className="inline-text-editor"
      style={{
        position: 'fixed',
        left: editorPosition.left,
        top: editorPosition.top,
        width: Math.max(scaledWidth, 250),
        minHeight: scaledHeight,
        zIndex: 1000,
        background: 'white',
        border: '2px solid #007bff',
        borderRadius: '6px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        padding: '8px'
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