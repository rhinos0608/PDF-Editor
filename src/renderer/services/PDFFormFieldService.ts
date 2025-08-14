import * as pdfjsLib from 'pdfjs-dist';

export interface FormField {
  id: string;
  name: string;
  type: 'text' | 'checkbox' | 'radio' | 'dropdown' | 'signature' | 'button';
  pageIndex: number;
  x: number;
  y: number;
  width: number;
  height: number;
  value?: string;
  required?: boolean;
  readOnly?: boolean;
}

export interface NavigationTarget {
  id: string;
  name: string;
  type: 'signature' | 'form' | 'bookmark';
  pageIndex: number;
  x: number;
  y: number;
  description?: string;
}

export class PDFFormFieldService {
  
  /**
   * Extracts all form fields from a PDF document
   */
  async extractFormFields(pdfBytes: Uint8Array): Promise<FormField[]> {
    console.log('🔍 Extracting form fields from PDF...');
    
    try {
      const loadingTask = pdfjsLib.getDocument({
        data: pdfBytes,
        useWorkerFetch: false,
        isEvalSupported: false
      });
      const pdfDoc = await loadingTask.promise;
      const formFields: FormField[] = [];

      for (let pageIndex = 0; pageIndex < pdfDoc.numPages; pageIndex++) {
        try {
          const page = await pdfDoc.getPage(pageIndex + 1);
          const annotations = await page.getAnnotations();
          
          for (const annotation of annotations) {
            if (this.isFormField(annotation)) {
              const field = this.createFormField(annotation, pageIndex);
              if (field) {
                formFields.push(field);
              }
            }
          }
        } catch (pageError) {
          console.warn(`⚠️ Error processing page ${pageIndex + 1} for form fields:`, pageError);
          continue;
        }
      }

      console.log(`✅ Found ${formFields.length} form fields`);
      return formFields;
    } catch (error) {
      console.error('❌ Error extracting form fields:', error);
      return [];
    }
  }

  /**
   * Gets navigation targets for quick jumping (signatures, form fields, bookmarks)
   */
  async getNavigationTargets(pdfBytes: Uint8Array): Promise<NavigationTarget[]> {
    console.log('🎯 Getting navigation targets...');
    
    try {
      const loadingTask = pdfjsLib.getDocument({
        data: pdfBytes,
        useWorkerFetch: false,
        isEvalSupported: false
      });
      const pdfDoc = await loadingTask.promise;
      const targets: NavigationTarget[] = [];

      // Extract form fields and signatures
      const formFields = await this.extractFormFields(pdfBytes);
      for (const field of formFields) {
        targets.push({
          id: field.id,
          name: field.name || `${field.type} field`,
          type: field.type === 'signature' ? 'signature' : 'form',
          pageIndex: field.pageIndex,
          x: field.x,
          y: field.y,
          description: `${field.type.charAt(0).toUpperCase() + field.type.slice(1)} field on page ${field.pageIndex + 1}`
        });
      }

      // Extract bookmarks/outline
      try {
        const outline = await pdfDoc.getOutline();
        if (outline) {
          await this.processOutlineItems(outline, targets, pdfDoc);
        }
      } catch (outlineError) {
        console.warn('⚠️ Could not extract outline/bookmarks:', outlineError);
      }

      console.log(`✅ Found ${targets.length} navigation targets`);
      return targets;
    } catch (error) {
      console.error('❌ Error getting navigation targets:', error);
      return [];
    }
  }

  /**
   * Finds signature fields specifically
   */
  async findSignatureFields(pdfBytes: Uint8Array): Promise<FormField[]> {
    const allFields = await this.extractFormFields(pdfBytes);
    return allFields.filter(field => field.type === 'signature');
  }

  /**
   * Searches for form fields by name or type
   */
  searchFormFields(fields: FormField[], query: string): FormField[] {
    const lowercaseQuery = query.toLowerCase();
    return fields.filter(field => 
      field.name?.toLowerCase().includes(lowercaseQuery) ||
      field.type.toLowerCase().includes(lowercaseQuery) ||
      field.value?.toLowerCase().includes(lowercaseQuery)
    );
  }

  /**
   * Gets the next unfilled required field
   */
  getNextRequiredField(fields: FormField[]): FormField | null {
    return fields.find(field => 
      field.required && 
      (!field.value || field.value.trim() === '')
    ) || null;
  }

  private isFormField(annotation: any): boolean {
    // Check for various form field types based on PDF.js annotation structure
    return annotation.subtype === 'Widget' || 
           annotation.fieldType || 
           annotation.fieldName ||
           (annotation.subtype === 'FreeText' && annotation.intent === 'FreeTextCallout');
  }

  private createFormField(annotation: any, pageIndex: number): FormField | null {
    try {
      const fieldType = this.getFieldType(annotation);
      if (!fieldType) return null;

      // Extract coordinates - PDF.js provides rect as [x1, y1, x2, y2]
      const rect = annotation.rect || [0, 0, 0, 0];
      const x = Math.min(rect[0], rect[2]);
      const y = Math.min(rect[1], rect[3]);
      const width = Math.abs(rect[2] - rect[0]);
      const height = Math.abs(rect[3] - rect[1]);

      return {
        id: `field_${pageIndex}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        name: annotation.fieldName || annotation.contents || `${fieldType}_field`,
        type: fieldType,
        pageIndex,
        x,
        y,
        width,
        height,
        value: annotation.fieldValue || annotation.contents || '',
        required: annotation.required || false,
        readOnly: annotation.readOnly || false
      };
    } catch (error) {
      console.warn('⚠️ Error creating form field:', error);
      return null;
    }
  }

  private getFieldType(annotation: any): FormField['type'] | null {
    // Map PDF.js annotation types to our form field types
    if (annotation.fieldType) {
      switch (annotation.fieldType.toLowerCase()) {
        case 'tx':
        case 'text':
          return 'text';
        case 'btn':
        case 'button':
          return annotation.checkBox ? 'checkbox' : 'button';
        case 'ch':
        case 'choice':
          return 'dropdown';
        case 'sig':
        case 'signature':
          return 'signature';
        default:
          return 'text';
      }
    }

    // Fallback detection based on annotation properties
    if (annotation.checkBox) return 'checkbox';
    if (annotation.radioButton) return 'radio';
    if (annotation.combo) return 'dropdown';
    if (annotation.subtype === 'Widget' && annotation.fieldName?.toLowerCase().includes('sign')) {
      return 'signature';
    }

    // Default to text field
    return 'text';
  }

  private async processOutlineItems(
    outlineItems: any[], 
    targets: NavigationTarget[], 
    pdfDoc: any
  ): Promise<void> {
    for (let i = 0; i < outlineItems.length; i++) {
      const item = outlineItems[i];
      
      try {
        if (item.dest) {
          // Try to resolve destination to page number and coordinates
          let destArray = item.dest;
          if (typeof item.dest === 'string') {
            try {
              destArray = await pdfDoc.getDestination(item.dest);
            } catch (destError) {
              console.warn('Could not resolve destination:', item.dest);
              continue;
            }
          }

          if (destArray && destArray.length > 0) {
            let pageIndex = 0;
            let x = 0;
            let y = 0;

            try {
              // Get page reference and convert to page index
              const pageRef = destArray[0];
              pageIndex = await pdfDoc.getPageIndex(pageRef);
              
              // Extract coordinates if available
              if (destArray.length > 2) {
                x = destArray[2] || 0;
                y = destArray[3] || 0;
              }
            } catch (pageError) {
              console.warn('Could not resolve page for bookmark:', item.title);
              continue;
            }

            targets.push({
              id: `bookmark_${i}`,
              name: item.title || `Bookmark ${i + 1}`,
              type: 'bookmark',
              pageIndex,
              x,
              y,
              description: `Bookmark: ${item.title} (Page ${pageIndex + 1})`
            });
          }
        }

        // Process nested items recursively
        if (item.items && item.items.length > 0) {
          await this.processOutlineItems(item.items, targets, pdfDoc);
        }
      } catch (itemError) {
        console.warn('Error processing outline item:', itemError);
        continue;
      }
    }
  }
}