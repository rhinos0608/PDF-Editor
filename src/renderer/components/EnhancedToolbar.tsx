import React, { useState, memo, useCallback } from 'react';
import { 
  MousePointer, 
  Hand, 
  Edit3, 
  MessageSquare, 
  Highlighter, 
  Pen, 
  Square, 
  Circle, 
  ArrowRight, 
  Minus, 
  Type, 
  CheckSquare, 
  Circle as RadioButton, 
  ChevronDown, 
  ChevronLeft,
  ChevronRight,
  FileSignature, 
  Eye, 
  Droplets, 
  BarChart, 
  PieChart, 
  Workflow,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Undo,
  Redo,
  FolderOpen,
  Save,
  Printer,
  Lock,
  Merge,
  ScanText,
  Archive,
  Split,
  MoreHorizontal,
  Edit
} from 'lucide-react';
import './EnhancedToolbar.css';

interface ToolbarProps {
  currentTool: string;
  onToolChange: (tool: string) => void;
  zoom: number;
  onZoomChange: (zoom: number) => void;
  onOpenFile: () => void;
  onSaveFile: () => void;
  onPrint: () => void;
  hasDocument: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onToolOptionChange: (tool: string, options: any) => void;
  // Page navigation
  currentPage?: number;
  totalPages?: number;
  onPreviousPage?: () => void;
  onNextPage?: () => void;
  // Professional features
  onEncryptPDF?: () => void;
  onMergePDFs?: () => void;
  onPerformOCR?: () => void;
  onCompressPDF?: () => void;
  onSplitPDF?: () => void;
}

interface ToolGroup {
  name: string;
  tools: Tool[];
  icon: string;
}

interface Tool {
  id: string;
  name: string;
  icon: string;
  tooltip: string;
  shortcut?: string;
}

const EnhancedToolbar: React.FC<ToolbarProps> = ({
  currentTool,
  onToolChange,
  zoom,
  onZoomChange,
  onOpenFile,
  onSaveFile,
  onPrint,
  hasDocument,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
  onToolOptionChange,
  // Page navigation
  currentPage = 1,
  totalPages = 0,
  onPreviousPage,
  onNextPage,
  // Professional features
  onEncryptPDF,
  onMergePDFs,
  onPerformOCR,
  onCompressPDF,
  onSplitPDF
}) => {
  const [activeGroup, setActiveGroup] = useState<string>('select');
  const [penThickness, setPenThickness] = useState<number>(2); // State for pen thickness
  const [selectedColor, setSelectedColor] = useState<string>('#ff0000'); // State for selected color
  const [highlightOpacity, setHighlightOpacity] = useState<number>(0.3); // State for highlight opacity

  const LucideIcons: { [key: string]: React.ElementType } = {
    MousePointer,
    Hand,
    Edit3,
    MessageSquare,
    Highlighter,
    Pen,
    Square,
    Circle,
    ArrowRight,
    Minus,
    Type,
    CheckSquare,
    RadioButton,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    FileSignature,
    Eye,
    Droplets,
    BarChart,
    PieChart,
    Workflow,
    ZoomIn,
    ZoomOut,
    RotateCw,
    Undo,
    Redo,
    FolderOpen,
    Save,
    Printer,
    Lock,
    Merge,
    ScanText,
    Archive,
    Split
  };

  const toolGroups: ToolGroup[] = [
    {
      name: 'Selection',
      icon: 'MousePointer',
      tools: [
        { id: 'select', name: 'Select', icon: 'MousePointer', tooltip: 'Select and move text/objects', shortcut: 'V' },
        { id: 'pan', name: 'Pan', icon: 'Hand', tooltip: 'Pan around document', shortcut: 'H' }
      ]
    },
    {
      name: 'Edit',
      icon: 'Edit3',
      tools: [
        { id: 'edit', name: 'Edit Text', icon: 'Edit3', tooltip: 'Edit text content', shortcut: 'T' },
        { id: 'add-text', name: 'Add Text', icon: 'MessageSquare', tooltip: 'Add new text', shortcut: 'Shift+T' }
      ]
    },
    {
      name: 'Annotate',
      icon: 'Highlighter',
      tools: [
        { id: 'highlight', name: 'Highlight', icon: 'Highlighter', tooltip: 'Highlight text', shortcut: 'H' },
        { id: 'pen', name: 'Pen', icon: 'Pen', tooltip: 'Draw freehand', shortcut: 'P' },
        { id: 'rectangle', name: 'Rectangle', icon: 'Square', tooltip: 'Draw rectangle', shortcut: 'R' },
        { id: 'circle', name: 'Circle', icon: 'Circle', tooltip: 'Draw circle', shortcut: 'C' },
        { id: 'arrow', name: 'Arrow', icon: 'ArrowRight', tooltip: 'Draw arrow', shortcut: 'A' },
        { id: 'line', name: 'Line', icon: 'Minus', tooltip: 'Draw line', shortcut: 'L' }
      ]
    },
    {
      name: 'Forms',
      icon: 'CheckSquare',
      tools: [
        { id: 'form-builder', name: 'Form Builder', icon: 'Edit3', tooltip: 'Advanced form builder' },
        { id: 'text-field', name: 'Text Field', icon: 'Type', tooltip: 'Add text field' },
        { id: 'checkbox', name: 'Checkbox', icon: 'CheckSquare', tooltip: 'Add checkbox' },
        { id: 'radio', name: 'Radio Button', icon: 'RadioButton', tooltip: 'Add radio button' },
        { id: 'dropdown', name: 'Dropdown', icon: 'ChevronDown', tooltip: 'Add dropdown' },
        { id: 'signature', name: 'Signature', icon: 'FileSignature', tooltip: 'Add signature field' }
      ]
    },
    {
      name: 'Redact',
      icon: 'Eye',
      tools: [
        { id: 'redact', name: 'Redact', icon: 'Eye', tooltip: 'Redact sensitive content', shortcut: 'Shift+R' },
        { id: 'watermark', name: 'Watermark', icon: 'Droplets', tooltip: 'Add watermark' }
      ]
    },
    {
      name: 'Analytics',
      icon: 'BarChart',
      tools: [
        { id: 'analytics', name: 'Analytics', icon: 'PieChart', tooltip: 'Document analytics and insights' },
        { id: 'workflow', name: 'Workflow', icon: 'Workflow', tooltip: 'Document workflow management' }
      ]
    }
  ];

  const handleToolSelect = (toolId: string) => {
    onToolChange(toolId);
    
    // Find which group this tool belongs to
    const group = toolGroups.find(g => g.tools.some(t => t.id === toolId));
    if (group) {
      setActiveGroup(group.name);
    }
  };

  const getZoomOptions = () => [25, 50, 75, 100, 125, 150, 200, 300, 400];

  const handleZoomChange = (newZoom: number) => {
    onZoomChange(Math.max(25, Math.min(400, newZoom)));
  };

  const formatZoom = (zoom: number) => `${Math.round(zoom)}%`;

  const renderIcon = (iconName: string, size: number = 16) => {
    const IconComponent = LucideIcons[iconName];
    if (IconComponent) {
      return <IconComponent size={size} className='icon' />;
    }
    return <Square size={size} className='icon' />; // Fallback
  };

  return (
    <div className="enhanced-toolbar">
      {/* File Operations */}
      <div className="toolbar-section file-operations">
        <button 
          className="toolbar-btn primary"
          onClick={onOpenFile}
          title="Open PDF file (Ctrl+O)"
        >
          <FolderOpen size={16} />
          <span>Open</span>
        </button>
        
        <button 
          className="toolbar-btn"
          onClick={onSaveFile}
          disabled={!hasDocument}
          title="Save document (Ctrl+S)"
        >
          <Save size={16} aria-label="Save"/>
          <span>Save</span>
        </button>
        
        <button 
          className="toolbar-btn"
          onClick={onPrint}
          disabled={!hasDocument}
          title="Print document (Ctrl+P)"
        >
          <Printer size={16} />
          <span>Print</span>
        </button>
      </div>

      <div className="toolbar-divider"></div>

      {/* Undo/Redo */}
      <div className="toolbar-section history">
        <button 
          className="toolbar-btn icon-only"
          onClick={onUndo}
          disabled={!canUndo}
          title="Undo (Ctrl+Z)"
        >
          <Undo size={16} aria-label="Undo"/>
        </button>
        
        <button 
          className="toolbar-btn icon-only"
          onClick={onRedo}
          disabled={!canRedo}
          title="Redo (Ctrl+Y)"
        >
          <Redo size={16} aria-label="Redo"/>
        </button>
      </div>

      <div className="toolbar-divider"></div>

      {/* Page Navigation */}
      {hasDocument && totalPages > 1 && (
        <>
          <div className="toolbar-section page-navigation">
            <button 
              className="toolbar-btn icon-only"
              onClick={onPreviousPage}
              disabled={currentPage <= 1}
              title="Previous Page (Page Up)"
            >
              <ChevronLeft size={16} />
            </button>
            
            <div className="page-info">
              <span className="page-display">{currentPage} / {totalPages}</span>
            </div>
            
            <button 
              className="toolbar-btn icon-only"
              onClick={onNextPage}
              disabled={currentPage >= totalPages}
              title="Next Page (Page Down)"
            >
              <ChevronRight size={16} />
            </button>
          </div>
          
          <div className="toolbar-divider"></div>
        </>
      )}

      {/* Professional Features */}
      <div className="toolbar-section professional-features">
        <button 
          className="toolbar-btn"
          onClick={onEncryptPDF}
          disabled={!hasDocument}
          title="Encrypt PDF with password protection"
        >
          <Lock size={16} />
          <span>Encrypt</span>
        </button>
        
        <button 
          className="toolbar-btn"
          onClick={onMergePDFs}
          disabled={!hasDocument}
          title="Merge multiple PDFs into one"
        >
          <Merge size={16} />
          <span>Merge</span>
        </button>
        
        <button 
          className="toolbar-btn"
          onClick={onPerformOCR}
          disabled={!hasDocument}
          title="Extract text with OCR"
        >
          <ScanText size={16} />
          <span>OCR</span>
        </button>
        
        <button 
          className="toolbar-btn"
          onClick={onCompressPDF}
          disabled={!hasDocument}
          title="Compress PDF file size"
        >
          <Archive size={16} />
          <span>Compress</span>
        </button>
        
        <button 
          className="toolbar-btn"
          onClick={onSplitPDF}
          disabled={!hasDocument}
          title="Split PDF into multiple files"
        >
          <Split size={16} />
          <span>Split</span>
        </button>
      </div>

      <div className="toolbar-divider"></div>

      {/* Zoom Controls */}
      <div className="toolbar-section zoom-controls">
        <button 
          className="toolbar-btn icon-only"
          onClick={() => handleZoomChange(zoom - 25)}
          disabled={zoom <= 25}
          title="Zoom out"
        >
          <ZoomOut size={16} />
        </button>
        
        <select 
          className="zoom-select"
          value={zoom}
          onChange={(e) => handleZoomChange(parseInt(e.target.value))}
          title="Zoom level"
        >
          {getZoomOptions().map(zoomLevel => (
            <option key={zoomLevel} value={zoomLevel}>
              {formatZoom(zoomLevel)}
            </option>
          ))}
        </select>
        
        <button 
          className="toolbar-btn icon-only"
          onClick={() => handleZoomChange(zoom + 25)}
          disabled={zoom >= 400}
          title="Zoom in"
        >
          <ZoomIn size={16} />
        </button>
        
        <button 
          className="toolbar-btn icon-only"
          onClick={() => onZoomChange(100)}
          title="Fit to width"
        >
          <RotateCw size={16} />
        </button>
      </div>

      <div className="toolbar-divider"></div>

      {/* Tool Groups */}
      <div className="toolbar-section tool-groups">
        {toolGroups.map(group => (
          <div key={group.name} className="tool-group">
            <div className="tool-group-header">
              <span className="group-icon">{renderIcon(group.icon, 16)}</span>
              <span className="group-name">{group.name}</span>
            </div>
            
            <div className="tool-group-tools">
              {group.tools.map(tool => (
                <button
                  key={tool.id}
                  className={`tool-btn ${currentTool === tool.id ? 'active' : ''}`}
                  onClick={() => handleToolSelect(tool.id)}
                  disabled={!hasDocument && tool.id !== 'select'}
                  title={`${tool.tooltip}${tool.shortcut ? ` (${tool.shortcut})` : ''}`}
                >
                  {renderIcon(tool.icon, 16)}
                  <span className="tool-name">{tool.name}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Tool Options */}
      <div className="toolbar-section tool-options">
        {/* Pen Options */}
        {currentTool === 'pen' && (
          <div className="pen-options">
            <label>
              Thickness:
              <input 
                type="range" 
                min="1" 
                max="10" 
                value={penThickness} 
                onChange={(e) => {
                  const newThickness = parseInt(e.target.value);
                  setPenThickness(newThickness);
                  onToolOptionChange('pen', { thickness: newThickness });
                }}
                className="thickness-slider"
              />
            </label>
            <div className="color-options">
              <label>Color:</label>
              <div className="color-palette">
                {['var(--primary)', 'var(--success)', 'var(--info)', 'var(--warning)', 'var(--danger)', 'var(--info)', 'var(--text-primary)'].map(color => (
                  <button
                    key={color}
                    className={`color-btn ${selectedColor === color ? 'active' : ''}`}
                    style={{ backgroundColor: color }}
                    onClick={() => {
                      setSelectedColor(color);
                      onToolOptionChange('pen', { color });
                    }}
                    title={`Use ${color}`}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Highlight Options */}
        {currentTool === 'highlight' && (
          <div className="highlight-options">
            <div className="color-options">
              <label>Color:</label>
              <div className="color-palette">
                {['var(--primary)', 'var(--success)', 'var(--info)', 'var(--warning)', 'var(--danger)', 'var(--info)', 'var(--text-primary)'].map(color => (
                  <button
                    key={color}
                    className={`color-btn ${selectedColor === color ? 'active' : ''}`}
                    style={{ backgroundColor: color }}
                    onClick={() => {
                      setSelectedColor(color);
                      onToolOptionChange('highlight', { color });
                    }}
                    title={`Use ${color}`}
                  />
                ))}
              </div>
            </div>
            <label>
              Opacity:
              <input
                type="range"
                min="0.1"
                max="1"
                step="0.1"
                value={highlightOpacity}
                onChange={(e) => {
                  const newOpacity = parseFloat(e.target.value);
                  setHighlightOpacity(newOpacity);
                  onToolOptionChange('highlight', { opacity: newOpacity });
                }}
                className="opacity-slider"
              />
            </label>
          </div>
        )}

        {/* Rectangle Options */}
        {currentTool === 'rectangle' && (
          <div className="rectangle-options">
            <div className="color-options">
              <label>Color:</label>
              <div className="color-palette">
                {['var(--primary)', 'var(--success)', 'var(--info)', 'var(--warning)', 'var(--danger)', 'var(--info)', 'var(--text-primary)'].map(color => (
                  <button
                    key={color}
                    className={`color-btn ${selectedColor === color ? 'active' : ''}`}
                    style={{ backgroundColor: color }}
                    onClick={() => {
                      setSelectedColor(color);
                      onToolOptionChange('rectangle', { color });
                    }}
                    title={`Use ${color}`}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Status Indicators */}
      <div className="toolbar-section status">
        {!hasDocument && (
          <div className="status-indicator">
            <span className="status-text">No document loaded</span>
          </div>
        )}
        
        {hasDocument && (
          <div className="status-indicator">
            <span className="current-tool-indicator">
              {toolGroups
                .flatMap(g => g.tools)
                .find(t => t.id === currentTool)?.icon} 
              {currentTool}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default memo(EnhancedToolbar);