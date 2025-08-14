import React from 'react';
import './Toolbar.css';

interface ToolbarProps {
  currentTool: string;
  onToolChange: (tool: string) => void;
  zoom: number;
  onZoomChange: (zoom: number) => void;
  onOpenFile: () => void;
  onSaveFile: () => void;
  onPrint: () => void;
  hasDocument: boolean;
}

const Toolbar: React.FC<ToolbarProps> = ({
  currentTool,
  onToolChange,
  zoom,
  onZoomChange,
  onOpenFile,
  onSaveFile,
  onPrint,
  hasDocument
}) => {
  const tools = [
    { id: 'select', icon: 'fa-mouse-pointer', tooltip: 'Select' },
    { id: 'edit', icon: 'fa-edit', tooltip: 'Edit Text (Direct Editing)' },
    { id: 'text', icon: 'fa-font', tooltip: 'Add Text' },
    { id: 'highlight', icon: 'fa-highlighter', tooltip: 'Highlight' },
    { id: 'draw', icon: 'fa-pen', tooltip: 'Draw' },
    { id: 'shapes', icon: 'fa-shapes', tooltip: 'Shapes' },
    { id: 'stamp', icon: 'fa-stamp', tooltip: 'Stamp' },
    { id: 'signature', icon: 'fa-signature', tooltip: 'Signature' },
    { id: 'eraser', icon: 'fa-eraser', tooltip: 'Eraser' },
    { id: 'note', icon: 'fa-sticky-note', tooltip: 'Add Note' },
    { id: 'link', icon: 'fa-link', tooltip: 'Add Link' },
    { id: 'redact', icon: 'fa-ban', tooltip: 'Redact' },
    { id: 'watermark', icon: 'fa-tint', tooltip: 'Add Watermark' }
  ];

  const zoomLevels = [25, 50, 75, 100, 125, 150, 200, 300, 400];

  return (
    <div className="toolbar">
      <div className="toolbar-section">
        <button className="toolbar-btn" onClick={onOpenFile} title="Open">
          <i className="fas fa-folder-open"></i>
        </button>
        <button className="toolbar-btn" onClick={onSaveFile} disabled={!hasDocument} title="Save">
          <i className="fas fa-save"></i>
        </button>
        <button className="toolbar-btn" onClick={onPrint} disabled={!hasDocument} title="Print">
          <i className="fas fa-print"></i>
        </button>
      </div>

      <div className="toolbar-divider"></div>

      <div className="toolbar-section">
        <button
          className="toolbar-btn"
          onClick={() => onZoomChange(zoom - 10)}
          disabled={zoom <= 25}
          title="Zoom Out"
        >
          <i className="fas fa-search-minus"></i>
        </button>
        <select
          className="zoom-select"
          value={zoom}
          onChange={(e) => onZoomChange(parseInt(e.target.value))}
        >
          {zoomLevels.map(level => (
            <option key={level} value={level}>{level}%</option>
          ))}
          <option value={zoom}>{zoom}%</option>
        </select>
        <button
          className="toolbar-btn"
          onClick={() => onZoomChange(zoom + 10)}
          disabled={zoom >= 400}
          title="Zoom In"
        >
          <i className="fas fa-search-plus"></i>
        </button>
      </div>

      <div className="toolbar-divider"></div>

      <div className="toolbar-section tools-section">
        {tools.map(tool => (
          <button
            key={tool.id}
            className={`toolbar-btn tool-btn ${currentTool === tool.id ? 'active' : ''}`}
            onClick={() => onToolChange(tool.id)}
            disabled={!hasDocument}
            title={tool.tooltip}
          >
            <i className={`fas ${tool.icon}`}></i>
          </button>
        ))}
      </div>

      <div className="toolbar-divider"></div>

      <div className="toolbar-section">
        <button className="toolbar-btn" disabled={!hasDocument} title="Undo">
          <i className="fas fa-undo"></i>
        </button>
        <button className="toolbar-btn" disabled={!hasDocument} title="Redo">
          <i className="fas fa-redo"></i>
        </button>
      </div>

      <div className="toolbar-divider"></div>

      <div className="toolbar-section">
        <button className="toolbar-btn" disabled={!hasDocument} title="Rotate Left">
          <i className="fas fa-undo-alt"></i>
        </button>
        <button className="toolbar-btn" disabled={!hasDocument} title="Rotate Right">
          <i className="fas fa-redo-alt"></i>
        </button>
      </div>

      <div className="toolbar-section right-section">
        <button className="toolbar-btn" disabled={!hasDocument} title="Search">
          <i className="fas fa-search"></i>
        </button>
        <button className="toolbar-btn" disabled={!hasDocument} title="Bookmarks">
          <i className="fas fa-bookmark"></i>
        </button>
        <button className="toolbar-btn" disabled={!hasDocument} title="Comments">
          <i className="fas fa-comments"></i>
        </button>
        <button className="toolbar-btn" title="Settings">
          <i className="fas fa-cog"></i>
        </button>
      </div>
    </div>
  );
};

export default Toolbar;
