import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Plus,
  Type,
  CheckSquare,
  Circle as RadioButton,
  List,
  Calendar,
  Mail,
  Hash,
  PenTool,
  MousePointer,
  Save,
  Download,
  Upload,
  Trash2,
  Copy,
  Settings,
  Eye,
  Grid,
  Layers,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  Underline,
  Palette,
  Move,
  RotateCcw,
  Play,
  Zap
} from 'lucide-react';
import AdvancedFormBuilderService, { FormField, FormTemplate, ValidationRule } from '../services/AdvancedFormBuilderService';
import AdobeLevelFormBuilder from '../services/AdobeLevelFormBuilder';
import './FormBuilder.css';

interface FormBuilderProps {
  pdfBytes: Uint8Array | null;
  isVisible: boolean;
  onClose: () => void;
  onFormCreated: (pdfBytes: Uint8Array) => void;
}

interface FieldPosition {
  x: number;
  y: number;
  width: number;
  height: number;
  page: number;
}

interface DragState {
  isDragging: boolean;
  dragType: 'move' | 'resize' | null;
  startX: number;
  startY: number;
  startPosition: FieldPosition | null;
  resizeHandle: string | null;
}

const FormBuilder: React.FC<FormBuilderProps> = ({
  pdfBytes,
  isVisible,
  onClose,
  onFormCreated
}) => {
  const [formBuilderService] = useState(() => new AdvancedFormBuilderService());
  const [adobeFormBuilder] = useState(() => new AdobeLevelFormBuilder());
  const [currentFormId, setCurrentFormId] = useState<string | null>(null);
  const [fields, setFields] = useState<FormField[]>([]);
  const [selectedField, setSelectedField] = useState<FormField | null>(null);
  const [templates, setTemplates] = useState<FormTemplate[]>([]);
  const [activeTab, setActiveTab] = useState<'design' | 'fields' | 'properties' | 'preview' | 'templates'>('design');
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    dragType: null,
    startX: 0,
    startY: 0,
    startPosition: null,
    resizeHandle: null
  });
  const [zoom, setZoom] = useState(1.0);
  const [gridSize, setGridSize] = useState(10);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [formData, setFormData] = useState<{ [fieldName: string]: any }>({});
  const [validationErrors, setValidationErrors] = useState<any>({});

  const canvasRef = useRef<HTMLDivElement>(null);
  const propertyPanelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isVisible) {
      loadTemplates();
      createNewForm();
    }
  }, [isVisible]);

  const loadTemplates = useCallback(() => {
    // Load both standard and Adobe-style professional templates
    const standardTemplates = formBuilderService.getTemplatesByCategory();
    const adobeTemplates = adobeFormBuilder.getAdobeStyleTemplates();
    const allTemplates = [...standardTemplates, ...adobeTemplates];
    setTemplates(allTemplates);
  }, [formBuilderService, adobeFormBuilder]);

  const createNewForm = useCallback(async () => {
    const { formId, fields } = await formBuilderService.createForm();
    setCurrentFormId(formId);
    setFields(fields);
    setSelectedField(null);
    setFormData({});
  }, [formBuilderService]);

  const addField = useCallback((fieldType: FormField['type'], position?: { x: number; y: number }) => {
    if (!currentFormId) return;

    const canvasRect = canvasRef.current?.getBoundingClientRect();
    const defaultPosition = position || {
      x: canvasRect ? canvasRect.width / 2 - 100 : 100,
      y: canvasRect ? canvasRect.height / 2 - 15 : 100
    };

    // Snap to grid if enabled
    const snapX = snapToGrid ? Math.round(defaultPosition.x / gridSize) * gridSize : defaultPosition.x;
    const snapY = snapToGrid ? Math.round(defaultPosition.y / gridSize) * gridSize : defaultPosition.y;

    const newField = formBuilderService.addField(currentFormId, fieldType, {
      x: snapX,
      y: snapY,
      page: 1
    });

    const updatedFields = formBuilderService.getFormFields(currentFormId);
    setFields(updatedFields);
    setSelectedField(newField);
  }, [currentFormId, formBuilderService, snapToGrid, gridSize]);

  const updateField = useCallback((fieldId: string, updates: Partial<FormField>) => {
    if (!currentFormId) return;

    try {
      const updatedField = formBuilderService.updateField(currentFormId, fieldId, updates);
      const updatedFields = formBuilderService.getFormFields(currentFormId);
      setFields(updatedFields);
      
      if (selectedField?.id === fieldId) {
        setSelectedField(updatedField);
      }
    } catch (error) {
      console.error('Error updating field:', error);
    }
  }, [currentFormId, formBuilderService, selectedField]);

  const deleteField = useCallback((fieldId: string) => {
    if (!currentFormId) return;

    formBuilderService.deleteField(currentFormId, fieldId);
    const updatedFields = formBuilderService.getFormFields(currentFormId);
    setFields(updatedFields);
    
    if (selectedField?.id === fieldId) {
      setSelectedField(null);
    }
  }, [currentFormId, formBuilderService, selectedField]);

  const handleCanvasClick = useCallback((event: React.MouseEvent) => {
    if (isPreviewMode) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = (event.clientX - rect.left) / zoom;
    const y = (event.clientY - rect.top) / zoom;

    // Check if click is on a field
    let clickedField: FormField | null = null;
    for (const field of fields) {
      if (
        x >= field.x &&
        x <= field.x + field.width &&
        y >= field.y &&
        y <= field.y + field.height
      ) {
        clickedField = field;
        break;
      }
    }

    setSelectedField(clickedField);
  }, [fields, isPreviewMode, zoom]);

  const handleMouseDown = useCallback((event: React.MouseEvent, field: FormField, action: 'move' | 'resize', handle?: string) => {
    if (isPreviewMode) return;

    event.stopPropagation();
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const startX = (event.clientX - rect.left) / zoom;
    const startY = (event.clientY - rect.top) / zoom;

    setDragState({
      isDragging: true,
      dragType: action,
      startX,
      startY,
      startPosition: {
        x: field.x,
        y: field.y,
        width: field.width,
        height: field.height,
        page: field.pageIndex
      },
      resizeHandle: handle || null
    });

    setSelectedField(field);
  }, [isPreviewMode, zoom]);

  const handleMouseMove = useCallback((event: React.MouseEvent) => {
    if (!dragState.isDragging || !selectedField || !dragState.startPosition) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const currentX = (event.clientX - rect.left) / zoom;
    const currentY = (event.clientY - rect.top) / zoom;
    const deltaX = currentX - dragState.startX;
    const deltaY = currentY - dragState.startY;

    let updates: Partial<FormField> = {};

    if (dragState.dragType === 'move') {
      const newX = snapToGrid 
        ? Math.round((dragState.startPosition.x + deltaX) / gridSize) * gridSize
        : dragState.startPosition.x + deltaX;
      const newY = snapToGrid 
        ? Math.round((dragState.startPosition.y + deltaY) / gridSize) * gridSize
        : dragState.startPosition.y + deltaY;

      updates = {
        x: Math.max(0, newX),
        y: Math.max(0, newY)
      };
    } else if (dragState.dragType === 'resize') {
      const { resizeHandle } = dragState;
      
      if (resizeHandle?.includes('right')) {
        const newWidth = Math.max(20, dragState.startPosition.width + deltaX);
        updates.width = snapToGrid ? Math.round(newWidth / gridSize) * gridSize : newWidth;
      }
      if (resizeHandle?.includes('bottom')) {
        const newHeight = Math.max(20, dragState.startPosition.height + deltaY);
        updates.height = snapToGrid ? Math.round(newHeight / gridSize) * gridSize : newHeight;
      }
      if (resizeHandle?.includes('left')) {
        const newWidth = Math.max(20, dragState.startPosition.width - deltaX);
        const newX = dragState.startPosition.x + deltaX;
        updates.width = snapToGrid ? Math.round(newWidth / gridSize) * gridSize : newWidth;
        updates.x = snapToGrid ? Math.round(newX / gridSize) * gridSize : newX;
      }
      if (resizeHandle?.includes('top')) {
        const newHeight = Math.max(20, dragState.startPosition.height - deltaY);
        const newY = dragState.startPosition.y + deltaY;
        updates.height = snapToGrid ? Math.round(newHeight / gridSize) * gridSize : newHeight;
        updates.y = snapToGrid ? Math.round(newY / gridSize) * gridSize : newY;
      }
    }

    updateField(selectedField.id, updates);
  }, [dragState, selectedField, updateField, zoom, snapToGrid, gridSize]);

  const handleMouseUp = useCallback(() => {
    setDragState({
      isDragging: false,
      dragType: null,
      startX: 0,
      startY: 0,
      startPosition: null,
      resizeHandle: null
    });
  }, []);

  const handleFormPreview = useCallback(async () => {
    if (!currentFormId) return;

    setIsPreviewMode(true);
    setSelectedField(null);

    // Validate form data
    const validation = formBuilderService.validateFormData(formData, fields);
    if (!validation.valid) {
      const errors: any = {};
      validation.errors.forEach(error => {
        errors[error.fieldName] = error.message;
      });
      setValidationErrors(errors);
    } else {
      setValidationErrors({});
    }
  }, [currentFormId, formBuilderService, formData, fields]);

  const handleFormSubmit = useCallback(async () => {
    if (!currentFormId) return;

    const validation = formBuilderService.validateFormData(formData, fields);
    if (validation.valid) {
      // Generate submission data
      const submissionData = formBuilderService.generateSubmissionData(currentFormId, formData);
      console.log('Form submitted:', submissionData);
      
      // Here you would typically send the data to a server
      alert('Form submitted successfully!');
    } else {
      const errors: any = {};
      validation.errors.forEach(error => {
        errors[error.fieldName] = error.message;
      });
      setValidationErrors(errors);
    }
  }, [currentFormId, formBuilderService, formData, fields]);

  const handleExportPDF = useCallback(async () => {
    if (!currentFormId) return;

    try {
      const pdfBytesResult = await formBuilderService.exportToPDF(currentFormId);
      onFormCreated(pdfBytesResult);
    } catch (error) {
      console.error('Error exporting PDF:', error);
    }
  }, [currentFormId, formBuilderService, onFormCreated]);

  const handleLoadTemplate = useCallback(async (templateId: string) => {
    try {
      const { formId, fields } = await formBuilderService.createForm(templateId);
      setCurrentFormId(formId);
      setFields(fields);
      setSelectedField(null);
      setFormData({});
      setActiveTab('design');
    } catch (error) {
      console.error('Error loading template:', error);
    }
  }, [formBuilderService]);

  const renderToolbox = () => (
    <div className="form-toolbox">
      <h3>Form Tools</h3>
      <div className="tool-groups">
        <div className="tool-group">
          <h4>Input Fields</h4>
          <button className="tool-btn" onClick={() => addField('text')} title="Text Field">
            <Type size={16} /> Text
          </button>
          <button className="tool-btn" onClick={() => addField('multiline')} title="Multiline Text">
            <Type size={16} /> Textarea
          </button>
          <button className="tool-btn" onClick={() => addField('email')} title="Email Field">
            <Mail size={16} /> Email
          </button>
          <button className="tool-btn" onClick={() => addField('number')} title="Number Field">
            <Hash size={16} /> Number
          </button>
          <button className="tool-btn" onClick={() => addField('date')} title="Date Field">
            <Calendar size={16} /> Date
          </button>
          <button className="tool-btn" onClick={() => addField('phone')} title="Phone Field">
            <Hash size={16} /> Phone
          </button>
        </div>

        <div className="tool-group">
          <h4>Choice Fields</h4>
          <button className="tool-btn" onClick={() => addField('checkbox')} title="Checkbox">
            <CheckSquare size={16} /> Checkbox
          </button>
          <button className="tool-btn" onClick={() => addField('radio')} title="Radio Button">
            <RadioButton size={16} /> Radio
          </button>
          <button className="tool-btn" onClick={() => addField('dropdown')} title="Dropdown">
            <List size={16} /> Dropdown
          </button>
          <button className="tool-btn" onClick={() => addField('listbox')} title="List Box">
            <List size={16} /> List
          </button>
        </div>

        <div className="tool-group">
          <h4>Special Fields</h4>
          <button className="tool-btn" onClick={() => addField('signature')} title="Digital Signature Field">
            <PenTool size={16} /> Signature
          </button>
          <button className="tool-btn" onClick={() => addField('button')} title="Action Button">
            <MousePointer size={16} /> Button
          </button>
        </div>
        
        <div className="tool-group">
          <h4>Advanced Fields</h4>
          <button className="tool-btn" onClick={() => addField('barcode')} title="Barcode Field">
            <Hash size={16} /> Barcode
          </button>
          <button className="tool-btn" onClick={() => addField('calculation')} title="Calculation Field">
            <Zap size={16} /> Calculate
          </button>
        </div>
      </div>
    </div>
  );

  const renderPropertiesPanel = () => (
    <div ref={propertyPanelRef} className="properties-panel">
      <h3>Properties</h3>
      {selectedField ? (
        <div className="field-properties">
          <div className="property-group">
            <h4>Basic Properties</h4>
            <div className="property-item">
              <label>Field Name:</label>
              <input
                type="text"
                value={selectedField.name}
                onChange={(e) => updateField(selectedField.id, { name: e.target.value })}
              />
            </div>
            <div className="property-item">
              <label>Field Type:</label>
              <select
                value={selectedField.type}
                onChange={(e) => updateField(selectedField.id, { type: e.target.value as any })}
              >
                <option value="text">Text</option>
                <option value="multiline">Multiline Text</option>
                <option value="email">Email</option>
                <option value="number">Number</option>
                <option value="date">Date</option>
                <option value="phone">Phone</option>
                <option value="checkbox">Checkbox</option>
                <option value="radio">Radio</option>
                <option value="dropdown">Dropdown</option>
                <option value="signature">Signature</option>
                <option value="button">Button</option>
              </select>
            </div>
            <div className="property-item">
              <label>Default Value:</label>
              <input
                type="text"
                value={selectedField.defaultValue || ''}
                onChange={(e) => updateField(selectedField.id, { defaultValue: e.target.value })}
              />
            </div>
            <div className="property-item">
              <label>Placeholder:</label>
              <input
                type="text"
                value={selectedField.placeholder || ''}
                onChange={(e) => updateField(selectedField.id, { placeholder: e.target.value })}
              />
            </div>
          </div>

          <div className="property-group">
            <h4>Position & Size</h4>
            <div className="property-row">
              <div className="property-item">
                <label>X:</label>
                <input
                  type="number"
                  value={selectedField.x}
                  onChange={(e) => updateField(selectedField.id, { x: parseInt(e.target.value) })}
                />
              </div>
              <div className="property-item">
                <label>Y:</label>
                <input
                  type="number"
                  value={selectedField.y}
                  onChange={(e) => updateField(selectedField.id, { y: parseInt(e.target.value) })}
                />
              </div>
            </div>
            <div className="property-row">
              <div className="property-item">
                <label>Width:</label>
                <input
                  type="number"
                  value={selectedField.width}
                  onChange={(e) => updateField(selectedField.id, { width: parseInt(e.target.value) })}
                />
              </div>
              <div className="property-item">
                <label>Height:</label>
                <input
                  type="number"
                  value={selectedField.height}
                  onChange={(e) => updateField(selectedField.id, { height: parseInt(e.target.value) })}
                />
              </div>
            </div>
          </div>

          <div className="property-group">
            <h4>Validation</h4>
            <div className="property-item">
              <label>
                <input
                  type="checkbox"
                  checked={selectedField.required || false}
                  onChange={(e) => updateField(selectedField.id, { required: e.target.checked })}
                />
                Required
              </label>
            </div>
            <div className="property-item">
              <label>
                <input
                  type="checkbox"
                  checked={selectedField.readOnly || false}
                  onChange={(e) => updateField(selectedField.id, { readOnly: e.target.checked })}
                />
                Read Only
              </label>
            </div>
            {selectedField.type === 'text' && (
              <div className="property-item">
                <label>Max Length:</label>
                <input
                  type="number"
                  value={selectedField.maxLength || ''}
                  onChange={(e) => updateField(selectedField.id, { maxLength: parseInt(e.target.value) || undefined })}
                />
              </div>
            )}
          </div>

          {(selectedField.type === 'dropdown' || selectedField.type === 'radio' || selectedField.type === 'listbox') && (
            <div className="property-group">
              <h4>Options</h4>
              <div className="options-list">
                {(selectedField.options || []).map((option, index) => (
                  <div key={index} className="option-item">
                    <input
                      type="text"
                      value={option.value}
                      onChange={(e) => {
                        const newOptions = [...(selectedField.options || [])];
                        newOptions[index] = { ...option, value: e.target.value, label: e.target.value };
                        updateField(selectedField.id, { options: newOptions });
                      }}
                      placeholder="Option value"
                    />
                    <button
                      onClick={() => {
                        const newOptions = [...(selectedField.options || [])];
                        newOptions.splice(index, 1);
                        updateField(selectedField.id, { options: newOptions });
                      }}
                      className="delete-option-btn"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => {
                    const newOptions = [...(selectedField.options || [])];
                    newOptions.push({ value: `Option ${newOptions.length + 1}`, label: `Option ${newOptions.length + 1}` });
                    updateField(selectedField.id, { options: newOptions });
                  }}
                  className="add-option-btn"
                >
                  <Plus size={14} /> Add Option
                </button>
              </div>
            </div>
          )}

          <div className="property-group">
            <h4>Actions</h4>
            <button
              onClick={() => {
                const field = { ...selectedField };
                field.id = Date.now().toString();
                field.name = field.name + '_copy';
                field.x += 20;
                field.y += 20;
                addField(field.type, { x: field.x, y: field.y });
              }}
              className="action-btn"
            >
              <Copy size={14} /> Duplicate
            </button>
            <button
              onClick={() => deleteField(selectedField.id)}
              className="action-btn delete-btn"
            >
              <Trash2 size={14} /> Delete
            </button>
          </div>
        </div>
      ) : (
        <div className="no-selection">
          <p>Select a field to edit its properties</p>
        </div>
      )}
    </div>
  );

  const renderCanvas = () => (
    <div
      ref={canvasRef}
      className={`form-canvas ${showGrid ? 'show-grid' : ''} ${isPreviewMode ? 'preview-mode' : ''}`}
      style={{
        transform: `scale(${zoom})`,
        transformOrigin: '0 0',
        backgroundSize: `${gridSize * zoom}px ${gridSize * zoom}px`,
      }}
      onClick={handleCanvasClick}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {fields.map((field) => (
        <div
          key={field.id}
          className={`form-field ${field.type} ${selectedField?.id === field.id ? 'selected' : ''} ${validationErrors[field.name] ? 'has-error' : ''}`}
          style={{
            left: field.x,
            top: field.y,
            width: field.width,
            height: field.height,
            fontSize: field.appearance?.fontSize || 12,
            color: field.appearance?.fontColor ? 
              `rgb(${field.appearance.fontColor.r * 255}, ${field.appearance.fontColor.g * 255}, ${field.appearance.fontColor.b * 255})` : 
              '#000',
            backgroundColor: field.appearance?.backgroundColor ? 
              `rgb(${field.appearance.backgroundColor.r * 255}, ${field.appearance.backgroundColor.g * 255}, ${field.appearance.backgroundColor.b * 255})` : 
              '#fff',
            borderColor: field.appearance?.borderColor ? 
              `rgb(${field.appearance.borderColor.r * 255}, ${field.appearance.borderColor.g * 255}, ${field.appearance.borderColor.b * 255})` : 
              '#ccc',
            borderWidth: field.appearance?.borderWidth || 1,
            textAlign: field.appearance?.alignment || 'left'
          }}
          onMouseDown={(e) => !isPreviewMode && handleMouseDown(e, field, 'move')}
        >
          {isPreviewMode ? (
            renderFieldPreview(field)
          ) : (
            <div className="field-label">{field.name} ({field.type})</div>
          )}
          
          {!isPreviewMode && selectedField?.id === field.id && (
            <>
              <div className="resize-handles">
                <div
                  className="resize-handle nw"
                  onMouseDown={(e) => handleMouseDown(e, field, 'resize', 'top-left')}
                />
                <div
                  className="resize-handle ne"
                  onMouseDown={(e) => handleMouseDown(e, field, 'resize', 'top-right')}
                />
                <div
                  className="resize-handle sw"
                  onMouseDown={(e) => handleMouseDown(e, field, 'resize', 'bottom-left')}
                />
                <div
                  className="resize-handle se"
                  onMouseDown={(e) => handleMouseDown(e, field, 'resize', 'bottom-right')}
                />
              </div>
            </>
          )}

          {validationErrors[field.name] && (
            <div className="field-error">
              {validationErrors[field.name]}
            </div>
          )}
        </div>
      ))}
    </div>
  );

  const renderFieldPreview = (field: FormField) => {
    const value = formData[field.name] || field.defaultValue || '';

    switch (field.type) {
      case 'text':
      case 'email':
      case 'phone':
      case 'number':
        return (
          <input
            type={field.type === 'number' ? 'number' : field.type === 'email' ? 'email' : 'text'}
            value={value}
            placeholder={field.placeholder}
            onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
            required={field.required}
            readOnly={field.readOnly}
            maxLength={field.maxLength}
            style={{ width: '100%', height: '100%', border: 'none', background: 'transparent' }}
          />
        );
      
      case 'multiline':
        return (
          <textarea
            value={value}
            placeholder={field.placeholder}
            onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
            required={field.required}
            readOnly={field.readOnly}
            maxLength={field.maxLength}
            style={{ width: '100%', height: '100%', border: 'none', background: 'transparent', resize: 'none' }}
          />
        );
      
      case 'date':
        return (
          <input
            type="date"
            value={value}
            onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
            required={field.required}
            readOnly={field.readOnly}
            style={{ width: '100%', height: '100%', border: 'none', background: 'transparent' }}
          />
        );
      
      case 'checkbox':
        return (
          <label style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
            <input
              type="checkbox"
              checked={value === true}
              onChange={(e) => setFormData({ ...formData, [field.name]: e.target.checked })}
              disabled={field.readOnly}
            />
            <span style={{ marginLeft: 8 }}>{field.name}</span>
          </label>
        );
      
      case 'radio':
        return (
          <div>
            {(field.options || []).map((option, index) => (
              <label key={index} style={{ display: 'block' }}>
                <input
                  type="radio"
                  name={field.name}
                  value={option.value}
                  checked={value === option.value}
                  onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                  disabled={field.readOnly}
                />
                <span style={{ marginLeft: 8 }}>{option.label}</span>
              </label>
            ))}
          </div>
        );
      
      case 'dropdown':
        return (
          <select
            value={value}
            onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
            required={field.required}
            disabled={field.readOnly}
            style={{ width: '100%', height: '100%', border: 'none', background: 'transparent' }}
          >
            <option value="">{field.placeholder || 'Select...'}</option>
            {(field.options || []).map((option, index) => (
              <option key={index} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );
      
      case 'signature':
        return (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', backgroundColor: '#f9f9f9' }}>
            {value ? (
              <span>Signature: {value}</span>
            ) : (
              <span style={{ color: '#999' }}>Click to sign</span>
            )}
          </div>
        );
      
      case 'button':
        return (
          <button
            type="button"
            onClick={() => {
              if (field.name === 'submit') {
                handleFormSubmit();
              }
            }}
            style={{ width: '100%', height: '100%', border: 'none', background: 'transparent', cursor: 'pointer' }}
          >
            {field.defaultValue || field.name}
          </button>
        );
      
      default:
        return <span>{field.name}</span>;
    }
  };

  const renderTemplatesTab = () => (
    <div className="templates-tab">
      <h3>Form Templates</h3>
      <div className="templates-grid">
        {templates.map((template) => (
          <div key={template.id} className="template-card">
            <div className="template-header">
              <h4>{template.name}</h4>
              <span className="template-category">{template.category}</span>
            </div>
            <div className="template-description">
              {template.description}
            </div>
            <div className="template-fields">
              {template.fields.length} fields
            </div>
            <button
              className="load-template-btn"
              onClick={() => handleLoadTemplate(template.id)}
            >
              Use Template
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  if (!isVisible) return null;

  return (
    <div className="form-builder-overlay">
      <div className="form-builder">
        <div className="form-builder-header">
          <h2>Advanced Form Builder</h2>
          <div className="header-actions">
            <div className="zoom-controls">
              <button onClick={() => setZoom(zoom * 0.9)}>-</button>
              <span>{Math.round(zoom * 100)}%</span>
              <button onClick={() => setZoom(zoom * 1.1)}>+</button>
            </div>
            <div className="view-controls">
              <button
                className={`view-btn ${showGrid ? 'active' : ''}`}
                onClick={() => setShowGrid(!showGrid)}
                title="Toggle Grid"
              >
                <Grid size={16} />
              </button>
              <button
                className={`view-btn ${snapToGrid ? 'active' : ''}`}
                onClick={() => setSnapToGrid(!snapToGrid)}
                title="Snap to Grid"
              >
                <Layers size={16} />
              </button>
            </div>
            <div className="mode-controls">
              <button
                className={`mode-btn ${!isPreviewMode ? 'active' : ''}`}
                onClick={() => setIsPreviewMode(false)}
                title="Design Mode"
              >
                <Settings size={16} /> Design
              </button>
              <button
                className={`mode-btn ${isPreviewMode ? 'active' : ''}`}
                onClick={handleFormPreview}
                title="Preview Mode"
              >
                <Eye size={16} /> Preview
              </button>
            </div>
            <button className="close-btn" onClick={onClose}>×</button>
          </div>
        </div>

        <div className="form-builder-body">
          <div className="form-builder-sidebar">
            <div className="sidebar-tabs">
              <button
                className={`sidebar-tab ${activeTab === 'design' ? 'active' : ''}`}
                onClick={() => setActiveTab('design')}
              >
                <Settings size={16} /> Design
              </button>
              <button
                className={`sidebar-tab ${activeTab === 'templates' ? 'active' : ''}`}
                onClick={() => setActiveTab('templates')}
              >
                <Copy size={16} /> Templates
              </button>
            </div>

            <div className="sidebar-content">
              {activeTab === 'design' && renderToolbox()}
              {activeTab === 'templates' && renderTemplatesTab()}
            </div>
          </div>

          <div className="form-builder-main">
            <div className="canvas-container">
              {renderCanvas()}
            </div>
          </div>

          <div className="form-builder-properties">
            {renderPropertiesPanel()}
          </div>
        </div>

        <div className="form-builder-footer">
          <div className="footer-info">
            Fields: {fields.length} | Selected: {selectedField ? selectedField.name : 'None'}
          </div>
          <div className="footer-actions">
            <button className="footer-btn" onClick={createNewForm}>
              <Plus size={16} /> New Form
            </button>
            <button className="footer-btn" onClick={() => formBuilderService.autoArrangeFields(currentFormId!, 'single-column')}>
              <AlignLeft size={16} /> Auto Layout
            </button>
            {isPreviewMode ? (
              <button className="footer-btn primary" onClick={handleFormSubmit}>
                <Play size={16} /> Submit Form
              </button>
            ) : (
              <button className="footer-btn primary" onClick={handleExportPDF}>
                <Download size={16} /> Export PDF
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FormBuilder;