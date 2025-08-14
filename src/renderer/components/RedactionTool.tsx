import React, { useState, useEffect } from 'react';
import './RedactionTool.css';

interface RedactionToolProps {
  onRedact: (redactionData: any) => void;
  onCancel: () => void;
  currentPage: number;
}

const RedactionTool: React.FC<RedactionToolProps> = ({ onRedact, onCancel, currentPage }) => {
  const [redactionText, setRedactionText] = useState('');
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [currentRect, setCurrentRect] = useState<{x: number, y: number, width: number, height: number} | null>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setIsDrawing(true);
    setStartPos({ x, y });
    setCurrentRect({ x, y, width: 0, height: 0 });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDrawing) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;
    
    setCurrentRect({
      x: Math.min(startPos.x, currentX),
      y: Math.min(startPos.y, currentY),
      width: Math.abs(currentX - startPos.x),
      height: Math.abs(currentY - startPos.y)
    });
  };

  const handleMouseUp = () => {
    if (!isDrawing) return;
    
    setIsDrawing(false);
    
    if (currentRect && currentRect.width > 10 && currentRect.height > 10) {
      // Valid redaction area
      onRedact({
        x: currentRect.x,
        y: currentRect.y,
        width: currentRect.width,
        height: currentRect.height,
        pageIndex: currentPage - 1,
        reason: redactionText
      });
    }
  };

  return (
    <div className="redaction-tool-overlay">
      <div className="redaction-tool-panel">
        <div className="redaction-tool-header">
          <h3>Redact Content</h3>
          <button className="close-btn" onClick={onCancel}>×</button>
        </div>
        
        <div className="redaction-tool-content">
          <div className="redaction-instructions">
            <p>Drag to select area to redact:</p>
          </div>
          
          <div className="redaction-input-group">
            <label>Reason for redaction (optional):</label>
            <input
              type="text"
              value={redactionText}
              onChange={(e) => setRedactionText(e.target.value)}
              placeholder="e.g., Confidential, Personal Information"
            />
          </div>
          
          <div className="redaction-actions">
            <button className="btn btn-secondary" onClick={onCancel}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RedactionTool;