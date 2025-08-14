import React, { useEffect, useRef, useState, useCallback, memo } from 'react';
import { PDFDocumentProxy } from 'pdfjs-dist/types/src/display/api';
import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import './EnhancedPDFViewer.css';
import { PDFTextEditorService, EditableTextRegion, TextEdit, TextAddition } from '../services/PDFTextEditorService';
import { SearchResult } from '../services/SearchService';

interface PDFViewerProps {
  pdf: PDFDocumentProxy;
  pdfBytes: Uint8Array; // Add pdfBytes prop
  currentPage: number;
  zoom: number;
  rotation: number;
  currentTool: string;
  onPageChange: (page: number) => void;
  onAnnotationAdd: (annotation: any) => void;
  annotations: any[];
  showInputDialog: (title: string, placeholder: string, onConfirm: (value: string) => void) => void;
  isEditMode?: boolean;
  onPDFUpdate?: (newPdfBytes: Uint8Array) => void;
  searchResults?: SearchResult[];
  currentSearchIndex?: number;
  searchText?: string;
}

// Use EditableTextRegion from service as the TextRegion interface
interface TextRegion extends EditableTextRegion {
  isEditing: boolean; // Add isEditing for UI state
}

interface Annotation {
  id: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  pageIndex: number;
  color: { r: number; g: number; b: number };
  text?: string;
  thickness?: number;
}

const pdfTextEditorService = new PDFTextEditorService(); // Instantiate the service

const EnhancedPDFViewer: React.FC<PDFViewerProps> = ({
  pdf,
  pdfBytes, // Destructure pdfBytes
  currentPage,
  zoom,
  rotation,
  currentTool,
  onPageChange,
  searchResults = [],
  currentSearchIndex = -1,
  searchText = '',
  onAnnotationAdd,
  annotations,
  showInputDialog,
  isEditMode = false,
  onPDFUpdate
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const textLayerRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [viewport, setViewport] = useState<any>(null);
  const [currentPDFPage, setCurrentPDFPage] = useState<any>(null);
  const [textRegions, setTextRegions] = useState<TextRegion[]>([]);
  const [selectedText, setSelectedText] = useState<TextRegion | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentAnnotation, setCurrentAnnotation] = useState<Annotation | null>(null);
  const [renderingState, setRenderingState] = useState<'idle' | 'rendering' | 'error'>('idle');
  const renderingPromiseRef = useRef<Promise<void> | null>(null);
  const currentRenderIdRef = useRef<number>(0);
  const currentRenderTaskRef = useRef<any>(null);

  // Emergency Recovery pattern for PDF rendering with proper concurrency control
  const renderPageWithRecovery = useCallback(async (pageNum: number) => {
    // Generate unique render ID for this operation
    const renderId = ++currentRenderIdRef.current;
    
    // Cancel any existing render task to avoid conflicts
    if (currentRenderTaskRef.current) {
      try {
        currentRenderTaskRef.current.cancel();
        console.log('✅ Previous render task cancelled');
      } catch (error) {
        console.log('Previous render task already completed or cancelled');
      }
      currentRenderTaskRef.current = null;
    }

    // If another render is in progress, wait for it to complete
    if (renderingPromiseRef.current) {
      console.log('⚠️ Waiting for previous render to complete...');
      try {
        await renderingPromiseRef.current;
      } catch (error) {
        console.warn('Previous render failed, continuing with new render');
      }
    }
    
    // Check if this render is still the latest requested
    if (renderId !== currentRenderIdRef.current) {
      console.log('⚠️ Render superseded by newer request, skipping');
      return;
    }
    
    // Prevent concurrent rendering
    if (renderingState === 'rendering') {
      console.log('⚠️ Rendering state conflict, skipping');
      return;
    }

    const strategies = [
      // Strategy 1: Full rendering with all features
      async () => await renderPageStrategy1(pageNum, renderId),
      // Strategy 2: Basic rendering without text layer
      async () => await renderPageStrategy2(pageNum, renderId),
      // Strategy 3: Emergency canvas-only rendering
      async () => await renderPageStrategy3(pageNum, renderId)
    ];

    setRenderingState('rendering');
    
    // Create and store the rendering promise
    const renderingPromise = (async () => {
      try {
        for (const [index, strategy] of strategies.entries()) {
          // Check if this render is still valid before each strategy
          if (renderId !== currentRenderIdRef.current) {
            console.log('⚠️ Render cancelled during strategy execution');
            return;
          }
          
          try {
            await strategy();
            console.log(`✅ PDF rendering successful with strategy ${index + 1}`);
            return;
          } catch (error) {
            console.warn(`⚠️ PDF rendering strategy ${index + 1} failed:`, error.message);
            if (index === strategies.length - 1) {
              console.error('❌ All PDF rendering strategies failed');
              throw error;
            }
          }
        }
      } finally {
        // Clean up only if this is still the current render
        if (renderId === currentRenderIdRef.current) {
          setRenderingState('idle');
          renderingPromiseRef.current = null;
          currentRenderTaskRef.current = null;
        }
      }
    })();
    
    renderingPromiseRef.current = renderingPromise;
    
    try {
      await renderingPromise;
    } catch (error) {
      if (renderId === currentRenderIdRef.current) {
        setRenderingState('error');
      }
    }
  }, []);

  // Strategy 1: Full rendering with text extraction
  const renderPageStrategy1 = async (pageNum: number, renderId: number) => {
    if (!pdf || !canvasRef.current || !textLayerRef.current) {
      throw new Error('Missing required elements');
    }

    // Check cancellation before expensive operations
    if (renderId !== currentRenderIdRef.current) {
      throw new Error('Render cancelled');
    }

    const page = await pdf.getPage(pageNum);
    setCurrentPDFPage(page);
    
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    const textLayer = textLayerRef.current;
    
    if (!context) throw new Error('Canvas context not available');

    // Check cancellation before DOM operations
    if (renderId !== currentRenderIdRef.current) {
      throw new Error('Render cancelled');
    }

    // Calculate viewport
    const scale = zoom / 100;
    const pageViewport = page.getViewport({ scale, rotation });
    setViewport(pageViewport);

    // Configure canvas
    canvas.width = pageViewport.width;
    canvas.height = pageViewport.height;
    canvas.style.width = `${pageViewport.width}px`;
    canvas.style.height = `${pageViewport.height}px`;

    // Clear previous content
    context.clearRect(0, 0, canvas.width, canvas.height);
    textLayer.innerHTML = '';

    // Check cancellation before render
    if (renderId !== currentRenderIdRef.current) {
      throw new Error('Render cancelled');
    }

    // Safer PDF.js rendering with better error handling
    const renderContext = {
      canvasContext: context,
      viewport: pageViewport
    };

    try {
      currentRenderTaskRef.current = page.render(renderContext);
      
      // Store render task for potential cancellation
      const timeoutId = setTimeout(() => {
        if (currentRenderTaskRef.current?.cancel) {
          currentRenderTaskRef.current.cancel();
        }
      }, 30000); // 30 second timeout

      await currentRenderTaskRef.current.promise;
      currentRenderTaskRef.current = null;
      clearTimeout(timeoutId);
    } catch (error) {
      currentRenderTaskRef.current = null;
      // Enhanced error handling for multiple render conflicts
      if (error.message?.includes('multiple render') || error.message?.includes('render')) {
        console.warn('⚠️ Canvas render conflict detected, implementing recovery...');
        
        // Wait for any existing operations to complete
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Check if we should still continue
        if (renderId !== currentRenderIdRef.current) {
          throw new Error('Render cancelled during recovery');
        }
        
        // Retry with a fresh context
        const freshRenderContext = {
          canvasContext: context,
          viewport: pageViewport
        };
        
        currentRenderTaskRef.current = page.render(freshRenderContext);
        await currentRenderTaskRef.current.promise;
        currentRenderTaskRef.current = null;
      } else {
        throw error;
      }
    }

    // Extract and render text layer
    const textContent = await page.getTextContent();
    
    // Set the required CSS scale factor variable
    textLayer.style.setProperty('--scale-factor', scale.toString());
    if (containerRef.current) {
      containerRef.current.style.setProperty('--scale-factor', scale.toString());
    }
    
    // Strategy 1: Try using the TextLayer API if available
    try {
      // Use the TextLayer class from pdfjs-dist
      if (pdfjsLib.TextLayer) {
        const textLayerInstance = new pdfjsLib.TextLayer({
          textContentSource: textContent,
          container: textLayer,
          viewport: pageViewport
        });
        await textLayerInstance.render();
        console.log('✅ PDF rendering successful with TextLayer API');
      } else {
        // Fallback to manual text rendering
        throw new Error('TextLayer API not available');
      }
    } catch (textError) {
      console.warn('⚠️ PDF TextLayer rendering failed:', textError);
      
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

    // Extract editable text regions using the service (with validation)
    let extractedRegions: any[] = [];
    if (pdfBytes && pdfBytes.byteLength > 0) {
      try {
        extractedRegions = await pdfTextEditorService.extractEditableText(pdfBytes);
      } catch (error) {
        console.warn('⚠️ Text extraction failed, continuing without text regions:', error);
        extractedRegions = [];
      }
    } else {
      console.warn('⚠️ No valid PDF bytes available for text extraction');
    }
    
    // Filter regions for the current page and add isEditing state
    const currentPageRegions: TextRegion[] = extractedRegions
      .filter(region => region.pageIndex === currentPage - 1)
      .map(region => ({ ...region, isEditing: false }));
    setTextRegions(currentPageRegions);

    // Render annotations
    renderAnnotations();
  };

  // Strategy 2: Basic rendering without text layer
  const renderPageStrategy2 = async (pageNum: number, renderId: number) => {
    if (!pdf || !canvasRef.current) {
      throw new Error('Missing required elements');
    }

    // Check cancellation
    if (renderId !== currentRenderIdRef.current) {
      throw new Error('Render cancelled');
    }

    const page = await pdf.getPage(pageNum);
    setCurrentPDFPage(page);
    
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    
    if (!context) throw new Error('Canvas context not available');

    // Check cancellation before DOM operations
    if (renderId !== currentRenderIdRef.current) {
      throw new Error('Render cancelled');
    }

    const scale = zoom / 100;
    const pageViewport = page.getViewport({ scale, rotation });
    setViewport(pageViewport);

    canvas.width = pageViewport.width;
    canvas.height = pageViewport.height;
    canvas.style.width = `${pageViewport.width}px`;
    canvas.style.height = `${pageViewport.height}px`;

    context.clearRect(0, 0, canvas.width, canvas.height);

    // Check cancellation before render
    if (renderId !== currentRenderIdRef.current) {
      throw new Error('Render cancelled');
    }

    await page.render({
      canvasContext: context,
      viewport: pageViewport
    }).promise;

    // Check cancellation before annotations
    if (renderId !== currentRenderIdRef.current) {
      throw new Error('Render cancelled');
    }

    renderAnnotations();
  };

  // Strategy 3: Emergency rendering (minimal)
  const renderPageStrategy3 = async (pageNum: number, renderId: number) => {
    if (!pdf || !canvasRef.current) {
      throw new Error('Missing required elements');
    }

    // Check cancellation
    if (renderId !== currentRenderIdRef.current) {
      throw new Error('Render cancelled');
    }

    const page = await pdf.getPage(pageNum);
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    
    if (!context) throw new Error('Canvas context not available');

    console.warn('🚨 Using emergency PDF rendering mode');

    // Check cancellation before DOM operations
    if (renderId !== currentRenderIdRef.current) {
      throw new Error('Render cancelled');
    }

    // Minimal rendering
    const scale = Math.min(zoom / 100, 1); // Limit scale in emergency mode
    const pageViewport = page.getViewport({ scale });
    setViewport(pageViewport);

    canvas.width = pageViewport.width;
    canvas.height = pageViewport.height;
    canvas.style.width = `${pageViewport.width}px`;
    canvas.style.height = `${pageViewport.height}px`;

    context.clearRect(0, 0, canvas.width, canvas.height);

    // Check cancellation before render
    if (renderId !== currentRenderIdRef.current) {
      throw new Error('Render cancelled');
    }

    // Basic page rendering with minimal options
    await page.render({
      canvasContext: context,
      viewport: pageViewport,
      intent: 'display'
    }).promise;

    // Check cancellation before UI updates
    if (renderId !== currentRenderIdRef.current) {
      throw new Error('Render cancelled');
    }

    // Show emergency mode indicator
    context.fillStyle = 'rgba(255, 165, 0, 0.1)';
    context.fillRect(0, 0, canvas.width, 30);
    context.fillStyle = '#ff6600';
    context.font = '12px Arial';
    context.fillText('⚠️ Emergency Rendering Mode', 10, 20);
  };

  // Render annotations on the canvas
  const renderAnnotations = () => {
    if (!canvasRef.current || !viewport) return;

    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    if (!context) return;

    // Render all annotations for current page
    const pageAnnotations = annotations.filter(ann => ann.pageIndex === currentPage - 1);
    
    for (const annotation of pageAnnotations) {
      renderSingleAnnotation(context, annotation);
    }

    // Render search highlights
    if (searchResults && searchResults.length > 0) {
      renderSearchHighlights(context);
    }

    // Always render text regions if they exist (more visible in edit mode)
    if (textRegions.length > 0) {
      renderTextRegions(context);
    }
    
    // Add edit mode helper text if no regions are found and in edit mode
    if (isEditMode && textRegions.length === 0) {
      context.save();
      context.fillStyle = 'rgba(255, 165, 0, 0.8)';
      context.font = '16px Arial';
      context.fillText('📝 Loading editable text regions...', 20, 40);
      context.restore();
    }
  };
  
  // Render search highlights
  const renderSearchHighlights = async (context: CanvasRenderingContext2D) => {
    if (!currentPDFPage || !searchResults || searchResults.length === 0 || !searchText) return;
    
    try {
      // Get text content for the current page
      const textContent = await currentPDFPage.getTextContent();
      const pageResults = searchResults.filter(result => result.page === currentPage);
      
      if (pageResults.length === 0) return;
      
      context.save();
      
      // Find text items that match search results
      for (const result of pageResults) {
        const searchPattern = new RegExp(searchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
        
        for (let i = 0; i < textContent.items.length; i++) {
          const item = textContent.items[i] as any;
          if (!item.str || !item.transform) continue;
          
          const matches = [...item.str.matchAll(searchPattern)];
          
          for (const match of matches) {
            if (match.index === undefined) continue;
            
            // Calculate text dimensions and position
            const fontSize = Math.abs(item.transform[3]);
            const x = item.transform[4];
            const y = item.transform[5];
            
            // Estimate character width (rough approximation)
            const charWidth = fontSize * 0.6;
            const highlightX = x + (match.index * charWidth);
            const highlightWidth = match[0].length * charWidth;
            const highlightHeight = fontSize;
            
            // Convert PDF coordinates to canvas coordinates
            const canvasY = viewport!.height - y - highlightHeight;
            
            // Determine highlight color based on whether this is the current result
            const isCurrentResult = pageResults.indexOf(result) === currentSearchIndex;
            const highlightColor = isCurrentResult 
              ? 'rgba(255, 165, 0, 0.6)' // Orange for current result
              : 'rgba(255, 255, 0, 0.4)'; // Yellow for other results
            
            // Draw highlight background
            context.fillStyle = highlightColor;
            context.fillRect(highlightX, canvasY, highlightWidth, highlightHeight);
            
            // Draw border for current result
            if (isCurrentResult) {
              context.strokeStyle = 'rgba(255, 165, 0, 0.8)';
              context.lineWidth = 2;
              context.strokeRect(highlightX, canvasY, highlightWidth, highlightHeight);
            }
          }
        }
      }
      
      context.restore();
      
      // Show search result info
      if (pageResults.length > 0) {
        context.save();
        context.fillStyle = 'rgba(0, 0, 0, 0.8)';
        context.fillRect(10, 10, 200, 30);
        context.fillStyle = 'white';
        context.font = '12px Arial';
        const resultText = `${pageResults.length} result(s) on this page`;
        context.fillText(resultText, 15, 30);
        context.restore();
      }
      
    } catch (error) {
      console.warn('Error rendering search highlights:', error);
    }
  };

  // Render a single annotation
  const renderSingleAnnotation = (context: CanvasRenderingContext2D, annotation: any) => {
    context.save();
    
    const color = annotation.color || { r: 1, g: 0, b: 0 };
    context.strokeStyle = `rgb(${color.r * 255}, ${color.g * 255}, ${color.b * 255})`;
    context.lineWidth = annotation.thickness || 2;

    switch (annotation.type) {
      case 'rectangle':
        context.strokeRect(annotation.x, annotation.y, annotation.width, annotation.height);
        break;
      case 'circle':
        // Calculate radius with validation to prevent negative values
        const radius = Math.abs(Math.min(annotation.width, annotation.height)) / 2;
        if (radius > 0) {
          context.beginPath();
          context.arc(
            annotation.x + annotation.width / 2,
            annotation.y + annotation.height / 2,
            radius,
            0,
            2 * Math.PI
          );
          context.stroke();
        }
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
  };

  // Render editable text regions
  const renderTextRegions = (context: CanvasRenderingContext2D) => {
    context.save();
    
    for (const region of textRegions) {
      if (region.isEditing) {
        // Highlight editing region
        context.strokeStyle = '#0080ff';
        context.lineWidth = 2;
        context.strokeRect(region.x - 2, region.y - 2, region.width + 4, region.height + 4);
      } else if (isEditMode) {
        // Show editable regions with more visible outline in edit mode
        context.strokeStyle = 'rgba(0, 128, 255, 0.6)';
        context.lineWidth = 1;
        context.setLineDash([3, 3]); // Dashed line for better visibility
        context.strokeRect(region.x, region.y, region.width, region.height);
        context.setLineDash([]); // Reset line dash
        
        // Add subtle background highlight to make text regions more obvious
        context.fillStyle = 'rgba(0, 128, 255, 0.05)';
        context.fillRect(region.x, region.y, region.width, region.height);
      }
    }
    
    context.restore();
  };

  // Handle mouse interactions
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!viewport || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);

    switch (currentTool) {
      case 'select':
        handleTextSelection(x, y);
        break;
      case 'edit':
        handleTextEdit(x, y);
        break;
      case 'rectangle':
      case 'circle':
      case 'highlight':
        startAnnotation(x, y);
        break;
      case 'text':
        addTextAnnotation(x, y);
        break;
    }
  };

  // Handle text selection
  const handleTextSelection = (x: number, y: number) => {
    const clickedRegion = textRegions.find(region => 
      x >= region.x && x <= region.x + region.width &&
      y >= region.y && y <= region.y + region.height
    );

    if (clickedRegion) {
      setSelectedText(clickedRegion);
      console.log('📝 Selected text:', clickedRegion.originalText); // Use originalText
    } else {
      setSelectedText(null);
    }
  };

  // Handle text editing
  const handleTextEdit = (x: number, y: number) => {
    const clickedRegion = textRegions.find(region => 
      x >= region.x && x <= region.x + region.width &&
      y >= region.y && y <= region.y + region.height
    );

    if (clickedRegion) {
      // Start editing this text region
      setTextRegions(prev => prev.map(region => ({
        ...region,
        isEditing: region.id === clickedRegion.id
      })));
      
      // Show input dialog for editing
      showInputDialog(
        'Edit Text',
        clickedRegion.originalText, // Use originalText
        (newText: string) => {
          updateTextRegion(clickedRegion, newText); // Pass the whole region
        }
      );
    } else {
      // Add new text at clicked location
      addNewTextRegion(x, y);
    }
  };

  // Update existing text region
  const updateTextRegion = async (region: TextRegion, newText: string) => {
    setTextRegions(prev => prev.map(r => 
      r.id === region.id 
        ? { ...r, originalText: newText, isEditing: false } // Update originalText
        : { ...r, isEditing: false }
    ));

    try {
      const newPdfBytes = await pdfTextEditorService.replaceTextInPDF(pdfBytes, [{ region, newText }]);
      if (onPDFUpdate) {
        onPDFUpdate(newPdfBytes);
      }
      console.log(`📝 Text updated and PDF modified: ${newText}`);
    } catch (error) {
      console.error('❌ Failed to update text in PDF:', error);
      // Revert UI state if PDF update fails
      setTextRegions(prev => prev.map(r => 
        r.id === region.id 
          ? { ...r, originalText: region.originalText, isEditing: false } 
          : r
      ));
    }
  };

  // Add new text region
  const addNewTextRegion = async (x: number, y: number) => {
    showInputDialog(
      'Add Text',
      '',
      async (text: string) => {
        if (text.trim()) {
          const newAddition: TextAddition = {
            text: text.trim(),
            pageIndex: currentPage - 1,
            x,
            y,
            fontSize: 12, // Default font size
            fontName: 'Helvetica' // Default font
          };
          
          try {
            const newPdfBytes = await pdfTextEditorService.addTextToPDF(pdfBytes, [newAddition]);
            if (onPDFUpdate) {
              onPDFUpdate(newPdfBytes);
            }
            console.log(`📝 New text added and PDF modified: ${text}`);
          } catch (error) {
            console.error('❌ Failed to add new text to PDF:', error);
          }
        }
      }
    );
  };

  // Start annotation creation
  const startAnnotation = (x: number, y: number) => {
    setIsDrawing(true);
    setCurrentAnnotation({
      id: `annotation_${Date.now()}`,
      type: currentTool,
      x,
      y,
      width: 0,
      height: 0,
      pageIndex: currentPage - 1,
      color: { r: 1, g: 0, b: 0 },
      thickness: 2
    });
  };

  // Add text annotation
  const addTextAnnotation = (x: number, y: number) => {
    showInputDialog(
      'Add Text Annotation',
      '',
      (text: string) => {
        if (text.trim()) {
          const annotation = {
            id: `annotation_${Date.now()}`,
            type: 'text',
            x,
            y,
            width: text.length * 8,
            height: 16,
            pageIndex: currentPage - 1,
            text: text.trim(),
            color: { r: 1, g: 0, b: 0 },
            fontSize: 12
          };
          
          onAnnotationAdd(annotation);
        }
      }
    );
  };

  // Handle mouse move for annotations
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDrawing || !currentAnnotation || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);

    const updatedAnnotation = {
      ...currentAnnotation,
      width: x - currentAnnotation.x,
      height: y - currentAnnotation.y
    };

    setCurrentAnnotation(updatedAnnotation);
    
    // Re-render annotations only (avoid full page re-render during drawing)
    renderAnnotations();
  };

  // Handle mouse up for annotations
  const handleMouseUp = () => {
    if (isDrawing && currentAnnotation) {
      // Only add annotation if it has meaningful size
      if (Math.abs(currentAnnotation.width) > 5 || Math.abs(currentAnnotation.height) > 5) {
        onAnnotationAdd(currentAnnotation);
      }
    }
    
    setIsDrawing(false);
    setCurrentAnnotation(null);
  };

  // Effect to render page when dependencies change (fixed infinite re-render)
  useEffect(() => {
    if (pdf) {
      renderPageWithRecovery(currentPage);
    }
  }, [pdf, currentPage, zoom, rotation]); // Removed renderPageWithRecovery from dependencies

  // Effect to re-render annotations when they change (debounced)
  useEffect(() => {
    if (viewport && renderingState === 'idle') {
      // Debounce annotation rendering to prevent excessive calls
      const timeoutId = setTimeout(() => {
        renderAnnotations();
      }, 100);
      
      return () => clearTimeout(timeoutId);
    }
  }, [annotations, isEditMode, textRegions, viewport, renderingState, searchResults, currentSearchIndex, searchText]);
  
  // Cleanup effect for component unmount
  useEffect(() => {
    return () => {
      // Cancel any pending renders when component unmounts
      currentRenderIdRef.current = -1;
      renderingPromiseRef.current = null;
      if (currentRenderTaskRef.current) {
        try {
          currentRenderTaskRef.current.cancel();
        } catch (error) {
          console.log('Cleanup: render task already completed');
        }
        currentRenderTaskRef.current = null;
      }
    };
  }, []);

  return (
    <div 
      ref={containerRef}
      className="enhanced-pdf-viewer"
      style={{ 
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'auto',
        backgroundColor: '#f5f5f5'
      }}
    >
      {/* Render state indicator */}
      {renderingState === 'rendering' && (
        <div className="rendering-indicator">
          <div className="spinner"></div>
          <span>Rendering PDF...</span>
        </div>
      )}
      
      {renderingState === 'error' && (
        <div className="error-indicator">
          <span>⚠️ PDF rendering failed. Some features may be limited.</span>
        </div>
      )}

      {/* PDF Canvas */}
      <canvas
        ref={canvasRef}
        className="pdf-canvas"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        style={{ 
          display: 'block',
          margin: '20px auto',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          cursor: currentTool === 'select' ? 'text' : 'crosshair'
        }}
      />

      {/* Text Layer for selection */}
      <div
        ref={textLayerRef}
        className="text-layer"
        style={{
          position: 'absolute',
          left: '20px',
          top: '20px',
          pointerEvents: isEditMode ? 'auto' : 'none',
          userSelect: currentTool === 'select' ? 'text' : 'none'
        }}
      />

      {/* Edit Mode Overlay */}
      {isEditMode && (
        <div className="edit-mode-overlay">
          <div className="edit-mode-hint">
            ✏️ Click on text to edit, or click empty area to add new text
          </div>
        </div>
      )}

      {/* Selected text info */}
      {selectedText && (
        <div className="selected-text-info">
          <strong>Selected:</strong> {selectedText.originalText}
        </div>
      )}
    </div>
  );
};

export default memo(EnhancedPDFViewer);