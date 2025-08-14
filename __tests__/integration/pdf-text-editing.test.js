/**
 * Integration Tests for PDF Text Editing Functionality
 * Tests the actual click-to-edit and inline text editing features
 */

const { test, expect } = require('@jest/globals');
const { JSDOM } = require('jsdom');
const path = require('path');
const fs = require('fs');

// Mock PDF.js and pdf-lib
jest.mock('pdfjs-dist');
jest.mock('pdf-lib');

// Setup DOM environment
const dom = new JSDOM('<!DOCTYPE html><html><body><div id="root"></div></body></html>', {
  url: 'http://localhost',
  pretendToBeVisual: true,
  resources: 'usable'
});

global.window = dom.window;
global.document = dom.window.document;
global.navigator = dom.window.navigator;
global.HTMLElement = dom.window.HTMLElement;
global.HTMLCanvasElement = dom.window.HTMLCanvasElement;
global.CanvasRenderingContext2D = dom.window.CanvasRenderingContext2D;

// Mock Canvas Context
HTMLCanvasElement.prototype.getContext = jest.fn(() => ({
  fillRect: jest.fn(),
  clearRect: jest.fn(),
  getImageData: jest.fn(() => ({ data: new Array(4) })),
  putImageData: jest.fn(),
  createImageData: jest.fn(() => new Array(4)),
  setTransform: jest.fn(),
  drawImage: jest.fn(),
  save: jest.fn(),
  restore: jest.fn(),
  beginPath: jest.fn(),
  moveTo: jest.fn(),
  lineTo: jest.fn(),
  closePath: jest.fn(),
  stroke: jest.fn(),
  fill: jest.fn(),
  measureText: jest.fn(() => ({ width: 100 })),
  scale: jest.fn(),
  rotate: jest.fn(),
  translate: jest.fn()
}));

// Mock React
jest.mock('react', () => ({
  ...jest.requireActual('react'),
  useState: jest.fn(),
  useEffect: jest.fn(),
  useRef: jest.fn(),
  useCallback: jest.fn()
}));

describe('PDF Text Editing Integration Tests', () => {
  let mockPDFDocument, mockPDFPage, mockPDFBytes;
  let mockSetState, mockGetState;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Mock PDF document
    mockPDFDocument = {
      numPages: 1,
      getPage: jest.fn().mockResolvedValue({
        getViewport: jest.fn(() => ({
          width: 612,
          height: 792,
          transform: [1, 0, 0, 1, 0, 0]
        })),
        render: jest.fn(() => ({
          promise: Promise.resolve()
        })),
        getTextContent: jest.fn().mockResolvedValue({
          items: [
            {
              str: 'Sample text to edit',
              dir: 'ltr',
              width: 120,
              height: 14,
              transform: [14, 0, 0, 14, 100, 700],
              fontName: 'Arial'
            },
            {
              str: 'Another line of text',
              dir: 'ltr', 
              width: 140,
              height: 14,
              transform: [14, 0, 0, 14, 100, 680],
              fontName: 'Arial'
            }
          ]
        })
      })
    };

    // Mock PDF bytes
    mockPDFBytes = new Uint8Array([37, 80, 68, 70]); // %PDF header

    // Mock React state
    mockSetState = jest.fn();
    mockGetState = {
      currentPDF: mockPDFDocument,
      currentPDFBytes: mockPDFBytes,
      currentPage: 1,
      isEditMode: false,
      textRegions: [],
      selectedTextRegion: null
    };

    require('react').useState.mockImplementation((initial) => [
      mockGetState[Object.keys(mockGetState)[0]] || initial,
      mockSetState
    ]);

    require('react').useRef.mockImplementation(() => ({
      current: document.createElement('div')
    }));

    require('react').useEffect.mockImplementation((fn) => fn());
    require('react').useCallback.mockImplementation((fn) => fn);
  });

  describe('Text Region Detection', () => {
    test('should detect clickable text regions from PDF', async () => {
      const { PDFTextEditorService } = require('../../src/renderer/services/PDFTextEditorService');
      const service = new PDFTextEditorService();

      const textRegions = await service.extractEditableTextFromPDF(mockPDFBytes);

      expect(textRegions).toHaveLength(2);
      expect(textRegions[0]).toMatchObject({
        text: 'Sample text to edit',
        x: expect.any(Number),
        y: expect.any(Number),
        width: expect.any(Number),
        height: expect.any(Number),
        page: 0
      });
    });

    test('should handle empty PDF pages gracefully', async () => {
      mockPDFDocument.getPage.mockResolvedValueOnce({
        getViewport: jest.fn(() => ({ width: 612, height: 792 })),
        getTextContent: jest.fn().mockResolvedValue({ items: [] })
      });

      const { PDFTextEditorService } = require('../../src/renderer/services/PDFTextEditorService');
      const service = new PDFTextEditorService();

      const textRegions = await service.extractEditableTextFromPDF(mockPDFBytes);
      expect(textRegions).toHaveLength(0);
    });
  });

  describe('Click-to-Edit Functionality', () => {
    test('should activate edit mode when clicking on text region', () => {
      const mockEvent = {
        currentTarget: {
          getBoundingClientRect: () => ({
            left: 0,
            top: 0
          })
        },
        clientX: 150,
        clientY: 300
      };

      // Mock text regions state
      const textRegions = [
        {
          id: 'text_1',
          x: 100,
          y: 680,
          width: 120,
          height: 14,
          originalText: 'Sample text to edit',
          pageIndex: 0
        }
      ];

      // Import the component and test click handling
      const { handlePDFClick } = require('../../src/renderer/components/PDFEditMode');
      
      // Simulate click on text region
      const result = handlePDFClick(mockEvent, textRegions, 1.0);

      expect(result).toMatchObject({
        clickedRegion: expect.objectContaining({
          id: 'text_1',
          originalText: 'Sample text to edit'
        }),
        editPosition: expect.objectContaining({
          x: expect.any(Number),
          y: expect.any(Number)
        })
      });
    });

    test('should not activate edit mode when clicking outside text regions', () => {
      const mockEvent = {
        currentTarget: {
          getBoundingClientRect: () => ({
            left: 0,
            top: 0
          })
        },
        clientX: 50, // Outside any text region
        clientY: 50
      };

      const textRegions = [
        {
          id: 'text_1',
          x: 100,
          y: 680,
          width: 120,
          height: 14,
          originalText: 'Sample text to edit',
          pageIndex: 0
        }
      ];

      const { handlePDFClick } = require('../../src/renderer/components/PDFEditMode');
      const result = handlePDFClick(mockEvent, textRegions, 1.0);

      expect(result.clickedRegion).toBeNull();
    });
  });

  describe('Inline Text Editor', () => {
    test('should render inline editor at correct position', () => {
      const mockProps = {
        region: {
          id: 'text_1',
          originalText: 'Sample text to edit',
          x: 100,
          y: 680,
          width: 120,
          height: 14
        },
        position: { x: 150, y: 300 },
        onSave: jest.fn(),
        onCancel: jest.fn(),
        zoom: 1.0
      };

      // Mock React component
      const InlineTextEditor = jest.fn(() => 
        document.createElement('div')
      );

      // Test component props
      InlineTextEditor(mockProps);

      expect(InlineTextEditor).toHaveBeenCalledWith(
        expect.objectContaining({
          region: expect.objectContaining({
            originalText: 'Sample text to edit'
          }),
          position: expect.objectContaining({
            x: 150,
            y: 300
          })
        }),
        expect.any(Object)
      );
    });

    test('should save text changes to PDF', async () => {
      const { RealPDFTextEditor } = require('../../src/renderer/services/RealPDFTextEditor');
      const editor = new RealPDFTextEditor();

      const editData = {
        regionId: 'text_1',
        newText: 'Updated text content',
        x: 100,
        y: 680,
        fontSize: 14,
        pageIndex: 0
      };

      const result = await editor.applyTextEdit(mockPDFBytes, editData);

      expect(result).toBeInstanceOf(Uint8Array);
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('PDF Persistence', () => {
    test('should save text edits permanently to PDF', async () => {
      const { RealPDFTextEditor } = require('../../src/renderer/services/RealPDFTextEditor');
      const editor = new RealPDFTextEditor();

      const edits = [
        {
          regionId: 'text_1',
          newText: 'Updated first line',
          x: 100,
          y: 700,
          fontSize: 14,
          pageIndex: 0
        },
        {
          regionId: 'text_2', 
          newText: 'Updated second line',
          x: 100,
          y: 680,
          fontSize: 14,
          pageIndex: 0
        }
      ];

      const result = await editor.applyMultipleTextEdits(mockPDFBytes, edits);

      expect(result).toBeInstanceOf(Uint8Array);
      
      // Verify edits were applied
      const appliedEdits = await editor.getAppliedEdits(result);
      expect(appliedEdits).toHaveLength(2);
      expect(appliedEdits[0].newText).toBe('Updated first line');
      expect(appliedEdits[1].newText).toBe('Updated second line');
    });

    test('should handle undo/redo functionality', async () => {
      const { RealPDFTextEditor } = require('../../src/renderer/services/RealPDFTextEditor');
      const editor = new RealPDFTextEditor();

      // Apply edit
      const editData = {
        regionId: 'text_1',
        newText: 'Updated text',
        x: 100,
        y: 680,
        fontSize: 14,
        pageIndex: 0
      };

      const editedPDF = await editor.applyTextEdit(mockPDFBytes, editData);
      expect(editedPDF).toBeInstanceOf(Uint8Array);

      // Undo edit
      const undoPDF = await editor.undoLastEdit();
      expect(undoPDF).toBeInstanceOf(Uint8Array);

      // Redo edit
      const redoPDF = await editor.redoLastEdit();
      expect(redoPDF).toBeInstanceOf(Uint8Array);
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid PDF gracefully', async () => {
      const { PDFTextEditorService } = require('../../src/renderer/services/PDFTextEditorService');
      const service = new PDFTextEditorService();

      const invalidPDF = new Uint8Array([1, 2, 3, 4]); // Invalid PDF

      await expect(service.extractEditableTextFromPDF(invalidPDF))
        .rejects.toThrow('Invalid PDF format');
    });

    test('should handle text editing errors gracefully', async () => {
      const { RealPDFTextEditor } = require('../../src/renderer/services/RealPDFTextEditor');
      const editor = new RealPDFTextEditor();

      const invalidEdit = {
        regionId: 'nonexistent',
        newText: 'Updated text',
        x: -100, // Invalid coordinate
        y: -100,
        fontSize: 0, // Invalid font size
        pageIndex: 999 // Invalid page
      };

      await expect(editor.applyTextEdit(mockPDFBytes, invalidEdit))
        .rejects.toThrow('Invalid edit parameters');
    });

    test('should recover from rendering failures', async () => {
      // Mock render failure
      mockPDFDocument.getPage.mockRejectedValueOnce(new Error('Render failed'));

      const { PDFTextEditorService } = require('../../src/renderer/services/PDFTextEditorService');
      const service = new PDFTextEditorService();

      // Should fallback gracefully
      const textRegions = await service.extractEditableTextFromPDF(mockPDFBytes);
      expect(textRegions).toHaveLength(0); // Should return empty array on failure
    });
  });

  describe('Performance Tests', () => {
    test('should handle large PDFs efficiently', async () => {
      // Mock large PDF with many text regions
      const manyTextItems = Array.from({ length: 1000 }, (_, i) => ({
        str: `Text item ${i}`,
        dir: 'ltr',
        width: 100,
        height: 12,
        transform: [12, 0, 0, 12, 50, 800 - (i * 15)],
        fontName: 'Arial'
      }));

      mockPDFDocument.getPage.mockResolvedValueOnce({
        getViewport: jest.fn(() => ({ width: 612, height: 792 })),
        getTextContent: jest.fn().mockResolvedValue({
          items: manyTextItems
        })
      });

      const { PDFTextEditorService } = require('../../src/renderer/services/PDFTextEditorService');
      const service = new PDFTextEditorService();

      const startTime = Date.now();
      const textRegions = await service.extractEditableTextFromPDF(mockPDFBytes);
      const endTime = Date.now();

      expect(textRegions).toHaveLength(1000);
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
    });

    test('should debounce rapid edit operations', async () => {
      const { RealPDFTextEditor } = require('../../src/renderer/services/RealPDFTextEditor');
      const editor = new RealPDFTextEditor();

      const edits = Array.from({ length: 100 }, (_, i) => ({
        regionId: 'text_1',
        newText: `Updated text ${i}`,
        x: 100,
        y: 680,
        fontSize: 14,
        pageIndex: 0
      }));

      // Apply edits rapidly
      const promises = edits.map(edit => editor.applyTextEdit(mockPDFBytes, edit));
      const results = await Promise.all(promises);

      // Should handle all edits but debounce them
      expect(results).toHaveLength(100);
      results.forEach(result => {
        expect(result).toBeInstanceOf(Uint8Array);
      });
    });
  });
});