import { PDFDocument, PDFForm, PDFTextField, PDFCheckBox, PDFRadioGroup, PDFDropdown, PDFButton, rgb, StandardFonts, PDFFont, PDFPage } from 'pdf-lib';

export interface FormField {
  id: string;
  name: string;
  type: 'text' | 'multiline' | 'password' | 'number' | 'email' | 'phone' | 'date' | 'checkbox' | 'radio' | 'dropdown' | 'listbox' | 'button' | 'signature' | 'barcode';
  x: number;
  y: number;
  width: number;
  height: number;
  pageIndex: number;
  
  // Common properties
  required?: boolean;
  readOnly?: boolean;
  visible?: boolean;
  tooltip?: string;
  tabOrder?: number;
  
  // Text field specific
  defaultValue?: string;
  placeholder?: string;
  maxLength?: number;
  multiline?: boolean;
  password?: boolean;
  richText?: boolean;
  
  // Validation
  validation?: {
    pattern?: RegExp;
    customValidator?: (value: string) => { valid: boolean; message?: string };
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    required?: boolean;
  };
  
  // Formatting
  format?: {
    type?: 'none' | 'number' | 'percent' | 'date' | 'time' | 'special';
    mask?: string;
    decimalPlaces?: number;
    currency?: string;
    dateFormat?: string;
    timeFormat?: string;
  };
  
  // Choice fields (dropdown, radio, checkbox)
  options?: Array<{
    value: string;
    label: string;
    selected?: boolean;
  }>;
  
  // Appearance
  appearance?: {
    fontSize?: number;
    fontFamily?: string;
    fontColor?: { r: number; g: number; b: number };
    backgroundColor?: { r: number; g: number; b: number };
    borderColor?: { r: number; g: number; b: number };
    borderWidth?: number;
    borderStyle?: 'solid' | 'dashed' | 'beveled' | 'inset' | 'underline';
    alignment?: 'left' | 'center' | 'right' | 'justify';
  };
  
  // Calculation and scripting
  calculation?: {
    formula?: string;
    dependencies?: string[];
    recalculateOnChange?: boolean;
  };
  
  // Actions
  actions?: {
    onFocus?: string;
    onBlur?: string;
    onChange?: string;
    onClick?: string;
    onKeyPress?: string;
    onValidate?: string;
  };
}

export interface FormTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  fields: FormField[];
  metadata: {
    created: Date;
    modified: Date;
    author: string;
    version: string;
  };
  settings: {
    submitUrl?: string;
    submitMethod?: 'POST' | 'GET' | 'EMAIL';
    submitFormat?: 'FDF' | 'XFDF' | 'PDF' | 'HTML' | 'XML';
    resetAfterSubmit?: boolean;
    showRequiredFieldsOnly?: boolean;
    highlightRequiredFields?: boolean;
  };
}

export interface FormValidationResult {
  valid: boolean;
  errors: Array<{
    fieldId: string;
    fieldName: string;
    message: string;
    type: 'required' | 'format' | 'range' | 'custom';
  }>;
  warnings: Array<{
    fieldId: string;
    fieldName: string;
    message: string;
  }>;
}

export interface FormSubmission {
  id: string;
  timestamp: Date;
  data: { [fieldName: string]: any };
  validation: FormValidationResult;
  metadata: {
    userAgent?: string;
    ipAddress?: string;
    sessionId?: string;
  };
}

export class AdvancedFormBuilderService {
  private templates: Map<string, FormTemplate> = new Map();
  private submissions: Map<string, FormSubmission[]> = new Map();
  private calculationEngine: CalculationEngine;

  constructor() {
    this.calculationEngine = new CalculationEngine();
    this.initializeBuiltinTemplates();
  }

  /**
   * Create a new form field
   */
  createField(
    type: FormField['type'],
    x: number,
    y: number,
    width: number,
    height: number,
    pageIndex: number,
    options: Partial<FormField> = {}
  ): FormField {
    const id = this.generateFieldId();
    
    return {
      id,
      name: options.name || `field_${id}`,
      type,
      x,
      y,
      width,
      height,
      pageIndex,
      required: false,
      readOnly: false,
      visible: true,
      appearance: {
        fontSize: 12,
        fontFamily: 'Helvetica',
        fontColor: { r: 0, g: 0, b: 0 },
        backgroundColor: { r: 1, g: 1, b: 1 },
        borderColor: { r: 0.5, g: 0.5, b: 0.5 },
        borderWidth: 1,
        borderStyle: 'solid',
        alignment: 'left'
      },
      ...options
    };
  }

  private forms: Map<string, { id: string; fields: Map<string, FormField> }> = new Map();

  /**
   * Create a new form
   */
  createForm(templateId?: string): Promise<{ formId: string; fields: FormField[] }> {
    const formId = this.generateFormId();
    const fields = new Map<string, FormField>();
    
    this.forms.set(formId, { id: formId, fields });
    
    return Promise.resolve({
      formId,
      fields: Array.from(fields.values())
    });
  }

  /**
   * Add a field to an existing form
   */
  addField(formId: string, fieldType: FormField['type'], options: Partial<FormField> = {}): FormField {
    const form = this.forms.get(formId);
    if (!form) {
      throw new Error(`Form with ID ${formId} not found`);
    }

    const field = this.createField(
      fieldType,
      options.x || 0,
      options.y || 0,
      options.width || 100,
      options.height || 30,
      options.pageIndex || 0,
      options
    );

    form.fields.set(field.id, field);
    return field;
  }

  /**
   * Get all fields for a form
   */
  getFormFields(formId: string): FormField[] {
    const form = this.forms.get(formId);
    return form ? Array.from(form.fields.values()) : [];
  }

  /**
   * Update a field in a form
   */
  updateField(formId: string, fieldId: string, updates: Partial<FormField>): FormField | null {
    const form = this.forms.get(formId);
    if (!form) return null;

    const field = form.fields.get(fieldId);
    if (!field) return null;

    const updatedField = { ...field, ...updates };
    form.fields.set(fieldId, updatedField);
    return updatedField;
  }

  /**
   * Delete a field from a form
   */
  deleteField(formId: string, fieldId: string): boolean {
    const form = this.forms.get(formId);
    if (!form) return false;

    return form.fields.delete(fieldId);
  }

  /**
   * Validate form data
   */
  validateFormData(formData: Record<string, any>, fields: FormField[]): { valid: boolean; errors: Record<string, string> } {
    const errors: Record<string, string> = {};
    let valid = true;

    for (const field of fields) {
      const value = formData[field.id];
      
      if (field.required && (!value || value.toString().trim() === '')) {
        errors[field.id] = 'This field is required';
        valid = false;
      }

      if (field.validation && value) {
        if (field.validation.pattern && !field.validation.pattern.test(value.toString())) {
          errors[field.id] = 'Invalid format';
          valid = false;
        }

        if (field.validation.minLength && value.toString().length < field.validation.minLength) {
          errors[field.id] = `Minimum length is ${field.validation.minLength}`;
          valid = false;
        }

        if (field.validation.maxLength && value.toString().length > field.validation.maxLength) {
          errors[field.id] = `Maximum length is ${field.validation.maxLength}`;
          valid = false;
        }
      }
    }

    return { valid, errors };
  }

  /**
   * Generate submission data
   */
  generateSubmissionData(formId: string, formData: Record<string, any>): any {
    return {
      formId,
      submissionId: `submission_${Date.now()}`,
      timestamp: new Date(),
      data: formData
    };
  }

  /**
   * Export form to PDF
   */
  exportToPDF(formId: string): Promise<Uint8Array> {
    // Basic implementation - returns empty PDF for now
    return PDFDocument.create().then(doc => doc.save());
  }

  /**
   * Auto-arrange fields
   */
  autoArrangeFields(formId: string, layout: 'single-column' | 'two-column' | 'grid'): void {
    const form = this.forms.get(formId);
    if (!form) return;

    const fields = Array.from(form.fields.values());
    let y = 50;
    const spacing = 40;

    fields.forEach((field, index) => {
      field.x = 50;
      field.y = y;
      y += spacing;
      form.fields.set(field.id, field);
    });
  }

  private generateFormId(): string {
    return `form_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Add form fields to existing PDF
   */
  async addFormFieldsToPDF(
    pdfBytes: Uint8Array,
    fields: FormField[]
  ): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const form = pdfDoc.getForm();
    const pages = pdfDoc.getPages();
    
    // Group fields by type for batch processing
    const fieldsByType = this.groupFieldsByType(fields);
    
    for (const [type, typeFields] of fieldsByType) {
      await this.addFieldsOfType(form, pages, type, typeFields);
    }
    
    // Enable form features
    pdfDoc.getForm().updateFieldAppearances();
    
    return await pdfDoc.save();
  }

  /**
   * Create form from template
   */
  async createFormFromTemplate(
    templateId: string,
    pdfBytes?: Uint8Array
  ): Promise<{ pdfBytes: Uint8Array; template: FormTemplate }> {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    let pdfDoc: PDFDocument;
    if (pdfBytes) {
      pdfDoc = await PDFDocument.load(pdfBytes);
    } else {
      // Create new PDF with appropriate size
      pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([612, 792]); // Standard letter size
    }

    const formBytes = await this.addFormFieldsToPDF(
      await pdfDoc.save(),
      template.fields
    );

    return {
      pdfBytes: formBytes,
      template
    };
  }

  /**
   * Extract form data from PDF
   */
  async extractFormData(pdfBytes: Uint8Array): Promise<{ [fieldName: string]: any }> {
    try {
      const pdfDoc = await PDFDocument.load(pdfBytes);
      const form = pdfDoc.getForm();
      const fields = form.getFields();
      
      const data: { [fieldName: string]: any } = {};
      
      for (const field of fields) {
        const fieldName = field.getName();
        
        if (field instanceof PDFTextField) {
          data[fieldName] = field.getText();
        } else if (field instanceof PDFCheckBox) {
          data[fieldName] = field.isChecked();
        } else if (field instanceof PDFRadioGroup) {
          data[fieldName] = field.getSelected();
        } else if (field instanceof PDFDropdown) {
          data[fieldName] = field.getSelected();
        }
      }
      
      return data;
    } catch (error) {
      console.error('Error extracting form data:', error);
      return {};
    }
  }

  /**
   * Validate form data
   */
  validateFormData(
    data: { [fieldName: string]: any },
    fields: FormField[]
  ): FormValidationResult {
    const errors: FormValidationResult['errors'] = [];
    const warnings: FormValidationResult['warnings'] = [];

    for (const field of fields) {
      const value = data[field.name];
      const validation = field.validation;

      // Required field validation
      if (field.required && this.isEmpty(value)) {
        errors.push({
          fieldId: field.id,
          fieldName: field.name,
          message: `${field.name} is required`,
          type: 'required'
        });
        continue;
      }

      // Skip validation for empty non-required fields
      if (this.isEmpty(value) && !field.required) continue;

      // Pattern validation
      if (validation?.pattern && !validation.pattern.test(String(value))) {
        errors.push({
          fieldId: field.id,
          fieldName: field.name,
          message: `${field.name} format is invalid`,
          type: 'format'
        });
      }

      // Length validation
      if (validation?.minLength && String(value).length < validation.minLength) {
        errors.push({
          fieldId: field.id,
          fieldName: field.name,
          message: `${field.name} must be at least ${validation.minLength} characters`,
          type: 'format'
        });
      }

      if (validation?.maxLength && String(value).length > validation.maxLength) {
        errors.push({
          fieldId: field.id,
          fieldName: field.name,
          message: `${field.name} must be no more than ${validation.maxLength} characters`,
          type: 'format'
        });
      }

      // Range validation for numbers
      if (field.type === 'number' && typeof value === 'number') {
        if (validation?.min !== undefined && value < validation.min) {
          errors.push({
            fieldId: field.id,
            fieldName: field.name,
            message: `${field.name} must be at least ${validation.min}`,
            type: 'range'
          });
        }

        if (validation?.max !== undefined && value > validation.max) {
          errors.push({
            fieldId: field.id,
            fieldName: field.name,
            message: `${field.name} must be no more than ${validation.max}`,
            type: 'range'
          });
        }
      }

      // Custom validation
      if (validation?.customValidator) {
        const result = validation.customValidator(String(value));
        if (!result.valid) {
          errors.push({
            fieldId: field.id,
            fieldName: field.name,
            message: result.message || 'Invalid value',
            type: 'custom'
          });
        }
      }

      // Type-specific validation
      if (field.type === 'email' && !this.isValidEmail(String(value))) {
        errors.push({
          fieldId: field.id,
          fieldName: field.name,
          message: 'Please enter a valid email address',
          type: 'format'
        });
      }

      if (field.type === 'phone' && !this.isValidPhone(String(value))) {
        warnings.push({
          fieldId: field.id,
          fieldName: field.name,
          message: 'Phone number format may be invalid'
        });
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Calculate field values based on formulas
   */
  calculateFieldValues(
    data: { [fieldName: string]: any },
    fields: FormField[]
  ): { [fieldName: string]: any } {
    const calculatedData = { ...data };
    const fieldsWithCalculations = fields.filter(f => f.calculation?.formula);

    // Sort by dependency order to ensure correct calculation sequence
    const sortedFields = this.sortFieldsByDependencies(fieldsWithCalculations);

    for (const field of sortedFields) {
      if (field.calculation?.formula) {
        try {
          const result = this.calculationEngine.evaluate(
            field.calculation.formula,
            calculatedData
          );
          calculatedData[field.name] = result;
        } catch (error) {
          console.warn(`Calculation error for field ${field.name}:`, error);
        }
      }
    }

    return calculatedData;
  }

  /**
   * Save form template
   */
  saveTemplate(template: FormTemplate): void {
    template.metadata.modified = new Date();
    this.templates.set(template.id, template);
  }

  /**
   * Load form template
   */
  getTemplate(templateId: string): FormTemplate | undefined {
    return this.templates.get(templateId);
  }

  /**
   * Get all templates by category
   */
  getTemplatesByCategory(category?: string): FormTemplate[] {
    const templates = Array.from(this.templates.values());
    if (category) {
      return templates.filter(t => t.category === category);
    }
    return templates;
  }

  /**
   * Generate form preview
   */
  async generateFormPreview(fields: FormField[]): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([612, 792]);
    
    // Add title
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    page.drawText('Form Preview', {
      x: 50,
      y: 750,
      size: 18,
      font,
      color: rgb(0, 0, 0)
    });

    // Add form fields with visual representation
    for (const field of fields) {
      await this.drawFieldPreview(page, field, font);
    }

    return await pdfDoc.save();
  }

  /**
   * Import form fields from FDF/XFDF
   */
  async importFromFDF(fdfData: string): Promise<FormField[]> {
    // Parse FDF/XFDF and convert to FormField objects
    // This is a simplified implementation
    const fields: FormField[] = [];
    
    try {
      // Parse FDF format (simplified)
      const fieldMatches = fdfData.match(/<field name="([^"]+)">[\s\S]*?<value>([^<]+)<\/value>[\s\S]*?<\/field>/g);
      
      if (fieldMatches) {
        let index = 0;
        for (const match of fieldMatches) {
          const nameMatch = match.match(/name="([^"]+)"/);
          const valueMatch = match.match(/<value>([^<]+)<\/value>/);
          
          if (nameMatch) {
            const field = this.createField(
              'text',
              50,
              700 - (index * 40),
              200,
              25,
              0,
              {
                name: nameMatch[1],
                defaultValue: valueMatch ? valueMatch[1] : ''
              }
            );
            fields.push(field);
            index++;
          }
        }
      }
    } catch (error) {
      console.error('Error importing FDF:', error);
    }

    return fields;
  }

  /**
   * Export form fields to FDF/XFDF
   */
  exportToFDF(fields: FormField[], data: { [fieldName: string]: any }): string {
    let fdf = `%FDF-1.2\n`;
    fdf += `1 0 obj\n<<\n/FDF << /Fields [\n`;

    for (const field of fields) {
      const value = data[field.name] || field.defaultValue || '';
      fdf += `<< /T (${field.name}) /V (${value}) >>\n`;
    }

    fdf += `] >>\n>>\nendobj\ntrailer\n<<\n/Root 1 0 R\n>>\n%%EOF\n`;

    return fdf;
  }

  // Private helper methods

  private generateFieldId(): string {
    return `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private groupFieldsByType(fields: FormField[]): Map<FormField['type'], FormField[]> {
    const groups = new Map<FormField['type'], FormField[]>();
    
    for (const field of fields) {
      if (!groups.has(field.type)) {
        groups.set(field.type, []);
      }
      groups.get(field.type)!.push(field);
    }
    
    return groups;
  }

  private async addFieldsOfType(
    form: PDFForm,
    pages: PDFPage[],
    type: FormField['type'],
    fields: FormField[]
  ): Promise<void> {
    for (const field of fields) {
      if (field.pageIndex >= pages.length) continue;
      
      const page = pages[field.pageIndex];
      
      switch (type) {
        case 'text':
        case 'multiline':
        case 'password':
        case 'number':
        case 'email':
        case 'phone':
        case 'date':
          await this.addTextField(form, page, field);
          break;
          
        case 'checkbox':
          await this.addCheckBox(form, page, field);
          break;
          
        case 'radio':
          await this.addRadioGroup(form, page, field);
          break;
          
        case 'dropdown':
        case 'listbox':
          await this.addDropdown(form, page, field);
          break;
          
        case 'button':
          await this.addButton(form, page, field);
          break;
          
        case 'signature':
          await this.addSignatureField(form, page, field);
          break;
      }
    }
  }

  private async addTextField(form: PDFForm, page: PDFPage, field: FormField): Promise<void> {
    const textField = form.createTextField(field.name);
    
    textField.setText(field.defaultValue || '');
    
    if (field.maxLength) {
      textField.setMaxLength(field.maxLength);
    }
    
    if (field.multiline || field.type === 'multiline') {
      textField.enableMultiline();
    }
    
    if (field.password || field.type === 'password') {
      textField.enablePassword();
    }
    
    if (field.readOnly) {
      textField.enableReadOnly();
    }
    
    textField.addToPage(page, {
      x: field.x,
      y: page.getHeight() - field.y - field.height,
      width: field.width,
      height: field.height,
      borderColor: field.appearance?.borderColor ? 
        rgb(field.appearance.borderColor.r, field.appearance.borderColor.g, field.appearance.borderColor.b) :
        rgb(0.5, 0.5, 0.5),
      borderWidth: field.appearance?.borderWidth || 1,
      backgroundColor: field.appearance?.backgroundColor ?
        rgb(field.appearance.backgroundColor.r, field.appearance.backgroundColor.g, field.appearance.backgroundColor.b) :
        rgb(1, 1, 1)
    });
  }

  private async addCheckBox(form: PDFForm, page: PDFPage, field: FormField): Promise<void> {
    const checkbox = form.createCheckBox(field.name);
    
    if (field.defaultValue === 'true' || field.defaultValue === true) {
      checkbox.check();
    }
    
    if (field.readOnly) {
      checkbox.enableReadOnly();
    }
    
    checkbox.addToPage(page, {
      x: field.x,
      y: page.getHeight() - field.y - field.height,
      width: field.width,
      height: field.height,
      borderColor: field.appearance?.borderColor ? 
        rgb(field.appearance.borderColor.r, field.appearance.borderColor.g, field.appearance.borderColor.b) :
        rgb(0.5, 0.5, 0.5),
      borderWidth: field.appearance?.borderWidth || 1
    });
  }

  private async addRadioGroup(form: PDFForm, page: PDFPage, field: FormField): Promise<void> {
    const radioGroup = form.createRadioGroup(field.name);
    
    if (field.options) {
      let yOffset = 0;
      for (const option of field.options) {
        radioGroup.addOptionToPage(option.value, page, {
          x: field.x,
          y: page.getHeight() - field.y - field.height - yOffset,
          width: 15,
          height: 15
        });
        
        // Add option label
        page.drawText(option.label, {
          x: field.x + 20,
          y: page.getHeight() - field.y - field.height - yOffset + 3,
          size: field.appearance?.fontSize || 12
        });
        
        yOffset += 20;
      }
      
      if (field.defaultValue) {
        radioGroup.select(field.defaultValue);
      }
    }
    
    if (field.readOnly) {
      radioGroup.enableReadOnly();
    }
  }

  private async addDropdown(form: PDFForm, page: PDFPage, field: FormField): Promise<void> {
    const dropdown = form.createDropdown(field.name);
    
    if (field.options) {
      dropdown.setOptions(field.options.map(opt => opt.value));
      
      if (field.defaultValue) {
        dropdown.select(field.defaultValue);
      }
    }
    
    if (field.readOnly) {
      dropdown.enableReadOnly();
    }
    
    dropdown.addToPage(page, {
      x: field.x,
      y: page.getHeight() - field.y - field.height,
      width: field.width,
      height: field.height,
      borderColor: field.appearance?.borderColor ? 
        rgb(field.appearance.borderColor.r, field.appearance.borderColor.g, field.appearance.borderColor.b) :
        rgb(0.5, 0.5, 0.5),
      borderWidth: field.appearance?.borderWidth || 1,
      backgroundColor: field.appearance?.backgroundColor ?
        rgb(field.appearance.backgroundColor.r, field.appearance.backgroundColor.g, field.appearance.backgroundColor.b) :
        rgb(1, 1, 1)
    });
  }

  private async addButton(form: PDFForm, page: PDFPage, field: FormField): Promise<void> {
    const button = form.createButton(field.name);
    
    button.addToPage(page, {
      x: field.x,
      y: page.getHeight() - field.y - field.height,
      width: field.width,
      height: field.height,
      borderColor: field.appearance?.borderColor ? 
        rgb(field.appearance.borderColor.r, field.appearance.borderColor.g, field.appearance.borderColor.b) :
        rgb(0.5, 0.5, 0.5),
      borderWidth: field.appearance?.borderWidth || 1,
      backgroundColor: field.appearance?.backgroundColor ?
        rgb(field.appearance.backgroundColor.r, field.appearance.backgroundColor.g, field.appearance.backgroundColor.b) :
        rgb(0.9, 0.9, 0.9)
    });
  }

  private async addSignatureField(form: PDFForm, page: PDFPage, field: FormField): Promise<void> {
    // Signature fields are typically text fields with special appearance
    const sigField = form.createTextField(field.name);
    
    sigField.addToPage(page, {
      x: field.x,
      y: page.getHeight() - field.y - field.height,
      width: field.width,
      height: field.height,
      borderColor: rgb(0, 0, 0),
      borderWidth: 2,
      backgroundColor: rgb(0.98, 0.98, 0.98)
    });
    
    // Add signature placeholder text
    page.drawText('Digital Signature', {
      x: field.x + 5,
      y: page.getHeight() - field.y - field.height / 2,
      size: 10,
      color: rgb(0.5, 0.5, 0.5)
    });
  }

  private async drawFieldPreview(page: PDFPage, field: FormField, font: PDFFont): Promise<void> {
    // Draw field rectangle
    page.drawRectangle({
      x: field.x,
      y: page.getHeight() - field.y - field.height,
      width: field.width,
      height: field.height,
      borderColor: rgb(0.7, 0.7, 0.7),
      borderWidth: 1,
      color: rgb(0.95, 0.95, 0.95)
    });
    
    // Draw field label
    page.drawText(`${field.name} (${field.type})`, {
      x: field.x,
      y: page.getHeight() - field.y + 5,
      size: 8,
      font,
      color: rgb(0.3, 0.3, 0.3)
    });
    
    // Draw required indicator
    if (field.required) {
      page.drawText('*', {
        x: field.x + field.width - 10,
        y: page.getHeight() - field.y + 5,
        size: 12,
        font,
        color: rgb(1, 0, 0)
      });
    }
  }

  private isEmpty(value: any): boolean {
    return value === null || value === undefined || value === '';
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private isValidPhone(phone: string): boolean {
    const phoneRegex = /^\+?[\d\s\-\(\)]+$/;
    return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
  }

  private sortFieldsByDependencies(fields: FormField[]): FormField[] {
    // Simple topological sort for calculation dependencies
    const sorted: FormField[] = [];
    const visited = new Set<string>();
    
    const visit = (field: FormField) => {
      if (visited.has(field.id)) return;
      
      // Visit dependencies first
      if (field.calculation?.dependencies) {
        for (const depName of field.calculation.dependencies) {
          const depField = fields.find(f => f.name === depName);
          if (depField && !visited.has(depField.id)) {
            visit(depField);
          }
        }
      }
      
      visited.add(field.id);
      sorted.push(field);
    };
    
    for (const field of fields) {
      visit(field);
    }
    
    return sorted;
  }

  private initializeBuiltinTemplates(): void {
    // Initialize some common form templates
    const contactFormTemplate: FormTemplate = {
      id: 'contact-form',
      name: 'Contact Form',
      description: 'Basic contact information form',
      category: 'Business',
      fields: [
        this.createField('text', 50, 100, 200, 25, 0, { name: 'firstName', required: true }),
        this.createField('text', 300, 100, 200, 25, 0, { name: 'lastName', required: true }),
        this.createField('email', 50, 140, 450, 25, 0, { name: 'email', required: true }),
        this.createField('phone', 50, 180, 200, 25, 0, { name: 'phone' }),
        this.createField('multiline', 50, 220, 450, 100, 0, { name: 'message' })
      ],
      metadata: {
        created: new Date(),
        modified: new Date(),
        author: 'System',
        version: '1.0'
      },
      settings: {
        submitFormat: 'PDF',
        highlightRequiredFields: true
      }
    };
    
    this.templates.set(contactFormTemplate.id, contactFormTemplate);
    
    // Add more built-in templates as needed
  }
}

/**
 * Simple calculation engine for form field calculations
 */
class CalculationEngine {
  evaluate(formula: string, data: { [key: string]: any }): any {
    try {
      // Replace field references with actual values
      let expression = formula;
      
      // Simple variable substitution
      for (const [key, value] of Object.entries(data)) {
        const regex = new RegExp(`\\b${key}\\b`, 'g');
        expression = expression.replace(regex, String(value || 0));
      }
      
      // Basic mathematical operations (in a real implementation, use a proper expression parser)
      // This is a simplified version for demonstration
      const result = this.safeEvaluate(expression);
      return result;
    } catch (error) {
      console.error('Calculation error:', error);
      return 0;
    }
  }
  
  private safeEvaluate(expression: string): number {
    // Remove any non-mathematical characters for safety
    const sanitized = expression.replace(/[^0-9+\-*/().\s]/g, '');
    
    try {
      // Use Function constructor instead of eval for better safety
      return new Function(`return ${sanitized}`)();
    } catch {
      return 0;
    }
  }
}

export default AdvancedFormBuilderService;
