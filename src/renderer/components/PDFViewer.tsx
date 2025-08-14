import React, { useEffect, useRef, useState, useCallback } from 'react';
import { PDFDocumentProxy } from 'pdfjs-dist/types/src/display/api';
import * as pdfjsLib from 'pdfjs-dist';
import EditableTextLayer from './EditableTextLayer';
import { RealPDFTextEditor } from '../services/RealPDFTextEditor';
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
  showInputDialog: (title: string, placeholder: string, onConfirm: (value: string) => void) => void;
  isEditMode?: boolean;
  onTextEdit?: (oldText: string, newText: string, coordinates: any) => void;
  extractedText?: any[];
  onPDFUpdate?: (newPdfBytes: Uint8Array) => void;
}

const PDFViewer: React.FC<PDFViewerProps> = ({
  pdf,
  currentPage,
  zoom,
  rotation,
  currentTool,
  onPageChange,
  onAnnotationAdd,
  annotations,
  showInputDialog,
  isEditMode = false,
  onTextEdit,
  extractedText = [],
  onPDFUpdate
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const textLayerRef = useRef<HTMLDivElement>(null);
  const viewerContainerRef = useRef<HTMLDivElement>(null);
  const pageContainerRef = useRef<HTMLDivElement>(null);
  
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [currentAnnotation, setCurrentAnnotation] = useState<any>(null);
  const [pageRendering, setPageRendering] = useState(false);
  const [viewport, setViewport] = useState<any>(null);
  const [currentPDFPage, setCurrentPDFPage] = useState<any>(null);
  const [editingText, setEditingText] = useState<{
    x: number;
    y: number;
    text: string;
    id: string;
  } | null>(null);
  const realTextEditor = useRef(new RealPDFTextEditor());
  const currentRenderTask = useRef<any>(null);

  // Render PDF page with proper scaling and positioning
  const renderPage = useCallback(async (pageNum: number) => {
    if (!pdf || !canvasRef.current || !textLayerRef.current) return;
    
    // Cancel any existing render task to avoid conflicts
    if (currentRenderTask.current) {
      try {
        currentRenderTask.current.cancel();
      } catch (error) {
        console.log('Previous render task already completed or cancelled');
      }
      currentRenderTask.current = null;
    }
    
    setPageRendering(true);
    
    try {
      const page = await pdf.getPage(pageNum);
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      const textLayer = textLayerRef.current;
      
      if (!context) return;
      
      // Calculate scale and viewport
      const scale = zoom / 100;
      const pageViewport = page.getViewport({ scale, rotation });
      setViewport(pageViewport);
      
      // Set canvas size and style
      canvas.width = pageViewport.width;
      canvas.height = pageViewport.height;
      canvas.style.width = `${pageViewport.width}px`;
      canvas.style.height = `${pageViewport.height}px`;
      
      // Clear previous content
      context.clearRect(0, 0, canvas.width, canvas.height);
      textLayer.innerHTML = '';
      
      // Set CSS variables for proper scaling
      const scaleFactorValue = scale.toString();
      textLayer.style.setProperty('--scale-factor', scaleFactorValue);
      if (viewerContainerRef.current) {
        viewerContainerRef.current.style.setProperty('--scale-factor', scaleFactorValue);
      }
      
      // Configure text layer
      textLayer.style.width = `${pageViewport.width}px`;
      textLayer.style.height = `${pageViewport.height}px`;
      textLayer.style.left = '0px';
      textLayer.style.top = '0px';
      
      // Update page container size
      if (pageContainerRef.current) {
        pageContainerRef.current.style.width = `${pageViewport.width}px`;
        pageContainerRef.current.style.height = `${pageViewport.height}px`;
      }
      
      // Render PDF content
      const renderContext = {
        canvasContext: context,
        viewport: pageViewport
      };
      
      currentRenderTask.current = page.render(renderContext);
      await currentRenderTask.current.promise;
      currentRenderTask.current = null;
      
      // Render text layer for text selection and search
      try {
        const textContent = await page.getTextContent();
        
        // Strategy 1: Try using the newer TextLayer.render API
        try {
          const textLayerTask = pdfjsLib.renderTextLayer({
            textContentSource: textContent,
            container: textLayer,
            viewport: pageViewport,
            textDivs: []
          });
          await textLayerTask.promise;
          console.log('✅ PDF rendering successful with strategy 1');
        } catch (textError) {
          console.warn('⚠️ PDF rendering strategy 1 failed:', textError);
          
          // Strategy 2: Fallback to manual text layer rendering
          textContent.items.forEach((item: any, index: number) => {
            const textDiv = document.createElement('div');
            textDiv.textContent = item.str;
            textDiv.style.position = 'absolute';
            textDiv.style.left = `${item.transform[4]}px`;
            textDiv.style.top = `${pageViewport.height - item.transform[5]}px`;
            textDiv.style.fontSize = `${item.transform[0]}px`;
            textDiv.style.fontFamily = item.fontName || 'sans-serif';
            textDiv.style.transform = `scale(${scale})`;
            textDiv.style.transformOrigin = 'left top';
            textDiv.style.whiteSpace = 'nowrap';
            textDiv.style.color = 'transparent';
            textDiv.style.userSelect = 'text';
            textDiv.setAttribute('data-text-index', index.toString());
            textLayer.appendChild(textDiv);
          });
          console.log('✅ PDF rendering successful with strategy 2');
        }
      } catch (textError) {
        console.warn('Text layer rendering failed completely:', textError);
      }
      
      setPageRendering(false);
    } catch (error) {
      console.error('Error rendering page:', error);
      currentRenderTask.current = null;
      setPageRendering(false);
    }
  }, [pdf, zoom, rotation]);

  // Cleanup render task on unmount
  useEffect(() => {
    return () => {
      if (currentRenderTask.current) {
        try {
          currentRenderTask.current.cancel();
        } catch (error) {
          console.log('Cleanup: render task already completed');
        }
      }
    };
  }, []);

  useEffect(() => {
    renderPage(currentPage);
  }, [currentPage, zoom, rotation, renderPage]);

  // Add direct event listeners to ensure events work
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleDirectClick = (e: MouseEvent) => {
      console.log('🎯 Direct canvas click detected!', { tool: currentTool, x: e.offsetX, y: e.offsetY });
    };

    canvas.addEventListener('click', handleDirectClick);
    return () => canvas.removeEventListener('click', handleDirectClick);
  }, [currentTool]);

  // Handle edit mode click - REAL PDF text editing
  const handleEditModeClick = async (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect || !onPDFUpdate) return;

    // Convert screen coordinates to PDF coordinates
    const x = (e.clientX - rect.left) / (zoom / 100);
    const y = (rect.height - (e.clientY - rect.top)) / (zoom / 100); // Flip Y for PDF coordinates
    
    console.log(`✏️ REAL Edit mode click at PDF coordinates (${x}, ${y})`);
    
    // Find existing text at this location
    const foundText = realTextEditor.current.findTextAtCoordinates(
      extractedText, 
      currentPage - 1, 
      x, 
      y, 
      20 // tolerance
    );
    
    if (foundText) {
      console.log(`📝 Found existing text to edit: "${foundText.text}"`);
      
      // Show edit dialog for existing text
      showInputDialog('Edit PDF Text', 'Edit the text (this will modify the actual PDF)', (newText) => {
        if (newText.trim() && newText !== foundText.text) {
          performRealTextEdit(foundText, newText);
        }
      });
    } else {
      console.log('➕ Adding new text to PDF at clicked location');
      
      // Add new text to PDF
      showInputDialog('Add Text to PDF', 'Enter text to add (this will modify the actual PDF)', (newText) => {
        if (newText.trim()) {
          addNewTextToPDF(x, y, newText);
        }
      });
    }
  };
  
  // Perform REAL text editing in the PDF
  const performRealTextEdit = async (originalText: any, newText: string) => {
    try {
      console.log('🔄 Performing REAL PDF text replacement...');
      
      if (!pdf) return;
      
      // Get current PDF bytes
      const currentPdfBytes = await pdf.getData();
      
      // Perform real text replacement
      const modifiedPdfBytes = await realTextEditor.current.replaceTextInPDF(
        new Uint8Array(currentPdfBytes),
        [{
          oldText: originalText.text,
          newText: newText,
          page: originalText.page,
          x: originalText.x,
          y: originalText.y,
          fontSize: originalText.fontSize
        }]
      );
      
      console.log('✅ PDF text replaced successfully! Updating viewer...');
      
      // Update the PDF in the app
      if (onPDFUpdate) {
        onPDFUpdate(modifiedPdfBytes);
      }
      
    } catch (error) {
      console.error('❌ Error performing real text edit:', error);
      alert('Failed to edit text in PDF: ' + error);
    }
  };
  
  // Add new text to the PDF
  const addNewTextToPDF = async (x: number, y: number, text: string) => {
    try {
      console.log('➕ Adding new text to PDF...');
      
      if (!pdf) return;
      
      // Get current PDF bytes
      const currentPdfBytes = await pdf.getData();
      
      // Add new text to PDF
      const modifiedPdfBytes = await realTextEditor.current.addTextToPDF(
        new Uint8Array(currentPdfBytes),
        [{
          text: text,
          page: currentPage - 1,
          x: x,
          y: y,
          fontSize: 14,
          color: { r: 0, g: 0, b: 0 }
        }]
      );
      
      console.log('✅ Text added to PDF successfully! Updating viewer...');
      
      // Update the PDF in the app
      if (onPDFUpdate) {
        onPDFUpdate(modifiedPdfBytes);
      }
      
    } catch (error) {
      console.error('❌ Error adding text to PDF:', error);
      alert('Failed to add text to PDF: ' + error);
    }
  };

  // Handle mouse events for annotations
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('🖱️ Mouse down event triggered - Current tool:', currentTool);
    
    if (currentTool === 'select') {
      console.log('📍 Select tool active, ignoring click');
      return;
    }
    
    if (currentTool === 'redact') {
      console.log('🚫 Redact tool active, handling redaction');
      // Redaction is handled by the RedactionTool component
      return;
    }
    
    if (currentTool === 'edit') {
      console.log('✏️ Edit tool active - checking for text to edit');
      handleEditModeClick(e);
      return;
    }
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) {
      console.error('❌ Canvas rect not available');
      return;
    }
    
    // Use direct screen coordinates for now (simpler approach)
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    console.log('📍 Mouse position:', { x, y, tool: currentTool, rectWidth: rect.width, rectHeight: rect.height });
    
    setIsDrawing(true);
    setStartPos({ x, y });
    
    if (currentTool === 'text') {
      console.log('📝 Text tool activated - showing input dialog');
      showInputDialog(
        'Add Text Annotation',
        'Enter your text...',
        (text) => {
          console.log('✅ Creating text annotation:', text);
          onAnnotationAdd({
            type: 'text',
            text,
            x,
            y,
            pageIndex: currentPage - 1,
            fontSize: 12,
            color: { r: 0, g: 0, b: 0 }
          });
        }
      );
    } else if (currentTool === 'note') {
      console.log('📄 Note tool activated - showing input dialog');
      showInputDialog(
        'Add Note',
        'Enter your note...',
        (note) => {
          console.log('✅ Creating note annotation:', note);
          onAnnotationAdd({
            type: 'note',
            text: note,
            x,
            y,
            pageIndex: currentPage - 1,
            color: { r: 1, g: 1, b: 0 }
          });
        }
      );
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDrawing || !viewport) return;
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    // Use direct screen coordinates for now (simpler approach)
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;
    
    if (currentTool === 'highlight') {
      setCurrentAnnotation({
        type: 'highlight',
        x: Math.min(startPos.x, currentX),
        y: Math.min(startPos.y, currentY),
        width: Math.abs(currentX - startPos.x),
        height: Math.abs(currentY - startPos.y),
        color: { r: 1, g: 1, b: 0 }
      });
    } else if (currentTool === 'draw') {
      // Drawing logic for freehand would be implemented here
    } else if (currentTool === 'shapes') {
      setCurrentAnnotation({
        type: 'rectangle',
        x: Math.min(startPos.x, currentX),
        y: Math.min(startPos.y, currentY),
        width: Math.abs(currentX - startPos.x),
        height: Math.abs(currentY - startPos.y),
        color: { r: 0, g: 0, b: 0 }
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
    console.log('Rendering annotations for page', currentPage - 1, ':', annotations);
    return annotations
      .filter(ann => ann.pageIndex === currentPage - 1)
      .map((ann, index) => {
        const style: React.CSSProperties = {
          position: 'absolute',
          left: ann.x,
          top: ann.y,
          zIndex: 10
        };
        
        switch (ann.type) {
          case 'highlight':
            return (
              <div
                key={ann.id || index}
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
                key={ann.id || index}
                className="annotation text"
                style={{
                  ...style,
                  fontSize: ann.fontSize || 12
                }}
              >
                {ann.text}
              </div>
            );
          case 'editable-text':
            return (
              <div
                key={ann.id || index}
                className="annotation editable-text"
                style={{
                  ...style,
                  fontSize: ann.fontSize || 16,
                  background: 'rgba(0, 0, 255, 0.1)',
                  border: '1px dashed #0066cc',
                  padding: '2px 4px',
                  cursor: 'pointer',
                  color: ann.color || '#000080'
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  console.log('✏️ Editing existing text:', ann.text);
                  showInputDialog('Edit Text', 'Edit the text', (newText) => {
                    if (newText.trim()) {
                      // Update the existing annotation
                      const updatedAnnotation = { ...ann, text: newText.trim() };
                      console.log('📝 Updating text annotation:', updatedAnnotation);
                      onAnnotationAdd(updatedAnnotation);
                    }
                  });
                }}
                title="Click to edit this text"
              >
                {ann.text}
              </div>
            );
          case 'note':
            return (
              <div
                key={ann.id || index}
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
                key={ann.id || index}
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
    <div className="pdf-viewer" ref={viewerContainerRef} data-tool={currentTool}>
      {/* Navigation Bar */}
      <div className="pdf-navigation">
        <div className="nav-controls">
          <button
            className="nav-btn"
            onClick={() => onPageChange(1)}
            disabled={currentPage === 1}
            title="First Page"
          >
            <i className="fas fa-angle-double-left"></i>
          </button>
          <button
            className="nav-btn"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            title="Previous Page"
          >
            <i className="fas fa-angle-left"></i>
          </button>
          <div className="page-info">
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
          </div>
          <button
            className="nav-btn"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === pdf.numPages}
            title="Next Page"
          >
            <i className="fas fa-angle-right"></i>
          </button>
          <button
            className="nav-btn"
            onClick={() => onPageChange(pdf.numPages)}
            disabled={currentPage === pdf.numPages}
            title="Last Page"
          >
            <i className="fas fa-angle-double-right"></i>
          </button>
        </div>
        
        {pageRendering && (
          <div className="loading-indicator">
            <i className="fas fa-spinner fa-spin"></i>
            Rendering...
          </div>
        )}
      </div>

      {/* PDF Content Area */}
      <div className="pdf-content-area">
        <div className="pdf-scroll-wrapper">
          <div className="pdf-page-wrapper" ref={pageContainerRef}>
            {/* Main PDF Canvas */}
            <canvas
              ref={canvasRef}
              className="pdf-canvas"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
            />
            
            {/* Text Selection Layer */}
            <div 
              ref={textLayerRef} 
              className="pdf-text-layer"
            />
            
            {/* Annotations Overlay */}
            <div className="pdf-annotations-overlay">
              {renderAnnotations()}
              
              {/* Current Drawing Preview */}
              {currentAnnotation && (
                <div
                  className="current-annotation"
                  style={{
                    position: 'absolute',
                    left: currentAnnotation.x,
                    top: currentAnnotation.y,
                    width: currentAnnotation.width,
                    height: currentAnnotation.height,
                    border: '2px dashed #007bff',
                    backgroundColor: currentAnnotation.type === 'highlight' 
                      ? 'rgba(255, 255, 0, 0.3)' 
                      : 'transparent',
                    pointerEvents: 'none',
                    zIndex: 1000
                  }}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PDFViewer;
