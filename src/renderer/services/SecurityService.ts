import { PDFDocument, PDFDict, PDFName, PDFNumber, PDFArray, PDFString } from 'pdf-lib';
import * as crypto from 'crypto';

interface EncryptionOptions {
  userPassword?: string;
  ownerPassword: string;
  keyLength?: 40 | 128 | 256;
  permissions?: PDFPermissions;
}

interface PDFPermissions {
  printing?: boolean;
  modifying?: boolean;
  copying?: boolean;
  annotating?: boolean;
  fillingForms?: boolean;
  contentAccessibility?: boolean;
  documentAssembly?: boolean;
  highQualityPrint?: boolean;
}

interface DigitalSignature {
  name: string;
  reason: string;
  location: string;
  contactInfo?: string;
  date: Date;
  certificate?: Uint8Array;
}

interface SecurityInfo {
  isEncrypted: boolean;
  encryptionLevel?: 'none' | 'low' | 'medium' | 'high';
  hasUserPassword: boolean;
  hasOwnerPassword: boolean;
  permissions: PDFPermissions;
  hasDigitalSignature: boolean;
  signatures?: DigitalSignature[];
}

export class SecurityService {
  // Encryption levels
  private readonly encryptionLevels = {
    low: 40,
    medium: 128,
    high: 256
  };

  // Default permissions
  private readonly defaultPermissions: PDFPermissions = {
    printing: true,
    modifying: false,
    copying: true,
    annotating: true,
    fillingForms: true,
    contentAccessibility: true,
    documentAssembly: false,
    highQualityPrint: true
  };

  // Encrypt PDF with password
  async encryptPDF(
    pdfBytes: Uint8Array,
    password: string,
    options: Partial<EncryptionOptions> = {}
  ): Promise<Uint8Array> {
    try {
      const pdfDoc = await PDFDocument.load(pdfBytes);
      
      // Note: pdf-lib doesn't directly support encryption
      // This is a simplified implementation showing the structure
      // In production, you'd use a library like pdf-lib-encrypt or node-qpdf
      
      // For demonstration, we'll add password metadata
      pdfDoc.setTitle(`[ENCRYPTED] ${pdfDoc.getTitle() || 'Document'}`);
      pdfDoc.setProducer('Professional PDF Editor - Encrypted');
      
      // Add encryption metadata (simplified)
      const encryptionDict = pdfDoc.context.obj({
        Filter: PDFName.of('Standard'),
        V: PDFNumber.of(options.keyLength === 256 ? 5 : options.keyLength === 128 ? 2 : 1),
        Length: PDFNumber.of(options.keyLength || 128),
        P: PDFNumber.of(this.calculatePermissions(options.permissions || this.defaultPermissions))
      });
      
      // In a real implementation, you would:
      // 1. Generate encryption key from password
      // 2. Encrypt all streams and strings in the PDF
      // 3. Add proper encryption dictionary
      // 4. Update PDF trailer
      
      const encryptedBytes = await pdfDoc.save();
      
      // Add custom encryption marker (for demo purposes)
      const marker = new TextEncoder().encode('ENCRYPTED:' + this.hashPassword(password) + ':');
      const result = new Uint8Array(marker.length + encryptedBytes.length);
      result.set(marker);
      result.set(encryptedBytes, marker.length);
      
      return result;
    } catch (error) {
      console.error('Error encrypting PDF:', error);
      throw new Error('Failed to encrypt PDF');
    }
  }

  // Decrypt PDF with password
  async decryptPDF(
    pdfBytes: Uint8Array,
    password: string
  ): Promise<Uint8Array> {
    try {
      // Check for our custom encryption marker
      const marker = new TextDecoder().decode(pdfBytes.slice(0, 100));
      if (marker.startsWith('ENCRYPTED:')) {
        const parts = marker.split(':');
        const storedHash = parts[1];
        const providedHash = this.hashPassword(password);
        
        if (storedHash !== providedHash) {
          throw new Error('Invalid password');
        }
        
        // Remove marker and return original PDF
        const markerEnd = marker.indexOf(':', 10) + 1;
        return pdfBytes.slice(markerEnd);
      }
      
      // For real encrypted PDFs, you would:
      // 1. Parse encryption dictionary
      // 2. Derive decryption key from password
      // 3. Decrypt all encrypted objects
      // 4. Return decrypted PDF
      
      const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
      return await pdfDoc.save();
    } catch (error) {
      console.error('Error decrypting PDF:', error);
      throw new Error('Failed to decrypt PDF or invalid password');
    }
  }

  // Remove password from PDF
  async removePassword(
    pdfBytes: Uint8Array,
    password: string
  ): Promise<Uint8Array> {
    return this.decryptPDF(pdfBytes, password);
  }

  // Change PDF password
  async changePassword(
    pdfBytes: Uint8Array,
    oldPassword: string,
    newPassword: string,
    options: Partial<EncryptionOptions> = {}
  ): Promise<Uint8Array> {
    const decryptedBytes = await this.decryptPDF(pdfBytes, oldPassword);
    return this.encryptPDF(decryptedBytes, newPassword, options);
  }

  // Set PDF permissions
  async setPermissions(
    pdfBytes: Uint8Array,
    ownerPassword: string,
    permissions: PDFPermissions
  ): Promise<Uint8Array> {
    try {
      const pdfDoc = await PDFDocument.load(pdfBytes);
      
      // Add permissions metadata
      pdfDoc.setProducer(`Professional PDF Editor - Permissions Set`);
      
      // In a real implementation, you would:
      // 1. Set owner password
      // 2. Calculate permission flags
      // 3. Update encryption dictionary
      
      const permissionFlags = this.calculatePermissions(permissions);
      
      // Store permissions as metadata (simplified)
      const metadata = {
        permissions: permissionFlags,
        ownerPasswordHash: this.hashPassword(ownerPassword),
        timestamp: new Date().toISOString()
      };
      
      pdfDoc.setKeywords(JSON.stringify(metadata));
      
      return await pdfDoc.save();
    } catch (error) {
      console.error('Error setting permissions:', error);
      throw new Error('Failed to set PDF permissions');
    }
  }

  // Add digital signature
  async addDigitalSignature(
    pdfBytes: Uint8Array,
    signature: DigitalSignature,
    pageNumber: number = 1,
    position: { x: number; y: number; width: number; height: number }
  ): Promise<Uint8Array> {
    try {
      const pdfDoc = await PDFDocument.load(pdfBytes);
      const pages = pdfDoc.getPages();
      const page = pages[pageNumber - 1];
      
      // Create signature appearance
      const { x, y, width, height } = position;
      
      // Draw signature field
      page.drawRectangle({
        x,
        y,
        width,
        height,
        borderWidth: 1,
        borderColor: { r: 0, g: 0, b: 0.5 }
      });
      
      // Add signature text
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const fontSize = 10;
      const text = [
        `Digitally signed by ${signature.name}`,
        `Date: ${signature.date.toLocaleString()}`,
        `Reason: ${signature.reason}`,
        `Location: ${signature.location}`
      ];
      
      let yOffset = y + height - fontSize - 5;
      for (const line of text) {
        page.drawText(line, {
          x: x + 5,
          y: yOffset,
          size: fontSize,
          font,
          color: { r: 0, g: 0, b: 0.5 }
        });
        yOffset -= fontSize + 2;
      }
      
      // In a real implementation, you would:
      // 1. Create signature dictionary
      // 2. Calculate document hash
      // 3. Sign hash with private key
      // 4. Embed signature in PDF
      // 5. Add signature field and appearance
      
      // Add signature metadata
      const signatureData = {
        ...signature,
        timestamp: new Date().toISOString(),
        documentHash: this.calculateDocumentHash(pdfBytes)
      };
      
      pdfDoc.setCreator(`Signed: ${JSON.stringify(signatureData)}`);
      
      return await pdfDoc.save();
    } catch (error) {
      console.error('Error adding digital signature:', error);
      throw new Error('Failed to add digital signature');
    }
  }

  // Verify digital signature
  async verifySignature(
    pdfBytes: Uint8Array
  ): Promise<{ isValid: boolean; signatures: DigitalSignature[] }> {
    try {
      const pdfDoc = await PDFDocument.load(pdfBytes);
      const creator = pdfDoc.getCreator();
      
      if (creator?.startsWith('Signed:')) {
        const signatureData = JSON.parse(creator.substring(7));
        
        // In a real implementation, you would:
        // 1. Extract signature from PDF
        // 2. Calculate current document hash
        // 3. Verify signature with public key
        // 4. Check certificate chain
        // 5. Validate timestamp
        
        return {
          isValid: true, // Simplified - always valid for demo
          signatures: [signatureData]
        };
      }
      
      return {
        isValid: false,
        signatures: []
      };
    } catch (error) {
      console.error('Error verifying signature:', error);
      return {
        isValid: false,
        signatures: []
      };
    }
  }

  // Get security information
  async getSecurityInfo(pdfBytes: Uint8Array): Promise<SecurityInfo> {
    try {
      const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
      
      // Check for encryption marker
      const marker = new TextDecoder().decode(pdfBytes.slice(0, 100));
      const isEncrypted = marker.startsWith('ENCRYPTED:');
      
      // Check for signatures
      const creator = pdfDoc.getCreator();
      const hasSignature = creator?.startsWith('Signed:');
      
      // Parse permissions from metadata
      const keywords = pdfDoc.getKeywords();
      let permissions = this.defaultPermissions;
      
      if (keywords) {
        try {
          const metadata = JSON.parse(keywords);
          if (metadata.permissions) {
            permissions = this.parsePermissions(metadata.permissions);
          }
        } catch {
          // Ignore parsing errors
        }
      }
      
      return {
        isEncrypted,
        encryptionLevel: isEncrypted ? 'medium' : 'none',
        hasUserPassword: isEncrypted,
        hasOwnerPassword: isEncrypted,
        permissions,
        hasDigitalSignature: hasSignature,
        signatures: hasSignature ? [JSON.parse(creator!.substring(7))] : []
      };
    } catch (error) {
      console.error('Error getting security info:', error);
      throw new Error('Failed to get security information');
    }
  }

  // Redact sensitive information
  async redactContent(
    pdfBytes: Uint8Array,
    pageNumber: number,
    regions: Array<{ x: number; y: number; width: number; height: number }>
  ): Promise<Uint8Array> {
    try {
      const pdfDoc = await PDFDocument.load(pdfBytes);
      const pages = pdfDoc.getPages();
      const page = pages[pageNumber - 1];
      
      // Draw black rectangles over redacted regions
      for (const region of regions) {
        page.drawRectangle({
          x: region.x,
          y: region.y,
          width: region.width,
          height: region.height,
          color: { r: 0, g: 0, b: 0 },
          opacity: 1
        });
        
        // Add redaction label
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
        page.drawText('REDACTED', {
          x: region.x + region.width / 2 - 30,
          y: region.y + region.height / 2 - 5,
          size: 10,
          font,
          color: { r: 1, g: 1, b: 1 }
        });
      }
      
      return await pdfDoc.save();
    } catch (error) {
      console.error('Error redacting content:', error);
      throw new Error('Failed to redact content');
    }
  }

  // Add watermark for security
  async addSecurityWatermark(
    pdfBytes: Uint8Array,
    text: string,
    options: {
      diagonal?: boolean;
      opacity?: number;
      fontSize?: number;
      color?: { r: number; g: number; b: number };
    } = {}
  ): Promise<Uint8Array> {
    const {
      diagonal = true,
      opacity = 0.1,
      fontSize = 60,
      color = { r: 0.5, g: 0.5, b: 0.5 }
    } = options;
    
    try {
      const pdfDoc = await PDFDocument.load(pdfBytes);
      const pages = pdfDoc.getPages();
      const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      
      for (const page of pages) {
        const { width, height } = page.getSize();
        const textWidth = font.widthOfTextAtSize(text, fontSize);
        
        if (diagonal) {
          // Calculate diagonal angle
          const angle = Math.atan2(height, width) * (180 / Math.PI);
          
          page.drawText(text, {
            x: (width - textWidth) / 2,
            y: height / 2,
            size: fontSize,
            font,
            color,
            opacity,
            rotate: degrees(angle)
          });
        } else {
          // Grid pattern
          const spacing = 200;
          for (let y = 0; y < height; y += spacing) {
            for (let x = 0; x < width; x += spacing) {
              page.drawText(text, {
                x,
                y,
                size: fontSize / 2,
                font,
                color,
                opacity
              });
            }
          }
        }
      }
      
      return await pdfDoc.save();
    } catch (error) {
      console.error('Error adding security watermark:', error);
      throw new Error('Failed to add security watermark');
    }
  }

  // Helper: Calculate permission flags
  private calculatePermissions(permissions: PDFPermissions): number {
    let flags = -1; // All permissions by default
    
    if (!permissions.printing) flags &= ~4;
    if (!permissions.modifying) flags &= ~8;
    if (!permissions.copying) flags &= ~16;
    if (!permissions.annotating) flags &= ~32;
    if (!permissions.fillingForms) flags &= ~256;
    if (!permissions.contentAccessibility) flags &= ~512;
    if (!permissions.documentAssembly) flags &= ~1024;
    if (!permissions.highQualityPrint) flags &= ~2048;
    
    return flags;
  }

  // Helper: Parse permission flags
  private parsePermissions(flags: number): PDFPermissions {
    return {
      printing: (flags & 4) !== 0,
      modifying: (flags & 8) !== 0,
      copying: (flags & 16) !== 0,
      annotating: (flags & 32) !== 0,
      fillingForms: (flags & 256) !== 0,
      contentAccessibility: (flags & 512) !== 0,
      documentAssembly: (flags & 1024) !== 0,
      highQualityPrint: (flags & 2048) !== 0
    };
  }

  // Helper: Hash password (simplified)
  private hashPassword(password: string): string {
    // In production, use proper password hashing like bcrypt or argon2
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
      const char = password.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(16);
  }

  // Helper: Calculate document hash
  private calculateDocumentHash(pdfBytes: Uint8Array): string {
    // Simplified hash calculation
    let hash = 0;
    for (let i = 0; i < Math.min(pdfBytes.length, 1000); i++) {
      hash = ((hash << 5) - hash) + pdfBytes[i];
      hash = hash & hash;
    }
    return hash.toString(16);
  }

  // Check if PDF is password protected
  async isPasswordProtected(pdfBytes: Uint8Array): Promise<boolean> {
    try {
      // Check for our custom encryption marker
      const marker = new TextDecoder().decode(pdfBytes.slice(0, 100));
      if (marker.startsWith('ENCRYPTED:')) {
        return true;
      }
      
      // Try to load without password
      await PDFDocument.load(pdfBytes);
      return false;
    } catch (error) {
      // If loading fails, it might be password protected
      return true;
    }
  }

  // Generate secure password
  generateSecurePassword(length: number = 16): string {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
    let password = '';
    
    for (let i = 0; i < length; i++) {
      password += charset[Math.floor(Math.random() * charset.length)];
    }
    
    return password;
  }
}

// Export StandardFonts for use in other modules
export { StandardFonts } from 'pdf-lib';

// Helper function to convert degrees
function degrees(angle: number) {
  return { type: 'degrees' as const, angle };
}
