import React from 'react';
import './StatusBar.css';

interface StatusBarProps {
  currentPage: number;
  totalPages: number;
  zoom: number;
  hasChanges: boolean;
  fileName: string;
}

const StatusBar: React.FC<StatusBarProps> = ({
  currentPage,
  totalPages,
  zoom,
  hasChanges,
  fileName
}) => {
  return (
    <div className="status-bar">
      <div className="status-section">
        <span className="status-item">
          <i className="fas fa-file-pdf"></i> {fileName || 'No file open'}
          {hasChanges && <span className="unsaved-indicator">*</span>}
        </span>
      </div>
      <div className="status-section">
        <span className="status-item">
          Page {currentPage} of {totalPages}
        </span>
        <span className="status-separator">|</span>
        <span className="status-item">
          Zoom: {zoom}%
        </span>
        <span className="status-separator">|</span>
        <span className="status-item">
          <i className="fas fa-check-circle status-ready"></i> Ready
        </span>
      </div>
    </div>
  );
};

export default StatusBar;
