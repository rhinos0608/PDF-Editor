import React, { useState } from 'react';
import { ChromePicker, ColorResult } from 'react-color';
import './AnnotationTools.css';

interface AnnotationToolsProps {
  tool: string;
  onAnnotationAdd?: (annotation: any) => void;
  penThickness: number; // New prop
  selectedColor: string; // New prop
  highlightOpacity: number; // New prop
  onToolOptionChange?: (tool: string, options: any) => void; // New prop to pass changes back
}

const AnnotationTools: React.FC<AnnotationToolsProps> = ({
  tool,
  onAnnotationAdd,
  penThickness,
  selectedColor,
  highlightOpacity,
  onToolOptionChange
}) => {
  const [fontSize, setFontSize] = useState(12);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [fontFamily, setFontFamily] = useState('Helvetica');

  const fontSizes = [8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 72];
  const fontFamilies = ['Helvetica', 'Times-Roman', 'Courier', 'Arial', 'Verdana'];
  const lineWidths = [1, 2, 3, 4, 5, 6, 8, 10];

  const renderToolOptions = () => {
    switch (tool) {
      case 'text':
        return (
          <>
            <div className="tool-option">
              <label>Font Family:</label>
              <select
                value={fontFamily}
                onChange={(e) => setFontFamily(e.target.value)}
              >
                {fontFamilies.map(font => (
                  <option key={font} value={font}>{font}</option>
                ))}
              </select>
            </div>
            <div className="tool-option">
              <label>Font Size:</label>
              <select
                value={fontSize}
                onChange={(e) => setFontSize(parseInt(e.target.value))}
              >
                {fontSizes.map(size => (
                  <option key={size} value={size}>{size}pt</option>
                ))}
              </select>
            </div>
          </>
        );
      case 'highlight':
        return (
          <div className="tool-option">
            <label>Opacity:</label>
            <input
              type="range"
              min="0.1"
              max="1"
              step="0.1"
              value={highlightOpacity}
              onChange={(e) => onToolOptionChange?.(tool, { opacity: parseFloat(e.target.value) })}
            />
            <span>{Math.round(highlightOpacity * 100)}%</span>
          </div>
        );
      case 'draw':
      case 'shapes':
      case 'pen': // Add pen tool to use line width
        return (
          <div className="tool-option">
            <label>Line Width:</label>
            <select
              value={penThickness}
              onChange={(e) => onToolOptionChange?.(tool, { thickness: parseInt(e.target.value) })}
            >
              {lineWidths.map(width => (
                <option key={width} value={width}>{width}px</option>
              ))}
            </select>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="annotation-tools">
      <div className="tools-header">
        <h3>{tool.charAt(0).toUpperCase() + tool.slice(1)} Tool</h3>
      </div>
      <div className="tools-content">
        <div className="tool-option">
          <label>Color:</label>
          <div className="color-picker-wrapper">
            <div
              className="color-preview"
              style={{ backgroundColor: selectedColor }}
              onClick={() => setShowColorPicker(!showColorPicker)}
            />
            {showColorPicker && (
              <div className="color-picker-popover">
                <div
                  className="color-picker-cover"
                  onClick={() => setShowColorPicker(false)}
                />
                <ChromePicker
                  color={selectedColor}
                  onChange={(colorResult: ColorResult) => onToolOptionChange?.(tool, { color: colorResult.hex })}
                />
              </div>
            )}
          </div>
        </div>
        {renderToolOptions()}
        {tool === 'shapes' && (
          <div className="shape-buttons">
            <button className="shape-btn" title="Rectangle">
              <i className="far fa-square"></i>
            </button>
            <button className="shape-btn" title="Circle">
              <i className="far fa-circle"></i>
            </button>
            <button className="shape-btn" title="Line">
              <i className="fas fa-minus"></i>
            </button>
            <button className="shape-btn" title="Arrow">
              <i className="fas fa-long-arrow-alt-right"></i>
            </button>
          </div>
        )}
        {tool === 'stamp' && (
          <div className="stamp-options">
            <button className="stamp-btn">Approved</button>
            <button className="stamp-btn">Rejected</button>
            <button className="stamp-btn">Confidential</button>
            <button className="stamp-btn">Draft</button>
            <button className="stamp-btn">Final</button>
            <button className="stamp-btn">Custom...</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnnotationTools;
