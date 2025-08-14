import React, { useState } from 'react';
import './WatermarkDialog.css';

interface WatermarkDialogProps {
  onAdd: (text: string, options: any) => void;
  onCancel: () => void;
}

const WatermarkDialog: React.FC<WatermarkDialogProps> = ({ onAdd, onCancel }) => {
  const [watermarkText, setWatermarkText] = useState('CONFIDENTIAL');
  const [fontSize, setFontSize] = useState(48);
  const [opacity, setOpacity] = useState(0.5);
  const [rotation, setRotation] = useState(45);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd(watermarkText, { fontSize, opacity, rotation });
  };

  return (
    <div className="watermark-dialog-overlay">
      <div className="watermark-dialog-panel">
        <div className="watermark-dialog-header">
          <h3>Add Watermark</h3>
          <button className="close-btn" onClick={onCancel}>×</button>
        </div>
        
        <form className="watermark-dialog-content" onSubmit={handleSubmit}>
          <div className="watermark-input-group">
            <label>Watermark Text:</label>
            <input
              type="text"
              value={watermarkText}
              onChange={(e) => setWatermarkText(e.target.value)}
              placeholder="Enter watermark text"
              required
            />
          </div>
          
          <div className="watermark-input-group">
            <label>Font Size:</label>
            <input
              type="range"
              min="12"
              max="100"
              value={fontSize}
              onChange={(e) => setFontSize(parseInt(e.target.value))}
            />
            <span className="slider-value">{fontSize}px</span>
          </div>
          
          <div className="watermark-input-group">
            <label>Opacity:</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={opacity}
              onChange={(e) => setOpacity(parseFloat(e.target.value))}
            />
            <span className="slider-value">{opacity}</span>
          </div>
          
          <div className="watermark-input-group">
            <label>Rotation:</label>
            <input
              type="range"
              min="0"
              max="360"
              value={rotation}
              onChange={(e) => setRotation(parseInt(e.target.value))}
            />
            <span className="slider-value">{rotation}°</span>
          </div>
          
          <div className="watermark-preview">
            <div 
              className="watermark-preview-text"
              style={{
                fontSize: `${fontSize * 0.5}px`,
                opacity: opacity,
                transform: `rotate(${rotation}deg)`
              }}
            >
              {watermarkText}
            </div>
          </div>
          
          <div className="watermark-actions">
            <button type="button" className="btn btn-secondary" onClick={onCancel}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Add Watermark
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default WatermarkDialog;