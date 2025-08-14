import { PDFDocument, PDFTextField, PDFCheckBox, PDFDropdown, PDFRadioGroup, PDFButton, PDFForm, PDFName } from 'pdf-lib';
import { rgb, StandardFonts } from 'pdf-lib';

export interface FormFieldData {
  type: 'text' | 'checkbox' | 'radio' | 'dropdown' | 'signature' | 'date' | 'button' | 'listbox' | 'combobox';
  name: string;
  value?: string | boolean | string[];
  options?: string[];
  required?: boolean;
  readOnly?: boolean;
  multiline?: boolean;
  maxLength?: number;
  fontSize?: number;
  backgroundColor?: { r: number; g: number; b: number };
  borderColor?: { r: number; g: number; b: number };
  textColor?: { r: number; g: number; b: number };
  borderWidth?: number;
  alignment?: 'left' | 'center' | 'right';
  placeholder?: string;
  tooltip?: string;
  validation?: {
    pattern?: string;
    minLength?: number;
    maxLength?: number;
    format?: 'email' | 'phone' | 'number' | 'date' | 'ssn' | 'zipcode';
  };
  x: number;
  y: number;
  width: number;
  height: number;
  page: number;
}

export interface FormValidationResult {
  valid: boolean;
  errors: Array<{
    field: string;
    message: string;
    type: 'required' | 'format' | 'length' | 'pattern';
  }>;
}

export interface FormCalculation {
  field: string;
  formula: string;
  dependsOn: string[];
}

export interface FormAction {
  type: 'submit' | 'reset' | 'calculate' | 'print' | 'javascript';
  url?: string;
  method?: 'GET' | 'POST';
  script?: string;
  fields?: string[];
}

export class FormService {
  /**
   * Create a fillable form field in the PDF
   */
  async addFormField(
    pdfBytes: Uint8Array,
    field: FormFieldData
  ): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const form = pdfDoc.getForm();
    const page = pdfDoc.getPage(field.page);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    switch (field.type) {
      case 'text':
        this.addTextField(form, page, field, font);
        break;
      case 'checkbox':
        this.addCheckbox(form, page, field);
        break;
      case 'radio':
        this.addRadioButton(form, page, field);
        break;
      case 'dropdown':
        this.addDropdown(form, page, field, font);
        break;
      case 'button':
        this.addButton(form, page, field, font);
        break;
      case 'signature':
        this.addSignatureField(form, page, field);
        break;
      case 'date':
        this.addDateField(form, page, field, font);
        break;
    }

    return await pdfDoc.save();
  }

  /**
   * Add a text field to the form
   */
  private addTextField(form: PDFForm, page: any, field: FormFieldData, font: any) {
    const textField = form.createTextField(field.name);
    
    if (field.value && typeof field.value === 'string') {
      textField.setText(field.value);
    }
    
    textField.addToPage(page, {
      x: field.x,
      y: field.y,
      width: field.width,
      height: field.height,
      font: font,
      backgroundColor: field.backgroundColor ? 
        rgb(field.backgroundColor.r, field.backgroundColor.g, field.backgroundColor.b) : undefined,
      borderColor: field.borderColor ?
        rgb(field.borderColor.r, field.borderColor.g, field.borderColor.b) : undefined,
      textColor: field.textColor ?
        rgb(field.textColor.r, field.textColor.g, field.textColor.b) : undefined
    });

    // Note: pdf-lib doesn't support directly setting these properties after creation
    // They must be set on the underlying acroField if needed
    if (field.maxLength) {
      textField.setMaxLength(field.maxLength);
    }
  }

  /**
   * Add a checkbox to the form
   */
  private addCheckbox(form: PDFForm, page: any, field: FormFieldData) {
    const checkbox = form.createCheckBox(field.name);
    
    if (typeof field.value === 'boolean') {
      if (field.value) {
        checkbox.check();
      } else {
        checkbox.uncheck();
      }
    }
    
    checkbox.addToPage(page, {
      x: field.x,
      y: field.y,
      width: field.width,
      height: field.height,
      backgroundColor: field.backgroundColor ?
        rgb(field.backgroundColor.r, field.backgroundColor.g, field.backgroundColor.b) : undefined,
      borderColor: field.borderColor ?
        rgb(field.borderColor.r, field.borderColor.g, field.borderColor.b) : undefined
    });
  }

  /**
   * Add radio buttons to the form
   */
  private addRadioButton(form: PDFForm, page: any, field: FormFieldData) {
    const radioGroup = form.createRadioGroup(field.name);
    
    if (field.options && field.options.length > 0) {
      field.options.forEach((option, index) => {
        radioGroup.addOptionToPage(option, page, {
          x: field.x,
          y: field.y - (index * 25), // Stack vertically
          width: 15,
          height: 15,
          backgroundColor: field.backgroundColor ?
            rgb(field.backgroundColor.r, field.backgroundColor.g, field.backgroundColor.b) : undefined,
          borderColor: field.borderColor ?
            rgb(field.borderColor.r, field.borderColor.g, field.borderColor.b) : undefined
        });
      });
      
      if (field.value && typeof field.value === 'string') {
        radioGroup.select(field.value);
      }
    }
  }

  /**
   * Add a dropdown to the form
   */
  private addDropdown(form: PDFForm, page: any, field: FormFieldData, font: any) {
    const dropdown = form.createDropdown(field.name);
    
    if (field.options && field.options.length > 0) {
      dropdown.setOptions(field.options);
    }
    
    if (field.value) {
      if (Array.isArray(field.value)) {
        dropdown.select(field.value);
      } else if (typeof field.value === 'string') {
        dropdown.select(field.value);
      }
    }
    
    dropdown.addToPage(page, {
      x: field.x,
      y: field.y,
      width: field.width,
      height: field.height,
      font: font,
      backgroundColor: field.backgroundColor ?
        rgb(field.backgroundColor.r, field.backgroundColor.g, field.backgroundColor.b) : undefined,
      borderColor: field.borderColor ?
        rgb(field.borderColor.r, field.borderColor.g, field.borderColor.b) : undefined,
      textColor: field.textColor ?
        rgb(field.textColor.r, field.textColor.g, field.textColor.b) : undefined
    });
  }

  /**
   * Add a button to the form
   */
  private addButton(form: PDFForm, page: any, field: FormFieldData, font: any) {
    const button = form.createButton(field.name);
    
    button.addToPage(page, {
      x: field.x,
      y: field.y,
      width: field.width,
      height: field.height,
      font: font,
      backgroundColor: field.backgroundColor ?
        rgb(field.backgroundColor.r, field.backgroundColor.g, field.backgroundColor.b) : undefined,
      borderColor: field.borderColor ?
        rgb(field.borderColor.r, field.borderColor.g, field.borderColor.b) : undefined,
      textColor: field.textColor ?
        rgb(field.textColor.r, field.textColor.g, field.textColor.b) : undefined
    });
  }

  /**
   * Add a signature field to the form
   */
  private addSignatureField(form: PDFForm, page: any, field: FormFieldData) {
    // Signature fields are essentially text fields with special handling
    const signatureField = form.createTextField(`${field.name}_signature`);
    
    signatureField.addToPage(page, {
      x: field.x,
      y: field.y,
      width: field.width,
      height: field.height,
      borderColor: rgb(0, 0, 0),
      backgroundColor: rgb(0.95, 0.95, 0.95)
    });
    
    // Signature field is editable by default
    
    // Add a label above the signature field
    page.drawText('Sign Here:', {
      x: field.x,
      y: field.y + field.height + 5,
      size: 10,
      color: rgb(0, 0, 0)
    });
  }

  /**
   * Add a date field to the form
   */
  private addDateField(form: PDFForm, page: any, field: FormFieldData, font: any) {
    const dateField = form.createTextField(`${field.name}_date`);
    
    if (field.value && typeof field.value === 'string') {
      dateField.setText(field.value);
    }
    
    dateField.addToPage(page, {
      x: field.x,
      y: field.y,
      width: field.width,
      height: field.height,
      font: font,
      borderColor: rgb(0, 0, 0)
    });
    
    // Add placeholder/format hint
    if (!field.value) {
      dateField.setText('MM/DD/YYYY');
    }
  }

  /**
   * Fill form fields with data
   */
  async fillForm(
    pdfBytes: Uint8Array,
    formData: Record<string, string | boolean | string[]>
  ): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const form = pdfDoc.getForm();

    for (const [fieldName, value] of Object.entries(formData)) {
      try {
        const field = form.getField(fieldName);
        
        if (field instanceof PDFTextField) {
          field.setText(String(value));
        } else if (field instanceof PDFCheckBox) {
          if (value === true || value === 'true' || value === 'on') {
            field.check();
          } else {
            field.uncheck();
          }
        } else if (field instanceof PDFDropdown) {
          if (Array.isArray(value)) {
            field.select(value);
          } else {
            field.select(String(value));
          }
        } else if (field instanceof PDFRadioGroup) {
          field.select(String(value));
        }
      } catch (error) {
        console.warn(`Could not fill field ${fieldName}:`, error);
      }
    }

    return await pdfDoc.save();
  }

  /**
   * Extract form data from PDF
   */
  async extractFormData(pdfBytes: Uint8Array): Promise<Record<string, any>> {
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const form = pdfDoc.getForm();
    const fields = form.getFields();
    const formData: Record<string, any> = {};

    for (const field of fields) {
      const fieldName = field.getName();
      
      if (field instanceof PDFTextField) {
        formData[fieldName] = field.getText() || '';
      } else if (field instanceof PDFCheckBox) {
        formData[fieldName] = field.isChecked();
      } else if (field instanceof PDFDropdown) {
        formData[fieldName] = field.getSelected();
      } else if (field instanceof PDFRadioGroup) {
        formData[fieldName] = field.getSelected();
      }
    }

    return formData;
  }

  /**
   * Get all form fields in the PDF
   */
  async getFormFields(pdfBytes: Uint8Array): Promise<FormFieldData[]> {
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const form = pdfDoc.getForm();
    const fields = form.getFields();
    const formFields: FormFieldData[] = [];

    for (const field of fields) {
      const fieldName = field.getName();
      const widgets = field.acroField.getWidgets();
      
      for (const widget of widgets) {
        const rect = widget.getRectangle();
        const pageRef = widget.P();
        const pages = pdfDoc.getPages();
        let pageIndex = 0;
        
        // Find the page index for this widget
        for (let i = 0; i < pages.length; i++) {
          if (pages[i].ref === pageRef) {
            pageIndex = i;
            break;
          }
        }
        
        let fieldType: FormFieldData['type'] = 'text';
        let value: any = '';
        let options: string[] | undefined;
        
        if (field instanceof PDFTextField) {
          fieldType = 'text';
          value = field.getText() || '';
        } else if (field instanceof PDFCheckBox) {
          fieldType = 'checkbox';
          value = field.isChecked();
        } else if (field instanceof PDFDropdown) {
          fieldType = 'dropdown';
          value = field.getSelected();
          options = field.getOptions();
        } else if (field instanceof PDFRadioGroup) {
          fieldType = 'radio';
          value = field.getSelected();
          options = field.getOptions();
        }
        
        formFields.push({
          type: fieldType,
          name: fieldName,
          value,
          options,
          x: rect.x,
          y: rect.y,
          width: rect.width,
          height: rect.height,
          page: pageIndex,
          required: field.isRequired(),
          readOnly: field.isReadOnly()
        });
      }
    }

    return formFields;
  }

  /**
   * Clear all form fields
   */
  async clearForm(pdfBytes: Uint8Array): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const form = pdfDoc.getForm();
    const fields = form.getFields();

    for (const field of fields) {
      if (field instanceof PDFTextField) {
        field.setText('');
      } else if (field instanceof PDFCheckBox) {
        field.uncheck();
      } else if (field instanceof PDFDropdown) {
        field.clear();
      } else if (field instanceof PDFRadioGroup) {
        field.clear();
      }
    }

    return await pdfDoc.save();
  }

  /**
   * Validate form fields with enhanced validation
   */
  async validateForm(
    pdfBytes: Uint8Array,
    validationRules?: Record<string, FormFieldData['validation']>
  ): Promise<FormValidationResult> {
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const form = pdfDoc.getForm();
    const fields = form.getFields();
    const errors: FormValidationResult['errors'] = [];

    for (const field of fields) {
      const fieldName = field.getName();
      const rules = validationRules?.[fieldName];
      
      if (field.isRequired()) {
        if (field instanceof PDFTextField) {
          const text = field.getText();
          if (!text || text.trim() === '') {
            errors.push({
              field: fieldName,
              message: `Field "${fieldName}" is required`,
              type: 'required'
            });
            continue;
          }
          
          // Additional validation for text fields
          if (rules) {
            // Length validation
            if (rules.minLength && text.length < rules.minLength) {
              errors.push({
                field: fieldName,
                message: `Field "${fieldName}" must be at least ${rules.minLength} characters`,
                type: 'length'
              });
            }
            if (rules.maxLength && text.length > rules.maxLength) {
              errors.push({
                field: fieldName,
                message: `Field "${fieldName}" must not exceed ${rules.maxLength} characters`,
                type: 'length'
              });
            }
            
            // Pattern validation
            if (rules.pattern) {
              const regex = new RegExp(rules.pattern);
              if (!regex.test(text)) {
                errors.push({
                  field: fieldName,
                  message: `Field "${fieldName}" has invalid format`,
                  type: 'pattern'
                });
              }
            }
            
            // Format validation
            if (rules.format) {
              const formatValid = this.validateFormat(text, rules.format);
              if (!formatValid) {
                errors.push({
                  field: fieldName,
                  message: `Field "${fieldName}" has invalid ${rules.format} format`,
                  type: 'format'
                });
              }
            }
          }
        } else if (field instanceof PDFDropdown) {
          const selected = field.getSelected();
          if (!selected || selected.length === 0) {
            errors.push({
              field: fieldName,
              message: `Field "${fieldName}" is required`,
              type: 'required'
            });
          }
        } else if (field instanceof PDFRadioGroup) {
          const selected = field.getSelected();
          if (!selected) {
            errors.push({
              field: fieldName,
              message: `Field "${fieldName}" is required`,
              type: 'required'
            });
          }
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  private validateFormat(value: string, format: string): boolean {
    switch (format) {
      case 'email':
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
      case 'phone':
        return /^[\+]?[(]?[\d\s\-\(\)]{10,}$/.test(value);
      case 'number':
        return /^\d+(\.\d+)?$/.test(value);
      case 'date':
        return !isNaN(Date.parse(value));
      case 'ssn':
        return /^\d{3}-?\d{2}-?\d{4}$/.test(value);
      case 'zipcode':
        return /^\d{5}(-\d{4})?$/.test(value);
      default:
        return true;
    }
  }

  /**
   * Flatten form fields (make them non-editable)
   */
  async flattenForm(pdfBytes: Uint8Array): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const form = pdfDoc.getForm();
    
    // Note: pdf-lib doesn't have a direct flatten method
    // We need to draw the field values as text and remove the form fields
    const pages = pdfDoc.getPages();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fields = form.getFields();
    
    for (const field of fields) {
      const widgets = field.acroField.getWidgets();
      
      for (const widget of widgets) {
        const rect = widget.getRectangle();
        const pageRef = widget.P();
        
        // Find the page for this widget
        let targetPage = null;
        for (const page of pages) {
          if (page.ref === pageRef) {
            targetPage = page;
            break;
          }
        }
        
        if (targetPage) {
          // Draw the field value as text
          if (field instanceof PDFTextField) {
            const text = field.getText();
            if (text) {
              targetPage.drawText(text, {
                x: rect.x + 2,
                y: rect.y + 2,
                size: 12,
                font,
                color: rgb(0, 0, 0)
              });
            }
          } else if (field instanceof PDFCheckBox && field.isChecked()) {
            // Draw a checkmark
            targetPage.drawText('✓', {
              x: rect.x + 2,
              y: rect.y + 2,
              size: 14,
              font,
              color: rgb(0, 0, 0)
            });
          }
        }
      }
    }
    
    // Remove the form
    pdfDoc.catalog.delete(PDFName.of('AcroForm'));
    
    return await pdfDoc.save();
  }

  /**
   * Create form templates for common document types
   */
  async createFormTemplate(
    templateType: 'application' | 'survey' | 'invoice' | 'contract' | 'w4' | 'w9' | 'timesheet',
    options: { pageSize?: [number, number]; margin?: number } = {}
  ): Promise<Uint8Array> {
    const { pageSize = [612, 792], margin = 50 } = options; // Default to US Letter
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage(pageSize);
    const form = pdfDoc.getForm();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    switch (templateType) {
      case 'application':\n        this.createApplicationTemplate(page, form, font, boldFont, margin);\n        break;\n      case 'survey':\n        this.createSurveyTemplate(page, form, font, boldFont, margin);\n        break;\n      case 'invoice':\n        this.createInvoiceTemplate(page, form, font, boldFont, margin);\n        break;\n      case 'contract':\n        this.createContractTemplate(page, form, font, boldFont, margin);\n        break;\n      case 'w4':\n        this.createW4Template(page, form, font, boldFont, margin);\n        break;\n      case 'w9':\n        this.createW9Template(page, form, font, boldFont, margin);\n        break;\n      case 'timesheet':\n        this.createTimesheetTemplate(page, form, font, boldFont, margin);\n        break;\n    }\n\n    return await pdfDoc.save();\n  }\n\n  private createApplicationTemplate(page: any, form: any, font: any, boldFont: any, margin: number) {\n    const { width, height } = page.getSize();\n    let y = height - margin;\n\n    // Title\n    page.drawText('Application Form', {\n      x: width / 2 - 60,\n      y: y,\n      size: 18,\n      font: boldFont\n    });\n    y -= 40;\n\n    // Personal Information Section\n    page.drawText('Personal Information', { x: margin, y: y, size: 14, font: boldFont });\n    y -= 30;\n\n    // First Name\n    const firstNameField = form.createTextField('firstName');\n    firstNameField.addToPage(page, {\n      x: margin,\n      y: y - 20,\n      width: 200,\n      height: 20,\n      borderColor: rgb(0, 0, 0),\n      backgroundColor: rgb(0.95, 0.95, 0.95)\n    });\n    page.drawText('First Name:', { x: margin, y: y, size: 10, font });\n\n    // Last Name\n    const lastNameField = form.createTextField('lastName');\n    lastNameField.addToPage(page, {\n      x: margin + 220,\n      y: y - 20,\n      width: 200,\n      height: 20,\n      borderColor: rgb(0, 0, 0),\n      backgroundColor: rgb(0.95, 0.95, 0.95)\n    });\n    page.drawText('Last Name:', { x: margin + 220, y: y, size: 10, font });\n    y -= 60;\n\n    // Email\n    const emailField = form.createTextField('email');\n    emailField.addToPage(page, {\n      x: margin,\n      y: y - 20,\n      width: 300,\n      height: 20,\n      borderColor: rgb(0, 0, 0),\n      backgroundColor: rgb(0.95, 0.95, 0.95)\n    });\n    page.drawText('Email Address:', { x: margin, y: y, size: 10, font });\n    y -= 60;\n\n    // Phone\n    const phoneField = form.createTextField('phone');\n    phoneField.addToPage(page, {\n      x: margin,\n      y: y - 20,\n      width: 200,\n      height: 20,\n      borderColor: rgb(0, 0, 0),\n      backgroundColor: rgb(0.95, 0.95, 0.95)\n    });\n    page.drawText('Phone Number:', { x: margin, y: y, size: 10, font });\n    y -= 60;\n\n    // Address\n    const addressField = form.createTextField('address');\n    addressField.addToPage(page, {\n      x: margin,\n      y: y - 40,\n      width: 400,\n      height: 40,\n      borderColor: rgb(0, 0, 0),\n      backgroundColor: rgb(0.95, 0.95, 0.95)\n    });\n    page.drawText('Address:', { x: margin, y: y, size: 10, font });\n    y -= 100;\n\n    // Position Applied For\n    const positionField = form.createTextField('position');\n    positionField.addToPage(page, {\n      x: margin,\n      y: y - 20,\n      width: 300,\n      height: 20,\n      borderColor: rgb(0, 0, 0),\n      backgroundColor: rgb(0.95, 0.95, 0.95)\n    });\n    page.drawText('Position Applied For:', { x: margin, y: y, size: 10, font });\n    y -= 60;\n\n    // Employment Status\n    page.drawText('Current Employment Status:', { x: margin, y: y, size: 10, font });\n    const employmentGroup = form.createRadioGroup('employmentStatus');\n    employmentGroup.addOptionToPage('employed', page, {\n      x: margin,\n      y: y - 20,\n      width: 15,\n      height: 15\n    });\n    page.drawText('Employed', { x: margin + 20, y: y - 18, size: 10, font });\n    \n    employmentGroup.addOptionToPage('unemployed', page, {\n      x: margin + 100,\n      y: y - 20,\n      width: 15,\n      height: 15\n    });\n    page.drawText('Unemployed', { x: margin + 120, y: y - 18, size: 10, font });\n    \n    employmentGroup.addOptionToPage('student', page, {\n      x: margin + 220,\n      y: y - 20,\n      width: 15,\n      height: 15\n    });\n    page.drawText('Student', { x: margin + 240, y: y - 18, size: 10, font });\n  }\n\n  private createSurveyTemplate(page: any, form: any, font: any, boldFont: any, margin: number) {\n    const { width, height } = page.getSize();\n    let y = height - margin;\n\n    // Title\n    page.drawText('Customer Satisfaction Survey', {\n      x: width / 2 - 100,\n      y: y,\n      size: 16,\n      font: boldFont\n    });\n    y -= 40;\n\n    // Rating questions\n    const questions = [\n      'How satisfied are you with our service?',\n      'How likely are you to recommend us?',\n      'How would you rate our product quality?'\n    ];\n\n    questions.forEach((question, index) => {\n      page.drawText(question, { x: margin, y: y, size: 12, font });\n      y -= 25;\n\n      const ratingGroup = form.createRadioGroup(`rating_${index}`);\n      const ratings = ['1', '2', '3', '4', '5'];\n      \n      ratings.forEach((rating, rIndex) => {\n        ratingGroup.addOptionToPage(rating, page, {\n          x: margin + (rIndex * 60),\n          y: y - 20,\n          width: 15,\n          height: 15\n        });\n        page.drawText(rating, { x: margin + (rIndex * 60) + 20, y: y - 18, size: 10, font });\n      });\n      \n      y -= 50;\n    });\n\n    // Comments field\n    page.drawText('Additional Comments:', { x: margin, y: y, size: 12, font });\n    y -= 20;\n    const commentsField = form.createTextField('comments');\n    commentsField.addToPage(page, {\n      x: margin,\n      y: y - 80,\n      width: 400,\n      height: 80,\n      borderColor: rgb(0, 0, 0),\n      backgroundColor: rgb(0.95, 0.95, 0.95)\n    });\n  }\n\n  private createInvoiceTemplate(page: any, form: any, font: any, boldFont: any, margin: number) {\n    // Implementation for invoice template\n    const { width, height } = page.getSize();\n    let y = height - margin;\n\n    page.drawText('INVOICE', {\n      x: width / 2 - 30,\n      y: y,\n      size: 20,\n      font: boldFont\n    });\n    y -= 60;\n\n    // Invoice details\n    const invoiceNumberField = form.createTextField('invoiceNumber');\n    invoiceNumberField.addToPage(page, {\n      x: width - 200,\n      y: y - 20,\n      width: 150,\n      height: 20\n    });\n    page.drawText('Invoice #:', { x: width - 200, y: y, size: 10, font });\n  }\n\n  private createContractTemplate(page: any, form: any, font: any, boldFont: any, margin: number) {\n    // Implementation for contract template\n  }\n\n  private createW4Template(page: any, form: any, font: any, boldFont: any, margin: number) {\n    // Implementation for W4 tax form template\n  }\n\n  private createW9Template(page: any, form: any, font: any, boldFont: any, margin: number) {\n    // Implementation for W9 tax form template\n  }\n\n  private createTimesheetTemplate(page: any, form: any, font: any, boldFont: any, margin: number) {\n    // Implementation for timesheet template\n  }\n\n  /**\n   * Add calculations to form fields\n   */\n  async addCalculations(\n    pdfBytes: Uint8Array,\n    calculations: FormCalculation[]\n  ): Promise<Uint8Array> {\n    // This would require JavaScript execution in PDF viewers\n    // For now, we'll return the original PDF\n    // In a full implementation, this would add JavaScript actions to form fields\n    return pdfBytes;\n  }\n\n  /**\n   * Export form data to various formats\n   */\n  async exportFormData(\n    pdfBytes: Uint8Array,\n    format: 'json' | 'xml' | 'csv' | 'fdf'\n  ): Promise<string> {\n    const formData = await this.extractFormData(pdfBytes);\n    \n    switch (format) {\n      case 'json':\n        return JSON.stringify(formData, null, 2);\n      \n      case 'xml':\n        let xml = '<?xml version=\"1.0\" encoding=\"UTF-8\"?>\\n<formData>\\n';\n        for (const [key, value] of Object.entries(formData)) {\n          xml += `  <field name=\"${key}\">${value}</field>\\n`;\n        }\n        xml += '</formData>';\n        return xml;\n      \n      case 'csv':\n        const headers = Object.keys(formData).join(',');\n        const values = Object.values(formData).join(',');\n        return `${headers}\\n${values}`;\n      \n      case 'fdf':\n        // FDF (Forms Data Format) is a PDF-specific format\n        // This is a simplified implementation\n        let fdf = '%FDF-1.2\\n1 0 obj\\n<<\\n/FDF\\n<<\\n/Fields [';\n        for (const [key, value] of Object.entries(formData)) {\n          fdf += `\\n<<\\n/T(${key})\\n/V(${value})\\n>>`;\n        }\n        fdf += '\\n]\\n>>\\n>>\\nendobj\\ntrailer\\n\\n<<\\n/Root 1 0 R\\n>>\\n%%EOF';\n        return fdf;\n      \n      default:\n        return JSON.stringify(formData, null, 2);\n    }\n  }\n\n  /**\n   * Import form data from various formats\n   */\n  async importFormData(\n    pdfBytes: Uint8Array,\n    data: string,\n    format: 'json' | 'xml' | 'csv' | 'fdf'\n  ): Promise<Uint8Array> {\n    let formData: Record<string, any> = {};\n    \n    try {\n      switch (format) {\n        case 'json':\n          formData = JSON.parse(data);\n          break;\n        \n        case 'xml':\n          // Simple XML parsing - in production, use a proper XML parser\n          const fieldMatches = data.matchAll(/<field name=\"([^\"]+)\">([^<]*)<\\/field>/g);\n          for (const match of fieldMatches) {\n            formData[match[1]] = match[2];\n          }\n          break;\n        \n        case 'csv':\n          const lines = data.split('\\n');\n          if (lines.length >= 2) {\n            const headers = lines[0].split(',');\n            const values = lines[1].split(',');\n            headers.forEach((header, index) => {\n              if (values[index] !== undefined) {\n                formData[header.trim()] = values[index].trim();\n              }\n            });\n          }\n          break;\n        \n        case 'fdf':\n          // FDF parsing - simplified implementation\n          const fdfMatches = data.matchAll(/\\/T\\(([^)]+)\\)\\/V\\(([^)]*)\\)/g);\n          for (const match of fdfMatches) {\n            formData[match[1]] = match[2];\n          }\n          break;\n      }\n    } catch (error) {\n      throw new Error(`Failed to parse ${format.toUpperCase()} data: ${error.message}`);\n    }\n    \n    return await this.fillForm(pdfBytes, formData);\n  }\n}

// Re-export for easy importing
export default FormService;
