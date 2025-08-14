import React, { memo } from 'react';
import './StatusBar.css';
import { ZoomIn, ZoomOut, RefreshCw } from 'lucide-react';

interface StatusBarProps {
  currentPage: number;
  totalPages: number;
  zoom: number;
  hasChanges: boolean;
  fileName: string;
  onPageChange?: (page: number) => void;
  onZoomChange?: (zoom: number) => void;
  isLoading?: boolean;
  processStatus?: string;
}

const StatusBar: React.FC<StatusBarProps> = ({
  currentPage,
  totalPages,
  zoom,
  hasChanges,
  fileName,
  onPageChange,
  onZoomChange,
  isLoading = false,
  processStatus = 'Ready'
}) => {
  const [pageInput, setPageInput] = React.useState(currentPage.toString());
  const [isEditingPage, setIsEditingPage] = React.useState(false);

  React.useEffect(() => {
    setPageInput(currentPage.toString());
  }, [currentPage]);

  const handlePageSubmit = () => {
    const newPage = parseInt(pageInput);
    if (newPage >= 1 && newPage <= totalPages && onPageChange) {
      onPageChange(newPage);
    } else {
      setPageInput(currentPage.toString()); // Reset if invalid
    }
    setIsEditingPage(false);
  };

  const handleZoomClick = () => {
    // Cycle through common zoom levels
    const zoomLevels = [50, 75, 100, 125, 150, 200];
    const currentIndex = zoomLevels.findIndex(z => z >= zoom);
    const nextZoom = zoomLevels[(currentIndex + 1) % zoomLevels.length] || zoomLevels[0];
    if (onZoomChange) {
      onZoomChange(nextZoom);
    }
  };
  return (
    <div className="status-bar">
      <div className="status-section">
        <span className="status-item">
          <i className="fas fa-file-pdf"></i> {fileName || 'No file open'}
          {hasChanges && <span className="unsaved-indicator">*</span>}
        </span>
      </div>
      <div className="status-section">
        <span className="status-item clickable-status">
          {isEditingPage ? (
            <input
              type="number"
              value={pageInput}
              onChange={(e) => setPageInput(e.target.value)}
              onBlur={handlePageSubmit}
              onKeyPress={(e) => e.key === 'Enter' && handlePageSubmit()}
              className="page-input"
              min="1"
              max={totalPages}
              autoFocus
            />
          ) : (
            <span 
              onClick={() => totalPages > 1 && setIsEditingPage(true)}
              title={totalPages > 1 ? "Click to jump to page" : ""}
              style={{ cursor: totalPages > 1 ? 'pointer' : 'default' }}
            >
              Page {currentPage} of {totalPages}
            </span>
          )}
        </span>
        <span className="status-separator">|</span>
        <span 
          className="status-item clickable-status"
          onClick={handleZoomClick}
          title="Click to cycle zoom levels"
          style={{ cursor: 'pointer' }}
        >
          <i className="fas fa-search-plus"></i> {zoom}%
        </span>
        <span className="status-separator">|</span>
        <span className="status-item">
          {isLoading ? (
            <><i className="fas fa-spinner fa-spin"></i> Processing...</>
          ) : (
            <><i className="fas fa-check-circle status-ready"></i> {processStatus}</>
          )}
        </span>
      </div>
      <div className="status-section">
        <button 
          aria-label="Zoom Out"
          className="icon-button"
          onClick={() => onZoomChange && onZoomChange(zoom - 10)}
        >
          <ZoomOut />
        </button>
        <button 
          aria-label="Zoom In"
          className="icon-button"
          onClick={() => onZoomChange && onZoomChange(zoom + 10)}
        >
          <ZoomIn />
        </button>
        <button 
          aria-label="Reset Zoom"
          className="icon-button"
          onClick={() => onZoomChange && onZoomChange(100)}
        >
          <RefreshCw />
        </button>
      </div>
    </div>
  );
};

export default memo(StatusBar);
