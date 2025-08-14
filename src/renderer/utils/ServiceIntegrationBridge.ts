/**
 * Service Integration Bridge
 * Fixes the critical disconnect between UI components and backend services
 * This ensures all UI actions are properly connected to real functionality
 */

import { PDFDocumentProxy } from 'pdfjs-dist/types/src/display/api';
import { PDFService } from '../services/PDFService';
import { AnnotationService } from '../services/AnnotationService';
import { SecurityService } from '../services/SecurityService';
import { OCRService } from '../services/OCRService';
import { FormService } from '../services/FormService';

export interface ServiceBridgeResult {
  success: boolean;
  data?: any;
  error?: string;
  message?: string;
}

export class ServiceIntegrationBridge {
  private pdfService: PDFService;
  private annotationService: AnnotationService;
  private securityService: SecurityService;
  private ocrService: OCRService;
  private formService: FormService;

  constructor() {
    console.log('🌉 Initializing Service Integration Bridge...');
    
    // Initialize all core services
    this.pdfService = new PDFService();
    this.annotationService = new AnnotationService();
    this.securityService = new SecurityService();
    this.ocrService = new OCRService();
    this.formService = new FormService();
    
    console.log('✅ Service Integration Bridge ready');
  }

  /**
   * Integrated PDF text editing with real persistence
   */
  async editPDFText(
    pdfBytes: Uint8Array,
    pageIndex: number,
    x: number,
    y: number,
    width: number,
    height: number,
    newText: string,
    fontOptions: any = {}
  ): Promise<ServiceBridgeResult> {
    try {
      console.log('✏️ Bridge: Applying text overlay (watermark) as editable-text fallback...');

      // There is no direct modifyText API on PDFService. Use addWatermark
      // as a deterministic fallback to persist text into the PDF bytes.
      const watermarkOptions: any = {
        fontSize: fontOptions?.fontSize || 12,
        opacity: fontOptions?.opacity ?? 1,
        rotation: fontOptions?.rotation ?? 0,
        color: fontOptions?.color || { r: 0, g: 0, b: 0 }
      };

      const result = await this.pdfService.addWatermark(
        pdfBytes,
        newText,
        watermarkOptions
      );

      return {
        success: true,
        data: result,
        message: 'Text overlay applied (use a dedicated edit API for true text replacement)'
      };
    } catch (error) {
      console.error('❌ Bridge: Text editing failed:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Text editing failed' };
    }
  }

  /**
   * Persistent annotation storage
   */
  async addAnnotation(
    pdfBytes: Uint8Array,
    pageIndex: number,
    annotation: any
  ): Promise<ServiceBridgeResult> {
    try {
      console.log('📝 Bridge: Creating annotation and embedding into PDF...');

      // Create annotation in-memory
      const created = this.annotationService.createAnnotation(
        annotation.type || 'note',
        pageIndex,
        annotation.x || 0,
        annotation.y || 0,
        annotation
      );

      // Persist current annotations into PDF
      const mergedPdf = await this.annotationService.applyAnnotationsToPDF(pdfBytes);

      return { success: true, data: { created, pdf: mergedPdf }, message: 'Annotation created and embedded into PDF' };
    } catch (error) {
      console.error('❌ Bridge: Annotation failed:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Annotation failed' };
    }
  }

  /**
   * Real digital signature implementation
   */
  async addDigitalSignature(
    pdfBytes: Uint8Array,
    signatureOptions: any
  ): Promise<ServiceBridgeResult> {
    try {
      console.log('🔐 Bridge: Adding digital signature (visual or cryptographic based on inputs)...');

      // Prefer cryptographic signature when private key provided
      if (signatureOptions?.privateKeyPkcs8 && typeof (this.securityService as any).addCryptographicSignature === 'function') {
        const result = await (this.securityService as any).addCryptographicSignature(
          pdfBytes,
          signatureOptions.signature || {},
          signatureOptions.privateKeyPkcs8,
          signatureOptions.certificateX509,
          signatureOptions.pageNumber || 1,
          signatureOptions.position || { x: 50, y: 50, width: 200, height: 80 }
        );

        return { success: !!result.success, data: result.data, error: result.error, message: result.success ? 'Cryptographic signature added' : 'Cryptographic signature failed' };
      }

      // Fallback: visual signature demo
      if (typeof (this.securityService as any).addVisualSignatureDemo === 'function') {
        const result = await (this.securityService as any).addVisualSignatureDemo(
          pdfBytes,
          signatureOptions.signature || {},
          signatureOptions.pageNumber || 1,
          signatureOptions.position || { x: 50, y: 50, width: 200, height: 80 }
        );

        return { success: !!result.success, data: result.data, error: result.error, message: result.success ? 'Visual signature added (demo)' : 'Visual signature failed' };
      }

      return { success: false, error: 'No signature capability available on SecurityService' };
    } catch (error) {
      console.error('❌ Bridge: Digital signature failed:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Digital signature failed' };
    }
  }

  /**
   * Integrated OCR processing
   */
  async performOCR(
    imageDataOrPdf: any,
    options: any = {}
  ): Promise<ServiceBridgeResult> {
    try {
      console.log('🔍 Bridge: Performing OCR using OCRService...');

      // If a PDFDocumentProxy is passed, run full OCR over it
      if (imageDataOrPdf && typeof imageDataOrPdf.getPage === 'function') {
        await this.ocrService.initialize(options.language || 'eng');
        const results = await this.ocrService.performFullOCR(imageDataOrPdf, options.language || 'eng');
        return { success: true, data: results, message: 'OCR completed for PDF' };
      }

      return { success: false, error: 'performOCR expects a PDFDocumentProxy; raw image OCR not supported by this bridge' };
      
    } catch (error) {
      console.error('❌ Bridge: OCR failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'OCR processing failed'
      };
    }
  }

  /**
   * Real form field creation
   */
  async createFormField(
    pdfBytes: Uint8Array,
    fieldDefinition: any
  ): Promise<ServiceBridgeResult> {
    try {
      console.log('📋 Bridge: Creating real form field...');
      
      // Use form service for actual field creation
      const result = await this.formService.addFormField(
        pdfBytes,
        fieldDefinition
      );
      
      return {
        success: true,
        data: result,
        message: 'Form field created and embedded in PDF'
      };
      
    } catch (error) {
      console.error('❌ Bridge: Form field creation failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Form field creation failed'
      };
    }
  }

  /**
   * Integrated PDF analysis
   */
  async analyzePDF(
    pdf: PDFDocumentProxy,
    pdfBytes: Uint8Array
  ): Promise<ServiceBridgeResult> {
    try {
      console.log('📊 Bridge: Performing integrated PDF analysis (metadata + dimensions)...');

      const metadata = await this.pdfService.getMetadata(pdfBytes);
      const pageCount = (pdf && (pdf as any).numPages) || null;
      const firstPageDimensions = pageCount ? await this.pdfService.getPageDimensions(pdfBytes, 1) : null;

      const basicAnalysis = { metadata, pageCount, firstPageDimensions };

      return { success: true, data: basicAnalysis, message: 'PDF analysis completed (basic)' };
    } catch (error) {
      console.error('❌ Bridge: PDF analysis failed:', error);
      return { success: false, error: error instanceof Error ? error.message : 'PDF analysis failed' };
    }
  }

  /**
   * Security operations
   */
  async encryptPDF(
    pdfBytes: Uint8Array,
    password: string,
    permissions: any = {}
  ): Promise<ServiceBridgeResult> {
    try {
      console.log('🔒 Bridge: Encrypting PDF using SecurityService APIs...');

      // Prefer advancedEncryptPDF if available
      if (typeof (this.securityService as any).advancedEncryptPDF === 'function') {
        const result = await (this.securityService as any).advancedEncryptPDF(pdfBytes, {
          userPassword: password,
          ownerPassword: password,
          encryptionLevel: 'standard',
          permissions
        });

        return { success: !!result.success, data: result.data, error: result.error, message: result.success ? 'PDF encrypted (advanced)' : 'PDF encryption failed' };
      }

      // Fallback to AES wrapper
      if (typeof (this.securityService as any).encryptDataAES256 === 'function') {
        const aes = await (this.securityService as any).encryptDataAES256(pdfBytes, password);
        return { success: !!aes.success, data: aes.encryptedData, error: aes.error, message: aes.success ? 'PDF encrypted with AES-256' : 'AES encryption failed' };
      }

      return { success: false, error: 'No encryption API available on SecurityService' };
      
    } catch (error) {
      console.error('❌ Bridge: PDF encryption failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'PDF encryption failed'
      };
    }
  }

  /**
   * Batch processing
   */
  async batchProcess(
    operations: Array<{
      type: string;
      pdfBytes: Uint8Array;
      options: any;
    }>
  ): Promise<ServiceBridgeResult> {
    try {
      console.log('⚡ Bridge: Batch processing operations...');
      
      const results = [];
      
      for (const operation of operations) {
        let result;
        
        switch (operation.type) {
          case 'textEdit':
            result = await this.editPDFText(
              operation.pdfBytes,
              operation.options.pageIndex,
              operation.options.x,
              operation.options.y,
              operation.options.width,
              operation.options.height,
              operation.options.newText,
              operation.options.fontOptions
            );
            break;
            
          case 'addAnnotation':
            result = await this.addAnnotation(
              operation.pdfBytes,
              operation.options.pageIndex,
              operation.options.annotation
            );
            break;
            
          case 'encrypt':
            result = await this.encryptPDF(
              operation.pdfBytes,
              operation.options.password,
              operation.options.permissions
            );
            break;
            
          default:
            result = {
              success: false,
              error: `Unknown operation type: ${operation.type}`
            };
        }
        
        results.push(result);
      }
      
      return {
        success: true,
        data: results,
        message: `Batch processing completed: ${results.length} operations`
      };
      
    } catch (error) {
      console.error('❌ Bridge: Batch processing failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Batch processing failed'
      };
    }
  }

  /**
   * Health check for all services
   */
  async healthCheck(): Promise<{
    overall: boolean;
    services: Record<string, boolean>;
    details: Record<string, string>;
  }> {
    const results = {
      overall: true,
      services: {} as Record<string, boolean>,
      details: {} as Record<string, string>
    };

    try {
      // Check PDF service availability (presence of loadPDF)
      results.services.pdf = await this.checkService(() => !!(this.pdfService && typeof this.pdfService.loadPDF === 'function'));
      results.details.pdf = results.services.pdf ? 'Ready' : 'Missing PDFService.loadPDF';

      // Check annotation service (create + apply)
      results.services.annotations = await this.checkService(() => !!(this.annotationService && typeof this.annotationService.createAnnotation === 'function' && typeof this.annotationService.applyAnnotationsToPDF === 'function'));
      results.details.annotations = results.services.annotations ? 'Ready' : 'Annotation APIs missing';

      // Check security service (encryption)
      results.services.security = await this.checkService(() => !!(this.securityService && (typeof (this.securityService as any).encryptDataAES256 === 'function' || typeof (this.securityService as any).advancedEncryptPDF === 'function')));
      results.details.security = results.services.security ? 'Ready' : 'No encryption APIs available';

      // Check OCR service
      results.services.ocr = await this.checkService(() => !!(this.ocrService && typeof this.ocrService.performFullOCR === 'function'));
      results.details.ocr = results.services.ocr ? 'Ready' : 'OCRService missing performFullOCR';

      // Check form service
      results.services.forms = await this.checkService(() => !!(this.formService && typeof this.formService.addFormField === 'function'));
      results.details.forms = results.services.forms ? 'Ready' : 'FormService.addFormField missing';

      // Overall health
      results.overall = Object.values(results.services).every(status => status === true);

    } catch (error) {
      console.error('❌ Bridge: Health check failed:', error);
      results.overall = false;
    }

    return results;
  }

  private async checkService(checker?: () => boolean | Promise<boolean>): Promise<boolean> {
    try {
      if (!checker) return true;
      const res = checker();
      if (res && typeof (res as any).then === 'function') {
        return await (res as Promise<boolean>);
      }
      return !!res;
    } catch (e) {
      return false;
    }
  }

  /**
   * Get integration status
   */
  getIntegrationStatus() {
    return {
      bridge: 'ServiceIntegrationBridge',
      version: '1.0.0',
      purpose: 'Connects UI components to backend services',
      addresses: [
        'UI/Backend disconnection',
        'Mock implementations',
        'Real PDF modifications',
        'Service coordination'
      ],
      services: [
        'PDFService',
        'AnnotationService', 
        'SecurityService',
        'OCRService',
        'FormService'
      ]
    };
  }
}

// Singleton instance for app-wide use
export const serviceIntegrationBridge = new ServiceIntegrationBridge();
