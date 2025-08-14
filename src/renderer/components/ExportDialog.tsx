import React, { useState } from 'react';
import './ExportDialog.css';

interface ExportDialogProps {
  onExport: (format: string) => void;
  onCancel: () => void;
}

const ExportDialog: React.FC<ExportDialogProps> = ({ onExport, onCancel }) => {
  const [selectedFormat, setSelectedFormat] = useState('pdf');

  const formats = [
    { id: 'pdf', name: 'PDF Document', icon: 'fa-file-pdf', description: 'Export as PDF with all formatting' },
    { id: 'text', name: 'Plain Text', icon: 'fa-file-alt', description: 'Export text content only' },
    { id: 'word', name: 'Word Document', icon: 'fa-file-word', description: 'Export as Microsoft Word document' },
    { id: 'images', name: 'Image Files', icon: 'fa-file-image', description: 'Export pages as image files' }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onExport(selectedFormat);
  };

  return (
    <div className="export-dialog-overlay">
      <div className="export-dialog-panel">
        <div className="export-dialog-header">
          <h3>Export Document</h3>
          <button className="close-btn" onClick={onCancel}>×</button>
        </div>
        
        <form className="export-dialog-content" onSubmit={handleSubmit}>
          <div className="export-formats">
            <p className="export-instructions">Choose an export format:</p>
            
            {formats.map((format) => (
              <div 
                key={format.id}
                className={`export-format-option ${selectedFormat === format.id ? 'selected' : ''}`}
                onClick={() => setSelectedFormat(format.id)}
              >
                <div className="format-icon">
                  <i className={`fas ${format.icon}`}></i>
                </div>
                <div className="format-info">
                  <div className="format-name">{format.name}</div>
                  <div className="format-description">{format.description}</div>
                </div>
                <div className="format-radio">
                  <div className={`radio-indicator ${selectedFormat === format.id ? 'selected' : ''}`}></div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="export-actions">
            <button type="button" className="btn btn-secondary" onClick={onCancel}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Export
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ExportDialog;