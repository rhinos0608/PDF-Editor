import React, { useState, useRef } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import { PDFDocumentProxy } from 'pdfjs-dist/types/src/display/api';
import { BasicPDFService, BasicAnnotation } from './services/BasicPDFService';
import { DirectPDFTextEditor, EditableTextBox, PDFTextItem } from './services/DirectPDFTextEditor';
import './styles/App.css';
import 'react-toastify/dist/ReactToastify.css';

interface BasicAppState {
  pdfDocument: PDFDocumentProxy | null;
  currentPage: number;
  totalPages: number;
  zoom: number;
  fileName: string;
  annotations: BasicAnnotation[];
  isLoading: boolean;
  currentTool: string;
  // Professional features
  annotationHistory: BasicAnnotation[][];
  historyIndex: number;
  selectedAnnotation: BasicAnnotation | null;
  showTextDialog: boolean;
  textDialogText: string;
  // Direct PDF text editing
  editableTextBoxes: EditableTextBox[];
  selectedTextBox: EditableTextBox | null;
  isDragging: boolean;
  dragOffset: { x: number; y: number };
}

const BasicApp: React.FC = () => {
  const [state, setState] = useState<BasicAppState>({
    pdfDocument: null,
    currentPage: 1,
    totalPages: 0,
    zoom: 100,
    fileName: '',
    annotations: [],
    isLoading: false,
    currentTool: 'select',
    // Professional features
    annotationHistory: [[]],
    historyIndex: 0,
    selectedAnnotation: null,
    showTextDialog: false,
    textDialogText: '',
    // Direct PDF text editing
    editableTextBoxes: [],
    selectedTextBox: null,
    isDragging: false,
    dragOffset: { x: 0, y: 0 }
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const pdfService = useRef(new BasicPDFService());
  const directTextEditor = useRef(new DirectPDFTextEditor());
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Save annotations to history for undo/redo
  const saveToHistory = (annotations: BasicAnnotation[]) => {
    setState(prev => {
      const newHistory = prev.annotationHistory.slice(0, prev.historyIndex + 1);
      newHistory.push([...annotations]);
      return {
        ...prev,
        annotationHistory: newHistory.slice(-20), // Keep last 20 states
        historyIndex: Math.min(newHistory.length - 1, 19)
      };
    });
  };

  // Undo function
  const undo = () => {
    if (state.historyIndex > 0) {
      const previousAnnotations = state.annotationHistory[state.historyIndex - 1];
      setState(prev => ({
        ...prev,
        annotations: [...previousAnnotations],
        historyIndex: prev.historyIndex - 1
      }));
      renderPage(state.currentPage);
      toast.info('Undone');
    }
  };

  // Redo function
  const redo = () => {
    if (state.historyIndex < state.annotationHistory.length - 1) {
      const nextAnnotations = state.annotationHistory[state.historyIndex + 1];
      setState(prev => ({
        ...prev,
        annotations: [...nextAnnotations],
        historyIndex: prev.historyIndex + 1
      }));
      renderPage(state.currentPage);
      toast.info('Redone');
    }
  };

  const openPDF = async () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setState(prev => ({ ...prev, isLoading: true }));

      // Read file as array buffer
      const arrayBuffer = await file.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);

      // Load PDF with our working service
      const pdfDocument = await pdfService.current.loadPDF(bytes, file.name);

      // Also load with direct text editor for advanced text manipulation
      await directTextEditor.current.loadPDF(bytes);

      setState(prev => ({
        ...prev,
        pdfDocument,
        totalPages: pdfDocument.numPages,
        currentPage: 1,
        fileName: file.name,
        isLoading: false,
        annotations: [],
        editableTextBoxes: []
      }));

      // Render the first page
      renderPage(1, pdfDocument);
      
      toast.success('PDF loaded successfully!');
    } catch (error) {
      console.error('Failed to load PDF:', error);
      toast.error('Failed to load PDF');
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const renderPage = async (pageNumber: number, pdfDoc?: PDFDocumentProxy) => {
    const pdf = pdfDoc || state.pdfDocument;
    if (!pdf || !canvasRef.current) return;

    try {
      const page = await pdf.getPage(pageNumber);
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      if (!context) return;

      const viewport = page.getViewport({ scale: state.zoom / 100 });
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      canvas.style.width = `${viewport.width}px`;
      canvas.style.height = `${viewport.height}px`;

      await page.render({
        canvasContext: context,
        viewport
      }).promise;

      // Render annotations on top
      renderAnnotations(context, viewport);
    } catch (error) {
      console.error('Failed to render page:', error);
    }
  };

  const renderAnnotations = (context: CanvasRenderingContext2D, viewport: any) => {
    // Render basic annotations
    const pageAnnotations = state.annotations.filter(ann => ann.pageIndex === state.currentPage - 1);
    
    for (const annotation of pageAnnotations) {
      context.save();
      
      const color = annotation.color || { r: 1, g: 0, b: 0 };
      context.strokeStyle = `rgb(${color.r * 255}, ${color.g * 255}, ${color.b * 255})`;
      context.lineWidth = 2;

      switch (annotation.type) {
        case 'rectangle':
          context.strokeRect(annotation.x, annotation.y, annotation.width, annotation.height);
          break;
        case 'highlight':
          context.globalAlpha = 0.3;
          context.fillStyle = context.strokeStyle;
          context.fillRect(annotation.x, annotation.y, annotation.width, annotation.height);
          break;
        case 'text':
          context.fillStyle = context.strokeStyle;
          context.font = `${annotation.fontSize || 12}px Arial`;
          context.fillText(annotation.text || '', annotation.x, annotation.y);
          break;
      }
      
      context.restore();
    }

    // Render editable text boxes (direct PDF text editing)
    const pageTextBoxes = state.editableTextBoxes.filter(box => box.pageIndex === state.currentPage - 1);
    
    for (const textBox of pageTextBoxes) {
      context.save();
      
      const color = textBox.color || { r: 0, g: 0, b: 0 };
      context.fillStyle = `rgb(${color.r * 255}, ${color.g * 255}, ${color.b * 255})`;
      context.font = `${textBox.fontSize}px ${textBox.fontFamily}`;
      
      // Draw the text
      context.fillText(textBox.text, textBox.x, textBox.y + textBox.fontSize);
      
      // Draw selection border if selected
      if (state.selectedTextBox && state.selectedTextBox.id === textBox.id) {
        context.strokeStyle = '#007bff';
        context.lineWidth = 2;
        context.setLineDash([5, 5]);
        context.strokeRect(textBox.x - 2, textBox.y - 2, textBox.width + 4, textBox.height + 4);
        
        // Draw resize handles
        const handleSize = 6;
        context.fillStyle = '#007bff';
        context.fillRect(textBox.x + textBox.width - handleSize/2, textBox.y + textBox.height - handleSize/2, handleSize, handleSize);
      }
      
      context.restore();
    }
  };

  const savePDF = async () => {
    try {
      if (!state.pdfDocument) {
        toast.warning('No PDF to save');
        return;
      }

      setState(prev => ({ ...prev, isLoading: true }));

      // Save PDF with annotations and editable text boxes
      let savedBytes: Uint8Array;
      
      if (state.editableTextBoxes.length > 0) {
        try {
          // Use direct text editor for real PDF text editing
          savedBytes = await directTextEditor.current.savePDFWithTextEdits();
          toast.success(`Saved with ${state.editableTextBoxes.length} text edits!`);
        } catch (editError) {
          console.error('❌ Error saving with text edits:', editError);
          toast.error('Failed to save text edits. Saving without modifications.');
          // Fallback to original PDF
          savedBytes = state.currentPDFBytes || new Uint8Array();
          if (savedBytes.length === 0) {
            throw new Error('No PDF data available for fallback save');
          }
        }
      } else {
        try {
          // Use basic service for simple annotations
          savedBytes = await pdfService.current.savePDFWithAnnotations(state.annotations);
        } catch (annotError) {
          console.error('❌ Error saving with annotations:', annotError);
          toast.error('Failed to save annotations. Saving original PDF.');
          // Fallback to original PDF
          savedBytes = state.currentPDFBytes || new Uint8Array();
          if (savedBytes.length === 0) {
            throw new Error('No PDF data available for fallback save');
          }
        }
      }

      // Download the file
      const blob = new Blob([savedBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = state.fileName || 'document.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setState(prev => ({ ...prev, isLoading: false }));
      toast.success('PDF saved successfully!');
    } catch (error) {
      console.error('Failed to save PDF:', error);
      toast.error('Failed to save PDF');
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const addAnnotation = (x: number, y: number) => {
    if (!state.pdfDocument) return;

    if (state.currentTool === 'text') {
      // Show text dialog for text annotations
      setState(prev => ({
        ...prev,
        showTextDialog: true,
        textDialogText: '',
        selectedAnnotation: {
          id: Date.now().toString(),
          type: 'text',
          x,
          y,
          width: 100,
          height: 20,
          pageIndex: state.currentPage - 1,
          color: { r: 0, g: 0, b: 1 },
          text: '',
          fontSize: 14
        } as BasicAnnotation
      }));
      return;
    }

    const annotation: BasicAnnotation = {
      id: Date.now().toString(),
      type: state.currentTool as any,
      x,
      y,
      width: state.currentTool === 'text' ? 100 : 60,
      height: state.currentTool === 'text' ? 20 : 40,
      pageIndex: state.currentPage - 1,
      color: { r: 0, g: 0, b: 1 },
      text: state.currentTool === 'text' ? 'Sample Text' : undefined,
      fontSize: 14
    };

    const newAnnotations = [...state.annotations, annotation];
    
    setState(prev => ({
      ...prev,
      annotations: newAnnotations
    }));

    // Save to history
    saveToHistory(newAnnotations);

    // Re-render the page with the new annotation
    renderPage(state.currentPage);
    toast.success(`${state.currentTool} annotation added!`);
  };

  // Add text annotation with custom text
  const addTextAnnotation = (text: string) => {
    if (!state.selectedAnnotation) return;

    const annotation: BasicAnnotation = {
      ...state.selectedAnnotation,
      text: text || 'Text'
    };

    const newAnnotations = [...state.annotations, annotation];
    
    setState(prev => ({
      ...prev,
      annotations: newAnnotations,
      showTextDialog: false,
      selectedAnnotation: null,
      textDialogText: ''
    }));

    // Save to history
    saveToHistory(newAnnotations);

    // Re-render the page with the new annotation
    renderPage(state.currentPage);
    toast.success('Text annotation added!');
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Handle text editor tool - creates editable text boxes
    if (state.currentTool === 'textEditor') {
      addEditableTextBox(x, y);
      return;
    }

    // Handle selection tool - select existing text boxes
    if (state.currentTool === 'select') {
      const clickedTextBox = getTextBoxAt(x, y);
      if (clickedTextBox) {
        selectTextBox(clickedTextBox);
        return;
      }
      // Clear selection if clicking on empty area
      setState(prev => ({ ...prev, selectedTextBox: null }));
      return;
    }

    // Handle other annotation tools
    addAnnotation(x, y);
  };

  // Add editable text box (real PDF text editing)
  const addEditableTextBox = (x: number, y: number) => {
    const id = `textbox_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const textBox: EditableTextBox = {
      id,
      text: 'Edit me',
      x,
      y,
      width: 100,
      height: 20,
      fontSize: 14,
      fontFamily: 'Helvetica',
      pageIndex: state.currentPage - 1,
      color: { r: 0, g: 0, b: 0 },
      isMoving: false,
      isResizing: false,
      isDirty: true
    };

    setState(prev => ({
      ...prev,
      editableTextBoxes: [...prev.editableTextBoxes, textBox],
      selectedTextBox: textBox
    }));

    directTextEditor.current.addEditableTextBox(x, y, state.currentPage - 1, 'Edit me');
    renderPage(state.currentPage);
    toast.success('Editable text box added!');
  };

  // Get text box at coordinates
  const getTextBoxAt = (x: number, y: number): EditableTextBox | null => {
    const pageBoxes = state.editableTextBoxes.filter(box => box.pageIndex === state.currentPage - 1);
    
    for (const box of pageBoxes) {
      if (x >= box.x && x <= box.x + box.width &&
          y >= box.y && y <= box.y + box.height) {
        return box;
      }
    }
    
    return null;
  };

  // Select text box
  const selectTextBox = (textBox: EditableTextBox) => {
    setState(prev => ({ ...prev, selectedTextBox: textBox }));
    toast.info(`Selected: "${textBox.text}"`);
  };

  // Get appropriate cursor based on current tool and state
  const getCursor = (): string => {
    if (state.isDragging) return 'grabbing';
    if (state.currentTool === 'select' && state.selectedTextBox) return 'grab';
    if (state.currentTool === 'textEditor') return 'text';
    if (state.currentTool === 'select') return 'default';
    return 'crosshair';
  };

  // Mouse event handlers for dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    if (state.currentTool !== 'select') return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const clickedTextBox = getTextBoxAt(x, y);
    if (clickedTextBox) {
      selectTextBox(clickedTextBox);
      setState(prev => ({
        ...prev,
        isDragging: true,
        dragOffset: {
          x: x - clickedTextBox.x,
          y: y - clickedTextBox.y
        }
      }));
      e.preventDefault();
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!state.isDragging || !state.selectedTextBox) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left - state.dragOffset.x;
    const y = e.clientY - rect.top - state.dragOffset.y;

    // Update text box position
    setState(prev => ({
      ...prev,
      editableTextBoxes: prev.editableTextBoxes.map(box =>
        box.id === state.selectedTextBox?.id 
          ? { ...box, x: Math.max(0, x), y: Math.max(0, y), isDirty: true }
          : box
      ),
      selectedTextBox: state.selectedTextBox 
        ? { ...state.selectedTextBox, x: Math.max(0, x), y: Math.max(0, y) }
        : null
    }));

    // Re-render the page
    renderPage(state.currentPage);
  };

  const handleMouseUp = () => {
    if (state.isDragging && state.selectedTextBox) {
      // Update the direct text editor with new position
      directTextEditor.current.updateTextBox(state.selectedTextBox.id, {
        x: state.selectedTextBox.x,
        y: state.selectedTextBox.y,
        isDirty: true
      });
    }

    setState(prev => ({
      ...prev,
      isDragging: false,
      dragOffset: { x: 0, y: 0 }
    }));
  };

  const changePage = (newPage: number) => {
    if (newPage >= 1 && newPage <= state.totalPages) {
      setState(prev => ({ ...prev, currentPage: newPage }));
      renderPage(newPage);
    }
  };

  const changeZoom = (newZoom: number) => {
    setState(prev => ({ ...prev, zoom: Math.max(25, Math.min(400, newZoom)) }));
    renderPage(state.currentPage);
  };

  return (
    <div className="adobe-app dark">
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf"
        className="hidden-input"
        onChange={handleFileInputChange}
      />

      {/* Header */}
      <div className="adobe-header">
        <div className="adobe-header-title">
          <h1>Professional PDF Editor</h1>
          {state.fileName && <span className="document-name">{state.fileName}</span>}
        </div>
        
        <div className="toolbar">
          {/* File Operations */}
          <div className="toolbar-section">
            <button className="toolbar-button" onClick={openPDF} title="Open PDF">
              <i className="fas fa-folder-open"></i>
            </button>
            <button 
              className="toolbar-button" 
              onClick={savePDF} 
              disabled={!state.pdfDocument}
              title="Save PDF"
            >
              <i className="fas fa-save"></i>
            </button>
          </div>
          
          {/* Edit Actions */}
          <div className="toolbar-section">
            <button 
              className="toolbar-button"
              onClick={undo}
              disabled={state.historyIndex <= 0}
              title="Undo"
            >
              <i className="fas fa-undo"></i>
            </button>
            <button 
              className="toolbar-button"
              onClick={redo}
              disabled={state.historyIndex >= state.annotationHistory.length - 1}
              title="Redo"
            >
              <i className="fas fa-redo"></i>
            </button>
          </div>

          {/* Annotation Tools */}
          <div className="toolbar-section">
            <button 
              className={`toolbar-button ${state.currentTool === 'select' ? 'active' : ''}`}
              onClick={() => setState(prev => ({ ...prev, currentTool: 'select' }))}
              title="Select Tool"
            >
              <i className="fas fa-mouse-pointer"></i>
            </button>
            <button 
              className={`toolbar-button ${state.currentTool === 'text' ? 'active' : ''}`}
              onClick={() => setState(prev => ({ ...prev, currentTool: 'text' }))}
              title="Add Text Annotation"
            >
              <i className="fas fa-font"></i>
            </button>
            <button 
              className={`toolbar-button ${state.currentTool === 'textEditor' ? 'active' : ''}`}
              onClick={() => setState(prev => ({ ...prev, currentTool: 'textEditor' }))}
              title="Add Editable Text (PDF Text Editing)"
            >
              <i className="fas fa-edit"></i>
            </button>
            <button 
              className={`toolbar-button ${state.currentTool === 'rectangle' ? 'active' : ''}`}
              onClick={() => setState(prev => ({ ...prev, currentTool: 'rectangle' }))}
              title="Draw Rectangle"
            >
              <i className="far fa-square"></i>
            </button>
            <button 
              className={`toolbar-button ${state.currentTool === 'highlight' ? 'active' : ''}`}
              onClick={() => setState(prev => ({ ...prev, currentTool: 'highlight' }))}
              title="Highlight Text"
            >
              <i className="fas fa-highlighter"></i>
            </button>
          </div>

          {/* Page Navigation */}
          <div className="toolbar-section">
            <button 
              className="toolbar-button"
              onClick={() => changePage(state.currentPage - 1)}
              disabled={state.currentPage <= 1}
              title="Previous Page"
            >
              <i className="fas fa-chevron-left"></i>
            </button>
            <span className="page-indicator">{state.currentPage} / {state.totalPages}</span>
            <button 
              className="toolbar-button"
              onClick={() => changePage(state.currentPage + 1)}
              disabled={state.currentPage >= state.totalPages}
              title="Next Page"
            >
              <i className="fas fa-chevron-right"></i>
            </button>
          </div>

          {/* Zoom Controls */}
          <div className="toolbar-section">
            <button 
              className="toolbar-button"
              onClick={() => changeZoom(state.zoom - 10)}
              title="Zoom Out"
            >
              <i className="fas fa-search-minus"></i>
            </button>
            <span className="zoom-display">{state.zoom}%</span>
            <button 
              className="toolbar-button"
              onClick={() => changeZoom(state.zoom + 10)}
              title="Zoom In"
            >
              <i className="fas fa-search-plus"></i>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="adobe-workspace">
        <div className="adobe-content">
          <div className="adobe-viewer-container">
            {state.pdfDocument ? (
              <canvas
                ref={canvasRef}
                onClick={handleCanvasClick}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                style={{
                  cursor: getCursor(),
                  border: '1px solid #444'
                }}
              />
            ) : (
              <div className="adobe-welcome">
                <div className="adobe-welcome-content">
                  <div className="welcome-icon">
                    <i className="fas fa-file-pdf"></i>
                  </div>
                  <h1 className="adobe-welcome-title">Professional PDF Editor</h1>
                  <p className="adobe-welcome-subtitle">Advanced PDF editing with professional-grade features</p>
                  
                  <div className="adobe-welcome-actions">
                    <button className="adobe-btn adobe-btn-primary" onClick={openPDF}>
                      <i className="fas fa-folder-open"></i>
                      Open PDF Document
                    </button>
                  </div>
                  
                  <div className="adobe-welcome-features">
                    <div className="adobe-feature">
                      <div className="feature-icon">
                        <i className="fas fa-edit"></i>
                      </div>
                      <h3>Smart Annotations</h3>
                      <p>Add text, shapes, and highlights with precision tools</p>
                    </div>
                    <div className="adobe-feature">
                      <div className="feature-icon">
                        <i className="fas fa-save"></i>
                      </div>
                      <h3>Reliable Saving</h3>
                      <p>Save your edits directly to PDF with full compatibility</p>
                    </div>
                    <div className="adobe-feature">
                      <div className="feature-icon">
                        <i className="fas fa-search"></i>
                      </div>
                      <h3>Advanced Viewing</h3>
                      <p>Navigate pages and zoom with professional controls</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="adobe-footer">
        <span>
          {state.fileName && `File: ${state.fileName}`}
          {state.annotations.length > 0 && ` | Annotations: ${state.annotations.length}`}
        </span>
      </div>

      {/* Loading Overlay */}
      {state.isLoading && (
        <div className="adobe-loading-overlay">
          <div className="adobe-spinner">
            <div className="adobe-spinner-blade"></div>
            <div className="adobe-spinner-blade"></div>
            <div className="adobe-spinner-blade"></div>
            <div className="adobe-spinner-blade"></div>
            <div className="adobe-spinner-blade"></div>
            <div className="adobe-spinner-blade"></div>
            <div className="adobe-spinner-blade"></div>
            <div className="adobe-spinner-blade"></div>
          </div>
          <p className="adobe-loading-text">Processing...</p>
        </div>
      )}

      <ToastContainer
        position="bottom-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />

      {/* Text Input Dialog */}
      {state.showTextDialog && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Add Text Annotation</h3>
              <button 
                className="modal-close"
                onClick={() => setState(prev => ({ 
                  ...prev, 
                  showTextDialog: false, 
                  selectedAnnotation: null 
                }))}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-body">
              <label>Enter text for annotation:</label>
              <textarea
                value={state.textDialogText}
                onChange={(e) => setState(prev => ({ ...prev, textDialogText: e.target.value }))}
                placeholder="Type your text here..."
                rows={3}
                autoFocus
              />
            </div>
            <div className="modal-footer">
              <button 
                className="btn btn-secondary"
                onClick={() => setState(prev => ({ 
                  ...prev, 
                  showTextDialog: false, 
                  selectedAnnotation: null 
                }))}
              >
                Cancel
              </button>
              <button 
                className="btn btn-primary"
                onClick={() => addTextAnnotation(state.textDialogText)}
                disabled={!state.textDialogText.trim()}
              >
                Add Text
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BasicApp;