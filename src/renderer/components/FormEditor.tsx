import React, { useState, useRef, useEffect } from 'react';
import { PDFDocument, PDFForm, PDFTextField, PDFCheckBox, PDFRadioGroup, PDFDropdown, rgb, StandardFonts } from 'pdf-lib';
import { toast } from 'react-toastify';
import './FormEditor.css';

interface FormField {
  id: string;
  type: 'text' | 'checkbox' | 'radio' | 'dropdown' | 'button' | 'signature';
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  pageIndex: number;
  properties: FormFieldProperties;
}

interface FormFieldProperties {
  label?: string;
  placeholder?: string;
  defaultValue?: string;
  required?: boolean;
  readOnly?: boolean;
  multiline?: boolean;
  fontSize?: number;
  fontColor?: string;
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  alignment?: 'left' | 'center' | 'right';
  options?: string[];
  tooltip?: string;
}

interface FormEditorProps {
  pdfBytes?: Uint8Array;
  currentPage: number;
  zoom: number;
  onFormUpdate: (formFields: FormField[]) => void;
  onFormSave: (pdfWithForms: Uint8Array) => void;
  onClose: () => void;
}

const FormEditor: React.FC<FormEditorProps> = ({
  pdfBytes,
  currentPage,
  zoom,
  onFormUpdate,
  onFormSave,
  onClose
}) => {
  const [formFields, setFormFields] = useState<FormField[]>([]);
  const [selectedTool, setSelectedTool] = useState<string>('select');
  const [selectedField, setSelectedField] = useState<FormField | null>(null);
  const [isDrawingField, setIsDrawingField] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [showProperties, setShowProperties] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  const tools = [
    { id: 'select', icon: 'fa-mouse-pointer', name: 'Select', tooltip: 'Select and edit form fields' },
    { id: 'text', icon: 'fa-font', name: 'Text Field', tooltip: 'Create text input field' },
    { id: 'checkbox', icon: 'fa-check-square', name: 'Checkbox', tooltip: 'Create checkbox field' },
    { id: 'radio', icon: 'fa-dot-circle', name: 'Radio Button', tooltip: 'Create radio button group' },
    { id: 'dropdown', icon: 'fa-caret-down', name: 'Dropdown', tooltip: 'Create dropdown list' },
    { id: 'button', icon: 'fa-hand-pointer', name: 'Button', tooltip: 'Create action button' },
    { id: 'signature', icon: 'fa-signature', name: 'Signature', tooltip: 'Create signature field' }
  ];

  // Initialize form editor
  useEffect(() => {
    if (pdfBytes) {
      loadExistingForms();
    }
  }, [pdfBytes]);

  // Load existing form fields from PDF
  const loadExistingForms = async () => {
    if (!pdfBytes) return;

    try {
      const pdfDoc = await PDFDocument.load(pdfBytes);
      const form = pdfDoc.getForm();
      const fields = form.getFields();
      
      const loadedFields: FormField[] = [];
      
      fields.forEach((field, index) => {
        const fieldName = field.getName();
        const widgets = field.acroField.getWidgets();
        
        if (widgets.length > 0) {
          const widget = widgets[0];
          const rect = widget.getRectangle();
          const pageRef = widget.P();
          
          // Find page index
          let pageIndex = 0;
          const pages = pdfDoc.getPages();
          for (let i = 0; i < pages.length; i++) {
            if (pages[i].ref === pageRef) {
              pageIndex = i;
              break;
            }
          }

          let fieldType: FormField['type'] = 'text';
          let properties: FormFieldProperties = {
            fontSize: 12,
            fontColor: '#000000',
            backgroundColor: '#ffffff',
            borderColor: '#000000',
            borderWidth: 1
          };

          if (field instanceof PDFTextField) {
            fieldType = 'text';
            properties.defaultValue = field.getText() || '';
            properties.multiline = field.isMultiline();
            properties.readOnly = field.isReadOnly();
          } else if (field instanceof PDFCheckBox) {
            fieldType = 'checkbox';
            properties.defaultValue = field.isChecked() ? 'true' : 'false';
          } else if (field instanceof PDFRadioGroup) {
            fieldType = 'radio';
            properties.options = field.getOptions();
            properties.defaultValue = field.getSelected() || '';
          } else if (field instanceof PDFDropdown) {
            fieldType = 'dropdown';
            properties.options = field.getOptions();
            properties.defaultValue = field.getSelected()?.toString() || '';
          }

          loadedFields.push({
            id: `field_${index}`,
            type: fieldType,
            name: fieldName,
            x: rect.x,
            y: rect.y,
            width: rect.width,
            height: rect.height,
            pageIndex,
            properties
          });
        }
      });

      setFormFields(loadedFields);
      onFormUpdate(loadedFields);
      
      if (loadedFields.length > 0) {
        toast.success(`Loaded ${loadedFields.length} existing form fields`);
      }
    } catch (error) {
      console.error('Error loading existing forms:', error);
      toast.error('Failed to load existing form fields');
    }
  };

  // Handle mouse events for field creation
  const handleMouseDown = (e: React.MouseEvent) => {
    if (selectedTool === 'select') return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = (e.clientX - rect.left) / (zoom / 100);
    const y = (e.clientY - rect.top) / (zoom / 100);

    setIsDrawingField(true);
    setStartPos({ x, y });
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (!isDrawingField || selectedTool === 'select') return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const currentX = (e.clientX - rect.left) / (zoom / 100);
    const currentY = (e.clientY - rect.top) / (zoom / 100);

    const width = Math.abs(currentX - startPos.x);
    const height = Math.abs(currentY - startPos.y);

    // Minimum field size
    if (width < 20 || height < 10) {
      setIsDrawingField(false);
      return;
    }

    const newField: FormField = {
      id: `field_${Date.now()}`,
      type: selectedTool as FormField['type'],
      name: `${selectedTool}_${formFields.length + 1}`,
      x: Math.min(startPos.x, currentX),
      y: Math.min(startPos.y, currentY),
      width,
      height,
      pageIndex: currentPage - 1,
      properties: getDefaultProperties(selectedTool as FormField['type'])
    };

    const updatedFields = [...formFields, newField];
    setFormFields(updatedFields);
    onFormUpdate(updatedFields);
    setIsDrawingField(false);
    setSelectedField(newField);
    setShowProperties(true);

    toast.success(`${selectedTool} field created`);
  };

  // Get default properties for field type
  const getDefaultProperties = (type: FormField['type']): FormFieldProperties => {
    const baseProperties: FormFieldProperties = {
      fontSize: 12,
      fontColor: '#000000',
      backgroundColor: '#ffffff',
      borderColor: '#000000',
      borderWidth: 1,
      alignment: 'left'
    };

    switch (type) {
      case 'text':
        return {
          ...baseProperties,
          placeholder: 'Enter text...',
          multiline: false
        };
      case 'checkbox':
        return {
          ...baseProperties,
          label: 'Checkbox',
          defaultValue: 'false'
        };
      case 'radio':
        return {
          ...baseProperties,
          options: ['Option 1', 'Option 2', 'Option 3'],
          defaultValue: 'Option 1'
        };
      case 'dropdown':
        return {
          ...baseProperties,
          options: ['Select...', 'Option 1', 'Option 2', 'Option 3'],
          defaultValue: 'Select...'
        };
      case 'button':
        return {
          ...baseProperties,
          label: 'Button',
          backgroundColor: '#007bff',
          fontColor: '#ffffff'
        };
      case 'signature':
        return {
          ...baseProperties,
          label: 'Signature',
          backgroundColor: '#f8f9fa',
          borderColor: '#6c757d'
        };
      default:
        return baseProperties;
    }
  };

  // Update field properties
  const updateFieldProperties = (fieldId: string, properties: Partial<FormFieldProperties>) => {
    const updatedFields = formFields.map(field =>
      field.id === fieldId
        ? { ...field, properties: { ...field.properties, ...properties } }
        : field
    );
    setFormFields(updatedFields);
    onFormUpdate(updatedFields);
  };

  // Delete field
  const deleteField = (fieldId: string) => {
    const updatedFields = formFields.filter(field => field.id !== fieldId);
    setFormFields(updatedFields);
    onFormUpdate(updatedFields);
    setSelectedField(null);
    toast.success('Field deleted');
  };

  // Save form to PDF
  const saveFormToPDF = async () => {
    if (!pdfBytes) {
      toast.error('No PDF loaded');
      return;
    }

    try {
      const pdfDoc = await PDFDocument.load(pdfBytes);
      const form = pdfDoc.getForm();

      // Clear existing form fields
      const existingFields = form.getFields();
      existingFields.forEach(field => {
        try {
          form.removeField(field);
        } catch (error) {
          console.warn('Could not remove field:', field.getName());
        }
      });

      // Add new form fields
      const pages = pdfDoc.getPages();
      
      for (const field of formFields) {
        const page = pages[field.pageIndex];
        if (!page) continue;

        switch (field.type) {
          case 'text':
            const textField = form.createTextField(field.name);
            textField.addToPage(page, {
              x: field.x,
              y: page.getHeight() - field.y - field.height,
              width: field.width,
              height: field.height,
              textColor: rgb(0, 0, 0),
              backgroundColor: rgb(1, 1, 1),
              borderColor: rgb(0, 0, 0),
              borderWidth: field.properties.borderWidth || 1
            });
            
            if (field.properties.defaultValue) {
              textField.setText(field.properties.defaultValue);
            }
            break;

          case 'checkbox':
            const checkBox = form.createCheckBox(field.name);
            checkBox.addToPage(page, {
              x: field.x,
              y: page.getHeight() - field.y - field.height,
              width: field.width,
              height: field.height,
              borderColor: rgb(0, 0, 0),
              borderWidth: field.properties.borderWidth || 1
            });
            
            if (field.properties.defaultValue === 'true') {
              checkBox.check();
            }
            break;

          case 'dropdown':
            if (field.properties.options && field.properties.options.length > 0) {
              const dropdown = form.createDropdown(field.name);
              dropdown.addOptions(field.properties.options);
              dropdown.addToPage(page, {
                x: field.x,
                y: page.getHeight() - field.y - field.height,
                width: field.width,
                height: field.height,
                borderColor: rgb(0, 0, 0),
                borderWidth: field.properties.borderWidth || 1
              });
              
              if (field.properties.defaultValue && field.properties.options.includes(field.properties.defaultValue)) {
                dropdown.select(field.properties.defaultValue);
              }
            }
            break;

          case 'signature':
            const sigField = form.createTextField(`${field.name}_signature`);
            sigField.addToPage(page, {
              x: field.x,
              y: page.getHeight() - field.y - field.height,
              width: field.width,
              height: field.height,
              borderColor: rgb(0.4, 0.4, 0.4),
              backgroundColor: rgb(0.98, 0.98, 0.98),
              borderWidth: field.properties.borderWidth || 1
            });
            sigField.setText('Signature Required');
            break;
        }
      }

      const pdfWithForms = await pdfDoc.save();
      onFormSave(pdfWithForms);
      
      toast.success('Form saved to PDF successfully');
    } catch (error) {
      console.error('Error saving form to PDF:', error);
      toast.error('Failed to save form to PDF');
    }
  };

  return (
    <div className="form-editor">
      <div className="form-editor-header">
        <div className="form-editor-tools">
          {tools.map(tool => (
            <button
              key={tool.id}
              className={`form-tool ${selectedTool === tool.id ? 'active' : ''}`}
              onClick={() => setSelectedTool(tool.id)}
              title={tool.tooltip}
            >
              <i className={`fas ${tool.icon}`}></i>
            </button>
          ))}
        </div>
        
        <div className="form-editor-actions">
          <button onClick={loadExistingForms} title="Reload existing forms">
            <i className="fas fa-sync-alt"></i>
          </button>
          <button onClick={saveFormToPDF} title="Save form to PDF">
            <i className="fas fa-save"></i>
          </button>
          <button onClick={onClose} title="Close form editor">
            <i className="fas fa-times"></i>
          </button>
        </div>
      </div>

      <div className="form-editor-workspace">
        <div className="form-canvas-container">
          <canvas
            ref={canvasRef}
            className="form-canvas"
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
          />
          
          <div
            ref={overlayRef}
            className="form-overlay"
            style={{ transform: `scale(${zoom / 100})` }}
          >
            {formFields
              .filter(field => field.pageIndex === currentPage - 1)
              .map(field => (
                <div
                  key={field.id}
                  className={`form-field ${selectedField?.id === field.id ? 'selected' : ''}`}
                  style={{
                    left: field.x,
                    top: field.y,
                    width: field.width,
                    height: field.height,
                    borderColor: field.properties.borderColor || '#000000',
                    borderWidth: field.properties.borderWidth || 1,
                    backgroundColor: field.properties.backgroundColor || '#ffffff'
                  }}
                  onClick={() => {
                    setSelectedField(field);
                    setShowProperties(true);
                  }}
                >
                  <div className="form-field-content">
                    {field.type === 'text' && (
                      <input
                        type="text"
                        placeholder={field.properties.placeholder}
                        defaultValue={field.properties.defaultValue}
                        style={{ fontSize: field.properties.fontSize }}
                        readOnly
                      />
                    )}
                    {field.type === 'checkbox' && (
                      <input
                        type="checkbox"
                        defaultChecked={field.properties.defaultValue === 'true'}
                        readOnly
                      />
                    )}
                    {field.type === 'dropdown' && (
                      <select defaultValue={field.properties.defaultValue}>
                        {field.properties.options?.map(option => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    )}
                    {field.type === 'button' && (
                      <button>{field.properties.label || 'Button'}</button>
                    )}
                    {field.type === 'signature' && (
                      <div className="signature-field">
                        {field.properties.label || 'Signature'}
                      </div>
                    )}
                  </div>
                  
                  <div className="form-field-controls">
                    <button onClick={() => deleteField(field.id)} title="Delete">
                      <i className="fas fa-trash"></i>
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {showProperties && selectedField && (
          <div className="form-properties-panel">
            <div className="properties-header">
              <h3>Field Properties</h3>
              <button onClick={() => setShowProperties(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className="properties-content">
              <div className="property-group">
                <label>Field Name:</label>
                <input
                  type="text"
                  value={selectedField.name}
                  onChange={(e) => {
                    const updatedField = { ...selectedField, name: e.target.value };
                    setSelectedField(updatedField);
                    const updatedFields = formFields.map(f => f.id === selectedField.id ? updatedField : f);
                    setFormFields(updatedFields);
                    onFormUpdate(updatedFields);
                  }}
                />
              </div>

              <div className="property-group">
                <label>Label:</label>
                <input
                  type="text"
                  value={selectedField.properties.label || ''}
                  onChange={(e) => updateFieldProperties(selectedField.id, { label: e.target.value })}
                />
              </div>

              {selectedField.type === 'text' && (
                <div className="property-group">
                  <label>Placeholder:</label>
                  <input
                    type="text"
                    value={selectedField.properties.placeholder || ''}
                    onChange={(e) => updateFieldProperties(selectedField.id, { placeholder: e.target.value })}
                  />
                </div>
              )}

              {(selectedField.type === 'dropdown' || selectedField.type === 'radio') && (
                <div className="property-group">
                  <label>Options (one per line):</label>
                  <textarea
                    value={selectedField.properties.options?.join('\n') || ''}
                    onChange={(e) => {
                      const options = e.target.value.split('\n').filter(o => o.trim());
                      updateFieldProperties(selectedField.id, { options });
                    }}
                    rows={5}
                  />
                </div>
              )}

              <div className="property-group">
                <label>Default Value:</label>
                <input
                  type="text"
                  value={selectedField.properties.defaultValue || ''}
                  onChange={(e) => updateFieldProperties(selectedField.id, { defaultValue: e.target.value })}
                />
              </div>

              <div className="property-group">
                <label>
                  <input
                    type="checkbox"
                    checked={selectedField.properties.required || false}
                    onChange={(e) => updateFieldProperties(selectedField.id, { required: e.target.checked })}
                  />
                  Required
                </label>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="form-editor-status">
        <span>{formFields.length} fields on page {currentPage}</span>
        {selectedField && <span>Selected: {selectedField.name} ({selectedField.type})</span>}
      </div>
    </div>
  );
};

export default FormEditor;
