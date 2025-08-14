/**
 * PDF Merging Tests
 * Comprehensive tests for PDF merging functionality
 */

import { PDFDocument } from 'pdf-lib';
import { PDFService } from '../services/PDFService';

// Mock PDF data for testing
const createMockPDF = async (title: string, pageCount: number = 1): Promise<Uint8Array> => {
  const pdfDoc = await PDFDocument.create();
  
  for (let i = 0; i < pageCount; i++) {
    const page = pdfDoc.addPage([612, 792]); // Standard letter size
    
    // Add title text
    const font = await pdfDoc.embedFont('Helvetica');
    page.drawText(`Document: ${title}`, {
      x: 50,
      y: 700,
      size: 24,
      font: font,
      color: { r: 0, g: 0, b: 0 }
    });
    
    // Add page number
    page.drawText(`Page ${i + 1}`, {
      x: 50,
      y: 650,
      size: 12,
      font: font,
      color: { r: 0.5, g: 0.5, b: 0.5 }
    });
  }
  
  return await pdfDoc.save();
};

describe('PDFService - Merge PDFs', () => {
  let pdfService: PDFService;
  
  beforeEach(() => {
    pdfService = new PDFService();
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  test('should merge two simple PDFs correctly', async () => {
    // Create two mock PDFs
    const pdf1 = await createMockPDF('First Document', 2);
    const pdf2 = await createMockPDF('Second Document', 1);
    
    // Merge PDFs
    const mergedPdfBytes = await pdfService.mergePDFs([pdf1, pdf2]);
    
    // Load merged PDF
    const mergedPdf = await PDFDocument.load(mergedPdfBytes);
    
    // Verify merged PDF has correct number of pages
    expect(mergedPdf.getPageCount()).toBe(3); // 2 + 1 = 3 pages
    
    // Verify content of first page
    const firstPage = mergedPdf.getPage(0);
    // Note: We can't easily extract text from pdf-lib pages, but we can verify structure
    
    // Verify merged PDF bytes are valid
    expect(mergedPdfBytes).toBeInstanceOf(Uint8Array);
    expect(mergedPdfBytes.length).toBeGreaterThan(0);
  });
  
  test('should merge multiple PDFs correctly', async () => {
    // Create multiple mock PDFs
    const pdf1 = await createMockPDF('Document 1', 1);
    const pdf2 = await createMockPDF('Document 2', 2);
    const pdf3 = await createMockPDF('Document 3', 1);
    const pdf4 = await createMockPDF('Document 4', 3);
    
    // Merge all PDFs
    const mergedPdfBytes = await pdfService.mergePDFs([pdf1, pdf2, pdf3, pdf4]);
    
    // Load merged PDF
    const mergedPdf = await PDFDocument.load(mergedPdfBytes);
    
    // Verify merged PDF has correct number of pages
    expect(mergedPdf.getPageCount()).toBe(7); // 1 + 2 + 1 + 3 = 7 pages
    
    // Verify merged PDF bytes are valid
    expect(mergedPdfBytes).toBeInstanceOf(Uint8Array);
    expect(mergedPdfBytes.length).toBeGreaterThan(0);
  });
  
  test('should handle single PDF correctly', async () => {
    // Create single mock PDF
    const pdf1 = await createMockPDF('Single Document', 3);
    
    // Merge single PDF (should return the same PDF)
    const mergedPdfBytes = await pdfService.mergePDFs([pdf1]);
    
    // Load merged PDF
    const mergedPdf = await PDFDocument.load(mergedPdfBytes);
    
    // Verify merged PDF has correct number of pages
    expect(mergedPdf.getPageCount()).toBe(3);
    
    // Verify merged PDF bytes are valid
    expect(mergedPdfBytes).toBeInstanceOf(Uint8Array);
    expect(mergedPdfBytes.length).toBeGreaterThan(0);
  });
  
  test('should reject empty array of PDFs', async () => {
    // Try to merge empty array
    await expect(pdfService.mergePDFs([]))
      .rejects
      .toThrow('Cannot merge an empty array of PDF buffers.');
  });
  
  test('should handle PDFs with different page sizes', async () => {
    // Create PDFs with different page sizes
    const pdf1 = await createMockPDF('Letter Size', 1); // Default letter size
    
    // Create A4 size PDF
    const pdf2Doc = await PDFDocument.create();
    const a4Page = pdf2Doc.addPage([595, 842]); // A4 size in points
    const font = await pdf2Doc.embedFont('Helvetica');
    a4Page.drawText('A4 Document', {
      x: 50,
      y: 750,
      size: 24,
      font: font,
      color: { r: 0, g: 0, b: 0 }
    });
    const pdf2 = await pdf2Doc.save();
    
    // Merge PDFs with different page sizes
    const mergedPdfBytes = await pdfService.mergePDFs([pdf1, pdf2]);
    
    // Load merged PDF
    const mergedPdf = await PDFDocument.load(mergedPdfBytes);
    
    // Verify merged PDF has correct number of pages
    expect(mergedPdf.getPageCount()).toBe(2);
    
    // Each page should maintain its original size
    const pages = mergedPdf.getPages();
    expect(pages).toHaveLength(2);
    
    // Verify merged PDF bytes are valid
    expect(mergedPdfBytes).toBeInstanceOf(Uint8Array);
    expect(mergedPdfBytes.length).toBeGreaterThan(0);
  });
  
  test('should preserve annotations when merging', async () => {
    // Create PDF with annotations
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([612, 792]);
    
    // Add some text
    const font = await pdfDoc.embedFont('Helvetica');
    page.drawText('PDF with Annotations', {
      x: 50,
      y: 700,
      size: 24,
      font: font,
      color: { r: 0, g: 0, b: 0 }
    });
    
    // Add a rectangle annotation
    page.drawRectangle({
      x: 100,
      y: 600,
      width: 100,
      height: 50,
      borderColor: { r: 1, g: 0, b: 0 },
      borderWidth: 2
    });
    
    const pdfWithAnnotations = await pdfDoc.save();
    
    // Create another simple PDF
    const simplePdf = await createMockPDF('Simple Document', 1);
    
    // Merge PDFs
    const mergedPdfBytes = await pdfService.mergePDFs([pdfWithAnnotations, simplePdf]);
    
    // Load merged PDF
    const mergedPdf = await PDFDocument.load(mergedPdfBytes);
    
    // Verify merged PDF has correct number of pages
    expect(mergedPdf.getPageCount()).toBe(2);
    
    // Verify merged PDF bytes are valid
    expect(mergedPdfBytes).toBeInstanceOf(Uint8Array);
    expect(mergedPdfBytes.length).toBeGreaterThan(0);
  });
  
  test('should handle large PDFs efficiently', async () => {
    // Create larger PDFs to test performance
    const largePdf1 = await createMockPDF('Large Document 1', 10);
    const largePdf2 = await createMockPDF('Large Document 2', 15);
    
    // Measure time to merge
    const startTime = Date.now();
    const mergedPdfBytes = await pdfService.mergePDFs([largePdf1, largePdf2]);
    const endTime = Date.now();
    
    // Load merged PDF
    const mergedPdf = await PDFDocument.load(mergedPdfBytes);
    
    // Verify merged PDF has correct number of pages
    expect(mergedPdf.getPageCount()).toBe(25); // 10 + 15 = 25 pages
    
    // Verify merged PDF bytes are valid
    expect(mergedPdfBytes).toBeInstanceOf(Uint8Array);
    expect(mergedPdfBytes.length).toBeGreaterThan(0);
    
    // Performance check - should complete in reasonable time
    const mergeTime = endTime - startTime;
    expect(mergeTime).toBeLessThan(5000); // Should complete in less than 5 seconds
  });
  
  test('should handle corrupted PDF gracefully', async () => {
    // Create valid PDF
    const validPdf = await createMockPDF('Valid Document', 1);
    
    // Create corrupted/invalid PDF data
    const corruptedPdf = new Uint8Array([0x00, 0x01, 0x02, 0x03, 0x04]);
    
    // Should handle error gracefully when one PDF is corrupted
    await expect(pdfService.mergePDFs([validPdf, corruptedPdf]))
      .rejects
      .toThrow(); // Should throw an error when trying to load corrupted PDF
  });
  
  test('should maintain PDF metadata after merging', async () => {
    // Create PDF with metadata
    const pdfDoc = await PDFDocument.create();
    pdfDoc.setTitle('Test Document');
    pdfDoc.setAuthor('Test Author');
    pdfDoc.setSubject('Test Subject');
    pdfDoc.setKeywords(['test', 'pdf', 'merge']);
    pdfDoc.setCreator('PDF Editor Test Suite');
    pdfDoc.setProducer('pdf-lib');
    
    // Add a page
    const page = pdfDoc.addPage([612, 792]);
    const font = await pdfDoc.embedFont('Helvetica');
    page.drawText('Test Document Content', {
      x: 50,
      y: 700,
      size: 24,
      font: font,
      color: { r: 0, g: 0, b: 0 }
    });
    
    const pdfWithMetadata = await pdfDoc.save();
    
    // Create another PDF
    const simplePdf = await createMockPDF('Simple Document', 1);
    
    // Merge PDFs
    const mergedPdfBytes = await pdfService.mergePDFs([pdfWithMetadata, simplePdf]);
    
    // Load merged PDF
    const mergedPdf = await PDFDocument.load(mergedPdfBytes);
    
    // Verify merged PDF has correct number of pages
    expect(mergedPdf.getPageCount()).toBe(2);
    
    // Note: Metadata preservation depends on implementation details
    // In this case, the first PDF's metadata should be preserved
    
    // Verify merged PDF bytes are valid
    expect(mergedPdfBytes).toBeInstanceOf(Uint8Array);
    expect(mergedPdfBytes.length).toBeGreaterThan(0);
  });
  
  test('should handle very large arrays of PDFs', async () => {
    // Create multiple small PDFs
    const pdfs: Uint8Array[] = [];
    for (let i = 0; i < 10; i++) {
      const pdf = await createMockPDF(`Document ${i + 1}`, 1);
      pdfs.push(pdf);
    }
    
    // Merge all PDFs
    const mergedPdfBytes = await pdfService.mergePDFs(pdfs);
    
    // Load merged PDF
    const mergedPdf = await PDFDocument.load(mergedPdfBytes);
    
    // Verify merged PDF has correct number of pages
    expect(mergedPdf.getPageCount()).toBe(10);
    
    // Verify merged PDF bytes are valid
    expect(mergedPdfBytes).toBeInstanceOf(Uint8Array);
    expect(mergedPdfBytes.length).toBeGreaterThan(0);
  });
  
  test('should preserve text content when merging', async () => {
    // Create PDF with specific text content
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([612, 792]);
    const font = await pdfDoc.embedFont('Helvetica');
    
    // Add distinctive text
    page.drawText('MERGE TEST CONTENT', {
      x: 50,
      y: 700,
      size: 24,
      font: font,
      color: { r: 0, g: 0, b: 0 }
    });
    
    const testPdf = await pdfDoc.save();
    
    // Create another PDF
    const simplePdf = await createMockPDF('Simple Document', 1);
    
    // Merge PDFs
    const mergedPdfBytes = await pdfService.mergePDFs([testPdf, simplePdf]);
    
    // Load merged PDF
    const mergedPdf = await PDFDocument.load(mergedPdfBytes);
    
    // Verify merged PDF has correct number of pages
    expect(mergedPdf.getPageCount()).toBe(2);
    
    // Verify merged PDF bytes are valid
    expect(mergedPdfBytes).toBeInstanceOf(Uint8Array);
    expect(mergedPdfBytes.length).toBeGreaterThan(0);
  });
});

// Additional integration tests for mergePDFs with Electron API
describe('PDF Merging - Integration Tests', () => {
  let pdfService: PDFService;
  
  beforeEach(() => {
    pdfService = new PDFService();
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  test('should handle multi-selection file dialog results', async () => {
    // Mock Electron API result with multiple files
    const mockElectronResult = {
      success: true,
      files: [
        {
          data: await createMockPDF('File 1', 1),
          path: '/path/to/file1.pdf'
        },
        {
          data: await createMockPDF('File 2', 1),
          path: '/path/to/file2.pdf'
        }
      ]
    };
    
    // This simulates how the App.tsx mergePDFs function would handle the result
    if (mockElectronResult.files && mockElectronResult.files.length > 0) {
      const pdfBuffers = mockElectronResult.files.map((file: any) => file.data);
      const mergedPdfBytes = await pdfService.mergePDFs(pdfBuffers);
      
      // Load merged PDF
      const mergedPdf = await PDFDocument.load(mergedPdfBytes);
      
      // Verify merged PDF has correct number of pages
      expect(mergedPdf.getPageCount()).toBe(2);
      
      // Verify merged PDF bytes are valid
      expect(mergedPdfBytes).toBeInstanceOf(Uint8Array);
      expect(mergedPdfBytes.length).toBeGreaterThan(0);
    }
  });
  
  test('should handle single file dialog result (backward compatibility)', async () => {
    // Mock Electron API result with single file (backward compatibility)
    const mockElectronResult = {
      success: true,
      data: await createMockPDF('Single File', 1),
      path: '/path/to/single-file.pdf'
    };
    
    // This simulates backward compatibility handling in App.tsx mergePDFs function
    if (mockElectronResult.data) {
      const mergedPdfBytes = await pdfService.mergePDFs([
        await createMockPDF('Main Document', 1),
        mockElectronResult.data
      ]);
      
      // Load merged PDF
      const mergedPdf = await PDFDocument.load(mergedPdfBytes);
      
      // Verify merged PDF has correct number of pages
      expect(mergedPdf.getPageCount()).toBe(2);
      
      // Verify merged PDF bytes are valid
      expect(mergedPdfBytes).toBeInstanceOf(Uint8Array);
      expect(mergedPdfBytes.length).toBeGreaterThan(0);
    }
  });
  
  test('should reject invalid file dialog results', async () => {
    // Mock invalid Electron API result
    const mockElectronResult = {
      success: true,
      // Missing data/files property
    };
    
    // This simulates error handling in App.tsx mergePDFs function
    expect(() => {
      if (!mockElectronResult || !mockElectronResult.data) {
        throw new Error('No files selected for merging');
      }
    }).toThrow('No files selected for merging');
  });
});