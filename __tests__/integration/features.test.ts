import { PDFService } from '../../src/renderer/services/PDFService';
import { AnnotationService } from '../../src/renderer/services/AnnotationService';
import { OCRService } from '../../src/renderer/services/OCRService';
import { SecurityService } from '../../src/renderer/services/SecurityService';
import { AdvancedPDFAnalyticsService } from '../../src/renderer/services/AdvancedPDFAnalyticsService';
import { AdvancedFormBuilderService } from '../../src/renderer/services/AdvancedFormBuilderService';
import { DocumentWorkflowService } from '../../src/renderer/services/DocumentWorkflowService';
import { PDFDocument, rgb } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js for testing
pdfjsLib.GlobalWorkerOptions.workerSrc = null;

describe('Professional PDF Editor - Feature Integration Tests', () => {
  let pdfService: PDFService;
  let annotationService: AnnotationService;
  let ocrService: OCRService;
  let securityService: SecurityService;
  let analyticsService: AdvancedPDFAnalyticsService;
  let formBuilderService: AdvancedFormBuilderService;
  let workflowService: DocumentWorkflowService;
  let testPdfBytes: Uint8Array;

  beforeAll(async () => {
    // Initialize services
    pdfService = new PDFService();
    annotationService = new AnnotationService();
    ocrService = new OCRService();
    securityService = new SecurityService();
    analyticsService = new AdvancedPDFAnalyticsService();
    formBuilderService = new AdvancedFormBuilderService();
    workflowService = new DocumentWorkflowService();

    // Create a test PDF
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([612, 792]);
    page.drawText('Test PDF Document', {
      x: 50,
      y: 700,
      size: 30,
      color: rgb(0, 0, 0)
    });
    page.drawText('This is test content for integration testing.', {
      x: 50,
      y: 650,
      size: 12,
      color: rgb(0, 0, 0)
    });
    testPdfBytes = await pdfDoc.save();
  });

  describe('Core PDF Operations', () => {
    test('should load and parse PDF document', async () => {
      const pdf = await pdfjsLib.getDocument(testPdfBytes).promise;
      expect(pdf).toBeDefined();
      expect(pdf.numPages).toBe(1);
    });

    test('should merge multiple PDFs', async () => {
      const mergedPdf = await pdfService.mergePDFs([testPdfBytes, testPdfBytes]);
      const pdf = await pdfjsLib.getDocument(mergedPdf).promise;
      expect(pdf.numPages).toBe(2);
    });

    test('should split PDF', async () => {
      const doublePdf = await pdfService.mergePDFs([testPdfBytes, testPdfBytes]);
      const { first, second } = await pdfService.splitPDF(doublePdf, 1);
      
      const firstPdf = await pdfjsLib.getDocument(first).promise;
      const secondPdf = await pdfjsLib.getDocument(second).promise;
      
      expect(firstPdf.numPages).toBe(1);
      expect(secondPdf.numPages).toBe(1);
    });

    test('should rotate pages', async () => {
      const rotatedPdf = await pdfService.rotatePages(testPdfBytes, 90);
      expect(rotatedPdf).toBeDefined();
      expect(rotatedPdf.length).toBeGreaterThan(0);
    });

    test('should compress PDF', async () => {
      const compressedPdf = await pdfService.compressPDF(testPdfBytes, 'medium');
      expect(compressedPdf).toBeDefined();
      expect(compressedPdf.length).toBeLessThanOrEqual(testPdfBytes.length);
    });
  });

  describe('Annotation Features', () => {
    test('should create text annotation', () => {
      const annotation = annotationService.createAnnotation(
        'text',
        0,
        100,
        100,
        { text: 'Test annotation', color: { r: 1, g: 0, b: 0 } }
      );
      expect(annotation).toBeDefined();
      expect(annotation.type).toBe('text');
      expect(annotation.text).toBe('Test annotation');
    });

    test('should create highlight annotation', () => {
      const annotation = annotationService.createAnnotation(
        'highlight',
        0,
        50,
        50,
        { width: 200, height: 20, color: { r: 1, g: 1, b: 0 } }
      );
      expect(annotation).toBeDefined();
      expect(annotation.type).toBe('highlight');
    });

    test('should apply annotations to PDF', async () => {
      const annotation = annotationService.createAnnotation(
        'text',
        0,
        100,
        100,
        { text: 'Applied annotation' }
      );
      
      const pdfWithAnnotations = await annotationService.applyAnnotationsToPDF(testPdfBytes);
      expect(pdfWithAnnotations).toBeDefined();
      expect(pdfWithAnnotations.length).toBeGreaterThan(0);
    });
  });

  describe('Advanced Analytics', () => {
    test('should analyze document', async () => {
      const pdf = await pdfjsLib.getDocument(testPdfBytes).promise;
      const analysis = await analyticsService.analyzeDocument(pdf, testPdfBytes);
      
      expect(analysis).toBeDefined();
      expect(analysis.metrics).toBeDefined();
      expect(analysis.metrics.pageCount).toBe(1);
      expect(analysis.metrics.fileSize).toBeGreaterThan(0);
      expect(analysis.intelligence).toBeDefined();
      expect(analysis.intelligence.documentType).toBeDefined();
    });

    test('should generate optimization suggestions', async () => {
      const pdf = await pdfjsLib.getDocument(testPdfBytes).promise;
      const analysis = await analyticsService.analyzeDocument(pdf, testPdfBytes);
      
      expect(analysis.suggestions).toBeDefined();
      expect(Array.isArray(analysis.suggestions.optimization)).toBe(true);
      expect(Array.isArray(analysis.suggestions.accessibility)).toBe(true);
    });
  });

  describe('Advanced Form Builder', () => {
    test('should create text field', () => {
      const field = formBuilderService.createField(
        'text',
        100,
        100,
        200,
        30,
        0,
        { name: 'testField', required: true }
      );
      
      expect(field).toBeDefined();
      expect(field.type).toBe('text');
      expect(field.name).toBe('testField');
      expect(field.required).toBe(true);
    });

    test('should create checkbox field', () => {
      const field = formBuilderService.createField(
        'checkbox',
        100,
        200,
        20,
        20,
        0,
        { name: 'agreementBox', defaultValue: false }
      );
      
      expect(field).toBeDefined();
      expect(field.type).toBe('checkbox');
      expect(field.name).toBe('agreementBox');
    });

    test('should add form fields to PDF', async () => {
      const field = formBuilderService.createField(
        'text',
        100,
        100,
        200,
        30,
        0,
        { name: 'nameField' }
      );
      
      const pdfWithForms = await formBuilderService.addFormFieldsToPDF(
        testPdfBytes,
        [field]
      );
      
      expect(pdfWithForms).toBeDefined();
      expect(pdfWithForms.length).toBeGreaterThan(testPdfBytes.length);
    });

    test('should validate form fields', () => {
      const field = formBuilderService.createField(
        'email',
        100,
        100,
        200,
        30,
        0,
        {
          name: 'emailField',
          validation: {
            pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
          }
        }
      );
      
      const validation = formBuilderService.validateField(field, 'test@example.com');
      expect(validation.valid).toBe(true);
      
      const invalidValidation = formBuilderService.validateField(field, 'invalid-email');
      expect(invalidValidation.valid).toBe(false);
    });
  });

  describe('Document Workflow', () => {
    test('should create workflow', () => {
      const workflow = workflowService.createWorkflow(
        'doc123',
        'Test Document.pdf',
        'user1',
        [
          { userId: 'reviewer1', role: 'reviewer', permissions: ['view', 'comment'] }
        ]
      );
      
      expect(workflow).toBeDefined();
      expect(workflow.documentId).toBe('doc123');
      expect(workflow.status).toBe('draft');
      expect(workflow.participants).toHaveLength(1);
    });

    test('should create workflow from template', () => {
      const workflow = workflowService.createWorkflowFromTemplate(
        'document-review',
        'doc456',
        'Review Document.pdf',
        'user1',
        [
          { userId: 'reviewer1', role: 'reviewer', permissions: ['view', 'comment'] },
          { userId: 'approver1', role: 'approver', permissions: ['view', 'approve'] }
        ]
      );
      
      expect(workflow).toBeDefined();
      expect(workflow.steps).toHaveLength(2);
      expect(workflow.steps[0].type).toBe('review');
      expect(workflow.steps[1].type).toBe('approval');
    });

    test('should start workflow', async () => {
      const workflow = workflowService.createWorkflow(
        'doc789',
        'Start Document.pdf',
        'user1',
        []
      );
      
      await workflowService.startWorkflow(workflow.id);
      const updatedWorkflow = workflowService.getWorkflow(workflow.id);
      
      expect(updatedWorkflow?.status).toBe('in_progress');
    });

    test('should complete workflow step', async () => {
      const workflow = workflowService.createWorkflowFromTemplate(
        'simple-approval',
        'doc999',
        'Approval Document.pdf',
        'user1',
        [{ userId: 'approver1', role: 'approver', permissions: ['approve'] }]
      );
      
      await workflowService.startWorkflow(workflow.id);
      const currentStep = workflow.steps.find(s => s.status === 'pending');
      
      if (currentStep) {
        await workflowService.completeStep(
          workflow.id,
          currentStep.id,
          'approver1',
          'approved',
          'Looks good!'
        );
        
        const updatedStep = workflowService.getWorkflow(workflow.id)
          ?.steps.find(s => s.id === currentStep.id);
        
        expect(updatedStep?.status).toBe('completed');
      }
    });
  });

  describe('Security Features', () => {
    test('should encrypt PDF', async () => {
      const encryptedPdf = await securityService.encryptPDF(
        testPdfBytes,
        'testpassword123'
      );
      
      expect(encryptedPdf).toBeDefined();
      expect(encryptedPdf.length).toBeGreaterThan(0);
    });

    test('should set PDF permissions', async () => {
      const protectedPdf = await securityService.setPermissions(testPdfBytes, {
        printing: false,
        copying: false,
        modifying: false
      });
      
      expect(protectedPdf).toBeDefined();
      expect(protectedPdf.length).toBeGreaterThan(0);
    });
  });

  describe('OCR Integration', () => {
    test('should initialize OCR service', async () => {
      await ocrService.initialize('eng');
      expect(ocrService).toBeDefined();
    });

    test('should detect language', async () => {
      const pdf = await pdfjsLib.getDocument(testPdfBytes).promise;
      const language = await ocrService.detectLanguage(pdf, 1);
      expect(language).toBeDefined();
      expect(typeof language).toBe('string');
    });
  });

  describe('Integration Scenarios', () => {
    test('should handle complete document processing workflow', async () => {
      // 1. Load document
      const pdf = await pdfjsLib.getDocument(testPdfBytes).promise;
      expect(pdf.numPages).toBe(1);
      
      // 2. Analyze document
      const analysis = await analyticsService.analyzeDocument(pdf, testPdfBytes);
      expect(analysis.metrics.pageCount).toBe(1);
      
      // 3. Add annotations
      const annotation = annotationService.createAnnotation(
        'highlight',
        0,
        100,
        100,
        { width: 200, height: 20 }
      );
      const annotatedPdf = await annotationService.applyAnnotationsToPDF(testPdfBytes);
      
      // 4. Add form fields
      const field = formBuilderService.createField(
        'text',
        100,
        300,
        200,
        30,
        0,
        { name: 'signatureField' }
      );
      const pdfWithForms = await formBuilderService.addFormFieldsToPDF(
        annotatedPdf,
        [field]
      );
      
      // 5. Create workflow
      const workflow = workflowService.createWorkflow(
        'integration-doc',
        'Integration Test.pdf',
        'user1',
        [{ userId: 'reviewer1', role: 'reviewer', permissions: ['view'] }]
      );
      
      // 6. Encrypt final document
      const finalPdf = await securityService.encryptPDF(
        pdfWithForms,
        'secure123'
      );
      
      expect(finalPdf).toBeDefined();
      expect(finalPdf.length).toBeGreaterThan(testPdfBytes.length);
    });
  });
});

describe('Performance Tests', () => {
  test('should handle large PDF efficiently', async () => {
    // Create a larger test PDF
    const pdfDoc = await PDFDocument.create();
    for (let i = 0; i < 10; i++) {
      const page = pdfDoc.addPage([612, 792]);
      page.drawText(`Page ${i + 1}`, { x: 50, y: 700, size: 20 });
    }
    const largePdfBytes = await pdfDoc.save();
    
    const startTime = Date.now();
    const pdf = await pdfjsLib.getDocument(largePdfBytes).promise;
    const loadTime = Date.now() - startTime;
    
    expect(pdf.numPages).toBe(10);
    expect(loadTime).toBeLessThan(5000); // Should load in less than 5 seconds
  });
  
  test('should analyze document quickly', async () => {
    const analyticsService = new AdvancedPDFAnalyticsService();
    const pdf = await pdfjsLib.getDocument(testPdfBytes).promise;
    
    const startTime = Date.now();
    const analysis = await analyticsService.analyzeDocument(pdf, testPdfBytes);
    const analysisTime = Date.now() - startTime;
    
    expect(analysis).toBeDefined();
    expect(analysisTime).toBeLessThan(3000); // Should analyze in less than 3 seconds
  });
});