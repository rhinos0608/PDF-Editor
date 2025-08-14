import { PDFDocument, PDFPage, rgb, StandardFonts } from 'pdf-lib';

export interface SignatureField {
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  pageIndex: number;
  required?: boolean;
  locked?: boolean;
  reason?: string;
  location?: string;
  contactInfo?: string;
}

export interface DigitalCertificate {
  commonName: string;
  organization?: string;
  organizationalUnit?: string;
  country?: string;
  state?: string;
  locality?: string;
  email?: string;
  validFrom: Date;
  validTo: Date;
  serialNumber: string;
  issuer: string;
  publicKey: CryptoKey;
  privateKey: CryptoKey;
  certificateBytes: Uint8Array;
}

export interface SignatureInfo {
  signerName: string;
  signatureDate: Date;
  reason?: string;
  location?: string;
  contactInfo?: string;
  certificate?: DigitalCertificate;
  isValid: boolean;
  signatureBytes?: Uint8Array;
  imageBytes?: Uint8Array;
}

export interface SignatureAppearance {
  type: 'text' | 'image' | 'draw' | 'mixed';
  text?: string;
  imageBytes?: Uint8Array;
  drawingPath?: Array<{ x: number; y: number; pressure?: number }>;
  showDate?: boolean;
  showReason?: boolean;
  showLocation?: boolean;
  backgroundColor?: { r: number; g: number; b: number };
  borderColor?: { r: number; g: number; b: number };
  textColor?: { r: number; g: number; b: number };
}

export interface TimestampInfo {
  timestampServer: string;
  timestampToken: Uint8Array;
  timestampDate: Date;
  isValid: boolean;
}

export class DigitalSignatureService {
  private crypto: SubtleCrypto;

  constructor() {
    this.crypto = window.crypto.subtle;
  }

  /**
   * Generate a self-signed certificate for testing/demo purposes
   */
  async generateSelfSignedCertificate(
    subject: {
      commonName: string;
      organization?: string;
      country?: string;
      email?: string;
    },
    validityDays: number = 365
  ): Promise<DigitalCertificate> {
    // Generate RSA key pair
    const keyPair = await this.crypto.generateKey(
      {
        name: 'RSA-PSS',
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: 'SHA-256'
      },
      true,
      ['sign', 'verify']
    );

    const validFrom = new Date();
    const validTo = new Date();
    validTo.setDate(validFrom.getDate() + validityDays);

    // In a real implementation, this would generate a proper X.509 certificate
    // For now, we'll create a simplified certificate structure
    const certificate: DigitalCertificate = {
      commonName: subject.commonName,
      organization: subject.organization,
      country: subject.country,
      email: subject.email,
      validFrom,
      validTo,
      serialNumber: this.generateSerialNumber(),
      issuer: subject.commonName, // Self-signed
      publicKey: keyPair.publicKey,
      privateKey: keyPair.privateKey,
      certificateBytes: new Uint8Array() // Would contain DER-encoded certificate
    };

    return certificate;
  }

  /**
   * Import certificate from file
   */
  async importCertificate(certificateBytes: Uint8Array, password?: string): Promise<DigitalCertificate> {
    // This would parse a real certificate file (PFX, P12, etc.)
    // For now, return a mock certificate
    throw new Error('Certificate import not yet implemented - use generateSelfSignedCertificate for testing');
  }

  /**
   * Add signature field to PDF
   */
  async addSignatureField(
    pdfBytes: Uint8Array,
    signatureField: SignatureField
  ): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const form = pdfDoc.getForm();
    const page = pdfDoc.getPage(signatureField.pageIndex);

    // Create signature field
    const sigField = form.createTextField(signatureField.name);
    
    sigField.addToPage(page, {
      x: signatureField.x,
      y: signatureField.y,
      width: signatureField.width,
      height: signatureField.height,
      borderColor: rgb(0, 0, 0),
      borderWidth: 1,
      backgroundColor: rgb(0.95, 0.95, 0.95)
    });

    // Add signature placeholder text
    page.drawText('Digital Signature', {
      x: signatureField.x + 5,
      y: signatureField.y + signatureField.height / 2,
      size: 10,
      color: rgb(0.5, 0.5, 0.5)
    });

    return await pdfDoc.save();
  }

  /**
   * Sign PDF document
   */
  async signDocument(
    pdfBytes: Uint8Array,
    signatureField: SignatureField,
    certificate: DigitalCertificate,
    appearance: SignatureAppearance,
    options: {
      reason?: string;
      location?: string;
      contactInfo?: string;
      timestampServer?: string;
    } = {}
  ): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const page = pdfDoc.getPage(signatureField.pageIndex);

    // Create signature appearance
    await this.drawSignatureAppearance(page, signatureField, appearance, certificate, options);

    // In a real implementation, this would:
    // 1. Create a signature dictionary in the PDF
    // 2. Generate a hash of the document content
    // 3. Sign the hash with the private key
    // 4. Embed the signature in the PDF structure
    // 5. Optionally add timestamp from TSA server

    // For now, we'll simulate by drawing the signature appearance
    const signatureData = await this.createSignatureData(pdfBytes, certificate, options);
    
    // Add signature metadata
    const now = new Date();
    pdfDoc.setModificationDate(now);
    
    return await pdfDoc.save();
  }

  /**
   * Verify digital signatures in PDF
   */
  async verifySignatures(pdfBytes: Uint8Array): Promise<SignatureInfo[]> {
    // This would parse the PDF signature dictionaries and verify them
    // For now, return empty array
    console.warn('Signature verification requires advanced PDF parsing not yet implemented');
    return [];
  }

  /**
   * Create signature appearance on page
   */
  private async drawSignatureAppearance(
    page: PDFPage,
    field: SignatureField,
    appearance: SignatureAppearance,
    certificate: DigitalCertificate,
    options: any
  ): Promise<void> {
    const { x, y, width, height } = field;

    // Clear the signature field area
    if (appearance.backgroundColor) {
      page.drawRectangle({
        x,
        y,
        width,
        height,
        color: rgb(
          appearance.backgroundColor.r,
          appearance.backgroundColor.g,
          appearance.backgroundColor.b
        )
      });
    }

    // Draw border
    if (appearance.borderColor) {
      page.drawRectangle({
        x,
        y,
        width,
        height,
        borderColor: rgb(
          appearance.borderColor.r,
          appearance.borderColor.g,
          appearance.borderColor.b
        ),
        borderWidth: 1
      });
    }

    const font = await page.doc.embedFont(StandardFonts.Helvetica);
    const textColor = appearance.textColor || { r: 0, g: 0, b: 0 };
    let currentY = y + height - 15;

    switch (appearance.type) {
      case 'text':
        if (appearance.text) {
          page.drawText(appearance.text, {
            x: x + 5,
            y: currentY,
            size: 12,
            font,
            color: rgb(textColor.r, textColor.g, textColor.b)
          });
          currentY -= 15;
        }
        break;

      case 'image':
        if (appearance.imageBytes) {
          try {
            let image;
            const uint8 = new Uint8Array(appearance.imageBytes);
            
            if (uint8[0] === 0xFF && uint8[1] === 0xD8) {
              image = await page.doc.embedJpg(appearance.imageBytes);
            } else if (uint8[0] === 0x89 && uint8[1] === 0x50) {
              image = await page.doc.embedPng(appearance.imageBytes);
            }

            if (image) {
              const imageHeight = Math.min(height - 20, 40);
              page.drawImage(image, {
                x: x + 5,
                y: currentY - imageHeight,
                width: Math.min(width - 10, 100),
                height: imageHeight
              });
              currentY -= imageHeight + 5;
            }
          } catch (error) {
            console.warn('Failed to embed signature image:', error);
          }
        }
        break;

      case 'draw':
        if (appearance.drawingPath && appearance.drawingPath.length > 0) {
          // Convert drawing path to PDF path operations
          // This is a simplified implementation
          const path = appearance.drawingPath;
          for (let i = 1; i < path.length; i++) {
            page.drawLine({
              start: { x: x + path[i-1].x, y: y + path[i-1].y },
              end: { x: x + path[i].x, y: y + path[i].y },
              thickness: 2,
              color: rgb(textColor.r, textColor.g, textColor.b)
            });
          }
          currentY -= 30;
        }
        break;

      case 'mixed':
        // Combine multiple appearance types
        if (appearance.imageBytes) {
          // Draw image first (smaller)
          try {
            let image;
            const uint8 = new Uint8Array(appearance.imageBytes);
            
            if (uint8[0] === 0xFF && uint8[1] === 0xD8) {
              image = await page.doc.embedJpg(appearance.imageBytes);
            } else if (uint8[0] === 0x89 && uint8[1] === 0x50) {
              image = await page.doc.embedPng(appearance.imageBytes);
            }

            if (image) {
              page.drawImage(image, {
                x: x + 5,
                y: currentY - 25,
                width: 60,
                height: 25
              });
            }
          } catch (error) {
            console.warn('Failed to embed signature image:', error);
          }
        }
        
        if (appearance.text) {
          page.drawText(appearance.text, {
            x: x + 70,
            y: currentY - 10,
            size: 10,
            font,
            color: rgb(textColor.r, textColor.g, textColor.b)
          });
        }
        currentY -= 30;
        break;
    }

    // Add certificate information
    page.drawText(`Signed by: ${certificate.commonName}`, {
      x: x + 5,
      y: currentY,
      size: 8,
      font,
      color: rgb(textColor.r, textColor.g, textColor.b)
    });
    currentY -= 12;

    // Add date if requested
    if (appearance.showDate) {
      const dateText = `Date: ${new Date().toLocaleString()}`;
      page.drawText(dateText, {
        x: x + 5,
        y: currentY,
        size: 8,
        font,
        color: rgb(textColor.r, textColor.g, textColor.b)
      });
      currentY -= 12;
    }

    // Add reason if requested and provided
    if (appearance.showReason && options.reason) {
      page.drawText(`Reason: ${options.reason}`, {
        x: x + 5,
        y: currentY,
        size: 8,
        font,
        color: rgb(textColor.r, textColor.g, textColor.b)
      });
      currentY -= 12;
    }

    // Add location if requested and provided
    if (appearance.showLocation && options.location) {
      page.drawText(`Location: ${options.location}`, {
        x: x + 5,
        y: currentY,
        size: 8,
        font,
        color: rgb(textColor.r, textColor.g, textColor.b)
      });
    }
  }

  /**
   * Create signature data (simplified implementation)
   */
  private async createSignatureData(
    pdfBytes: Uint8Array,
    certificate: DigitalCertificate,
    options: any
  ): Promise<Uint8Array> {
    // In a real implementation, this would:
    // 1. Calculate document hash
    // 2. Sign hash with private key
    // 3. Create PKCS#7 signature structure
    // 4. Optionally add timestamp

    // Create a simple hash of the document for demo purposes
    const hashBuffer = await this.crypto.digest('SHA-256', pdfBytes);
    
    // Sign the hash (simplified - would normally use PKCS#7 structure)
    try {
      const signature = await this.crypto.sign(
        {
          name: 'RSA-PSS',
          saltLength: 32
        },
        certificate.privateKey,
        hashBuffer
      );
      
      return new Uint8Array(signature);
    } catch (error) {
      console.warn('Signature creation failed:', error);
      return new Uint8Array();
    }
  }

  /**
   * Get timestamp from TSA server
   */
  async getTimestamp(
    data: Uint8Array,
    timestampServer: string
  ): Promise<TimestampInfo | null> {
    try {
      // This would make a request to a Time Stamp Authority server
      // For now, return null
      console.warn('Timestamp service integration not yet implemented');
      return null;
    } catch (error) {
      console.error('Failed to get timestamp:', error);
      return null;
    }
  }

  /**
   * Remove signature from PDF
   */
  async removeSignature(
    pdfBytes: Uint8Array,
    signatureFieldName: string
  ): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const form = pdfDoc.getForm();

    try {
      const field = form.getField(signatureFieldName);
      // Note: pdf-lib doesn't have direct signature removal
      // This would require low-level PDF manipulation
      console.warn('Signature removal requires advanced PDF manipulation');
    } catch (error) {
      console.warn(`Signature field ${signatureFieldName} not found`);
    }

    return await pdfDoc.save();
  }

  /**
   * Validate certificate chain
   */
  async validateCertificateChain(certificate: DigitalCertificate): Promise<{
    isValid: boolean;
    errors: string[];
    trustChain: DigitalCertificate[];
  }> {
    // This would validate the certificate against trusted root CAs
    // For now, return basic validation
    const errors: string[] = [];
    const now = new Date();

    if (certificate.validFrom > now) {
      errors.push('Certificate is not yet valid');
    }

    if (certificate.validTo < now) {
      errors.push('Certificate has expired');
    }

    return {
      isValid: errors.length === 0,
      errors,
      trustChain: [certificate] // Simplified
    };
  }

  /**
   * Create drawing pad for signature capture
   */
  createSignaturePad(
    canvas: HTMLCanvasElement,
    options: {
      penColor?: string;
      backgroundColor?: string;
      penWidth?: number;
      onComplete?: (imageData: Uint8Array) => void;
    } = {}
  ): {
    startDrawing: () => void;
    stopDrawing: () => void;
    clear: () => void;
    getImageData: () => Promise<Uint8Array>;
    getPath: () => Array<{ x: number; y: number; pressure?: number }>;
  } {
    const ctx = canvas.getContext('2d')!;
    const {
      penColor = '#000000',
      backgroundColor = '#ffffff',
      penWidth = 2
    } = options;

    let isDrawing = false;
    let currentPath: Array<{ x: number; y: number; pressure?: number }> = [];

    // Set up canvas
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = penColor;
    ctx.lineWidth = penWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const startDrawing = () => {
      isDrawing = true;
      currentPath = [];
    };

    const stopDrawing = () => {
      isDrawing = false;
    };

    const clear = () => {
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      currentPath = [];
    };

    const getImageData = async (): Promise<Uint8Array> => {
      return new Promise((resolve) => {
        canvas.toBlob((blob) => {
          if (blob) {
            blob.arrayBuffer().then(buffer => {
              resolve(new Uint8Array(buffer));
            });
          } else {
            resolve(new Uint8Array());
          }
        }, 'image/png');
      });
    };

    const getPath = () => [...currentPath];

    // Mouse/touch event handlers
    const handleStart = (e: MouseEvent | TouchEvent) => {
      startDrawing();
      const rect = canvas.getBoundingClientRect();
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      
      const x = clientX - rect.left;
      const y = clientY - rect.top;
      
      currentPath.push({ x, y });
      ctx.beginPath();
      ctx.moveTo(x, y);
    };

    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (!isDrawing) return;
      
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      
      const x = clientX - rect.left;
      const y = clientY - rect.top;
      
      currentPath.push({ x, y });
      ctx.lineTo(x, y);
      ctx.stroke();
    };

    const handleEnd = () => {
      stopDrawing();
      if (options.onComplete) {
        getImageData().then(options.onComplete);
      }
    };

    // Add event listeners
    canvas.addEventListener('mousedown', handleStart);
    canvas.addEventListener('mousemove', handleMove);
    canvas.addEventListener('mouseup', handleEnd);
    canvas.addEventListener('touchstart', handleStart);
    canvas.addEventListener('touchmove', handleMove);
    canvas.addEventListener('touchend', handleEnd);

    return {
      startDrawing,
      stopDrawing,
      clear,
      getImageData,
      getPath
    };
  }

  private generateSerialNumber(): string {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }
}

export default DigitalSignatureService;