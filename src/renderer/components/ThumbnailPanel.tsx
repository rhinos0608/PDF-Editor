import React, { useEffect, useRef, useState, memo, useCallback } from 'react';
import { PDFDocumentProxy } from 'pdfjs-dist/types/src/display/api';
import './ThumbnailPanel.css';

interface ThumbnailPanelProps {
  pdf: PDFDocumentProxy;
  currentPage: number;
  onPageSelect: (page: number) => void;
  isSidebarExpanded: boolean; // New prop
}

const ThumbnailPanel: React.FC<ThumbnailPanelProps> = ({
  pdf,
  currentPage,
  onPageSelect,
  isSidebarExpanded // Destructure new prop
}) => {
  const [thumbnails, setThumbnails] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const generateThumbnails = async () => {
      const thumbs: string[] = [];
      
      for (let i = 1; i <= Math.min(pdf.numPages, 50); i++) { // Limit to 50 for performance
        const page = await pdf.getPage(i);
        const scale = 0.5; // Better scale for visibility
        const viewport = page.getViewport({ scale });
        
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        
        if (context) {
          await page.render({
            canvasContext: context,
            viewport: viewport
          }).promise;
          
          thumbs.push(canvas.toDataURL());
        }
      }
      
      setThumbnails(thumbs);
    };
    
    generateThumbnails();
  }, [pdf]);

  useEffect(() => {
    // Scroll to current page thumbnail
    if (containerRef.current) {
      const currentThumb = containerRef.current.querySelector(`.thumbnail.active`);
      if (currentThumb) {
        currentThumb.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [currentPage]);

  return (
    <div className="thumbnail-panel" ref={containerRef}>
      <div className="thumbnail-header">
        <h3>Pages</h3>
      </div>
      <div className={`thumbnails-container ${isSidebarExpanded ? 'compact' : ''}`}>
        {thumbnails.map((thumb, index) => (
          <div
            key={index}
            className={`thumbnail ${currentPage === index + 1 ? 'active' : ''}`}
            onClick={() => onPageSelect(index + 1)}
          >
            <div className="thumbnail-number">{index + 1}</div>
            <img src={thumb} alt={`Page ${index + 1}`} />
          </div>
        ))}
        {pdf.numPages > 50 && (
          <div className="thumbnail-note">
            Showing first 50 pages of {pdf.numPages}
          </div>
        )}
      </div>
    </div>
  );
};

export default memo(ThumbnailPanel);
