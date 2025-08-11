import React, { useEffect, useRef, useState, useCallback } from 'react';
import { PDFDocumentProxy } from 'pdfjs-dist/types/src/display/api';
import * as pdfjsLib from 'pdfjs-dist';
import './PDFViewer.css';

interface PDFViewerProps {
  pdf: PDFDocumentProxy;
  currentPage: number;
  zoom: number;
  rotation: number;
  currentTool: string;
  onPageChange: (page: number) => void;
  onAnnotationAdd: (annotation: any) => void;
  annotations: any[];
}

const PDFViewer: React.FC<PDFViewerProps> = ({
  pdf,
  currentPage,
  zoom,
  rotation,
  currentTool,
  onPageChange,
  onAnnotationAdd,
  annotations
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const textLayerRef = useRef<HTMLDivElement>(null);
  const annotationLayerRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [currentAnnotation, setCurrentAnnotation] = useState<any>(null);
  const [pageRendering, setPageRendering] = useState(false);
  const pageRenderingQueue = useRef<number | null>(null);

  // Render PDF page
  const renderPage = useCallback(async (pageNum: number) => {
    if (!pdf || !canvasRef.current) return;
    
    setPageRendering(true);
    
    try {
      const page = await pdf.getPage(pageNum);
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      if (!context) return;
      
      // Calculate scale based on zoom
      const scale = zoom / 100;
      const viewport = page.getViewport({ scale, rotation });
      
      // Set canvas dimensions
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      
      // Render PDF page into canvas context
      const renderContext = {
        canvasContext: context,
        viewport: viewport
      };
      
      const renderTask = page.render(renderContext);
      await renderTask.promise;
      
      // Render text layer
      if (textLayerRef.current) {
        textLayerRef.current.innerHTML = '';
        const textContent = await page.getTextContent();
        
        pdfjsLib.renderTextLayer({
          textContentSource: textContent,
          container: textLayerRef.current,
          viewport,
          textDivs: []
        });
      }
      
      setPageRendering(false);
      
      // Check if there's a page in queue
      if (pageRenderingQueue.current !== null) {
        const queuedPage = pageRenderingQueue.current;
        pageRenderingQueue.current = null;
        renderPage(queuedPage);
      }
    } catch (error) {
      console.error('Error rendering page:', error);
      setPageRendering(false);
    }
  }, [pdf, zoom, rotation]);

  // Queue page rendering
  const queueRenderPage = useCallback((pageNum: number) => {
    if (pageRendering) {
      pageRenderingQueue.current = pageNum;
    } else {
      renderPage(pageNum);
    }
  }, [pageRendering, renderPage]);

  useEffect(() => {
    queueRenderPage(currentPage);
  }, [currentPage, zoom, rotation, queueRenderPage]);

  // Handle mouse events for annotations
  const handleMouseDown = (e: React.MouseEvent) => {
    if (currentTool === 'select') return;
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setIsDrawing(true);
    setStartPos({ x, y });
    
    if (currentTool === 'text') {
      const text = prompt('Enter text:');
      if (text) {
        onAnnotationAdd({
          type: 'text',
          text,
          x,
          y,
          pageIndex: currentPage - 1,
          fontSize: 12
        });
      }
    } else if (currentTool === 'note') {
      const note = prompt('Enter note:');
      if (note) {
        onAnnotationAdd({
          type: 'note',
          text: note,
          x,
          y,
          pageIndex: currentPage - 1
        });
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDrawing) return;
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;
    
    if (currentTool === 'highlight') {
      setCurrentAnnotation({
        type: 'highlight',
        x: Math.min(startPos.x, currentX),
        y: Math.min(startPos.y, currentY),
        width: Math.abs(currentX - startPos.x),
        height: Math.abs(currentY - startPos.y)
      });
    } else if (currentTool === 'draw') {
      // Drawing logic for freehand
      // This would need more complex implementation for smooth drawing
    } else if (currentTool === 'shapes') {
      setCurrentAnnotation({
        type: 'rectangle',
        x: Math.min(startPos.x, currentX),
        y: Math.min(startPos.y, currentY),
        width: Math.abs(currentX - startPos.x),
        height: Math.abs(currentY - startPos.y)
      });
    }
  };

  const handleMouseUp = (_e: React.MouseEvent) => {
    if (!isDrawing) return;
    
    setIsDrawing(false);
    
    if (currentAnnotation) {
      onAnnotationAdd({
        ...currentAnnotation,
        pageIndex: currentPage - 1
      });
      setCurrentAnnotation(null);
    }
  };

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        if (currentPage > 1) {
          onPageChange(currentPage - 1);
        }
      } else if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        if (currentPage < pdf.numPages) {
          onPageChange(currentPage + 1);
        }
      } else if (e.key === 'Home') {
        onPageChange(1);
      } else if (e.key === 'End') {
        onPageChange(pdf.numPages);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPage, pdf.numPages, onPageChange]);

  // Render annotations
  const renderAnnotations = () => {
    return annotations
      .filter(ann => ann.pageIndex === currentPage - 1)
      .map((ann, index) => {
        const style: React.CSSProperties = {
          position: 'absolute',
          left: ann.x,
          top: ann.y
        };
        
        switch (ann.type) {
          case 'highlight':
            return (
              <div
                key={index}
                className="annotation highlight"
                style={{
                  ...style,
                  width: ann.width,
                  height: ann.height,
                  backgroundColor: 'yellow',
                  opacity: 0.3
                }}
              />
            );
          case 'text':
            return (
              <div
                key={index}
                className="annotation text"
                style={{
                  ...style,
                  fontSize: ann.fontSize || 12
                }}
              >
                {ann.text}
              </div>
            );
          case 'note':
            return (
              <div
                key={index}
                className="annotation note"
                style={style}
                title={ann.text}
              >
                <i className="fas fa-sticky-note"></i>
              </div>
            );
          case 'rectangle':
            return (
              <div
                key={index}
                className="annotation shape"
                style={{
                  ...style,
                  width: ann.width,
                  height: ann.height,
                  border: '2px solid red'
                }}
              />
            );
          default:
            return null;
        }
      });
  };

  return (
    <div className="pdf-viewer" ref={containerRef} id="pdf-viewer">
      <div className="pdf-controls">
        <button
          className="btn-nav"
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          title="First Page"
        >
          <i className="fas fa-step-backward"></i>
        </button>
        <button
          className="btn-nav"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          title="Previous Page"
        >
          <i className="fas fa-chevron-left"></i>
        </button>
        <span className="page-info">
          <input
            type="number"
            value={currentPage}
            onChange={(e) => {
              const page = parseInt(e.target.value);
              if (page >= 1 && page <= pdf.numPages) {
                onPageChange(page);
              }
            }}
            min="1"
            max={pdf.numPages}
            className="page-input"
          />
          <span> / {pdf.numPages}</span>
        </span>
        <button
          className="btn-nav"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === pdf.numPages}
          title="Next Page"
        >
          <i className="fas fa-chevron-right"></i>
        </button>
        <button
          className="btn-nav"
          onClick={() => onPageChange(pdf.numPages)}
          disabled={currentPage === pdf.numPages}
          title="Last Page"
        >
          <i className="fas fa-step-forward"></i>
        </button>
      </div>
      
      <div className="pdf-content">
        <div className="pdf-page-container">
          <canvas
            ref={canvasRef}
            className="pdf-canvas"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
          />
          <div ref={textLayerRef} className="text-layer" />
          <div ref={annotationLayerRef} className="annotation-layer">
            {renderAnnotations()}
            {currentAnnotation && (
              <div
                className="annotation temporary"
                style={{
                  position: 'absolute',
                  left: currentAnnotation.x,
                  top: currentAnnotation.y,
                  width: currentAnnotation.width,
                  height: currentAnnotation.height,
                  backgroundColor: currentAnnotation.type === 'highlight' ? 'yellow' : 'transparent',
                  border: currentAnnotation.type === 'rectangle' ? '2px dashed blue' : 'none',
                  opacity: 0.5
                }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PDFViewer;
