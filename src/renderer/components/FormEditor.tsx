import React, { useState } from 'react';
import './FormEditor.css';

interface FormField {
  type: 'text' | 'checkbox' | 'radio' | 'dropdown' | 'signature' | 'date';
  name: string;
  label: string;
  required: boolean;
  options?: string[];
  x: number;
  y: number;
  width: number;
  height: number;
}

interface FormEditorProps {
  onAddField: (field: FormField) => void;
  onClose: () => void;
}

const FormEditor: React.FC<FormEditorProps> = ({
  onAddField,
  onClose
}) => {
  const [fieldType, setFieldType] = useState<FormField['type']>('text');
  const [fieldName, setFieldName] = useState('');
  const [fieldLabel, setFieldLabel] = useState('');
  const [required, setRequired] = useState(false);
  const [options, setOptions] = useState<string[]>(['']);

  const handleAddOption = () => {
    setOptions([...options, '']);
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleRemoveOption = (index: number) => {
    setOptions(options.filter((_, i) => i !== index));
  };

  const handleAddField = () => {
    if (!fieldName || !fieldLabel) {
      alert('Please enter field name and label');
      return;
    }

    const field: FormField = {
      type: fieldType,
      name: fieldName,
      label: fieldLabel,
      required,
      x: 100,
      y: 100,
      width: 200,
      height: 30
    };

    if (fieldType === 'dropdown' || fieldType === 'radio') {
      field.options = options.filter(opt => opt.trim() !== '');
    }

    onAddField(field);
    
    // Reset form
    setFieldName('');
    setFieldLabel('');
    setRequired(false);
    setOptions(['']);
  };

  return (
    <div className="form-editor">
      <div className="form-editor-header">
        <h3>Add Form Field</h3>
        <button className="close-btn" onClick={onClose}>
          <i className="fas fa-times"></i>
        </button>
      </div>
      <div className="form-editor-content">
        <div className="form-group">
          <label>Field Type:</label>
          <select
            value={fieldType}
            onChange={(e) => setFieldType(e.target.value as FormField['type'])}
          >
            <option value="text">Text Field</option>
            <option value="checkbox">Checkbox</option>
            <option value="radio">Radio Button</option>
            <option value="dropdown">Dropdown</option>
            <option value="signature">Signature</option>
            <option value="date">Date Picker</option>
          </select>
        </div>
        <div className="form-group">
          <label>Field Name:</label>
          <input
            type="text"
            value={fieldName}
            onChange={(e) => setFieldName(e.target.value)}
            placeholder="e.g., firstName"
          />
        </div>
        <div className="form-group">
          <label>Field Label:</label>
          <input
            type="text"
            value={fieldLabel}
            onChange={(e) => setFieldLabel(e.target.value)}
            placeholder="e.g., First Name"
          />
        </div>
        <div className="form-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={required}
              onChange={(e) => setRequired(e.target.checked)}
            />
            Required Field
          </label>
        </div>
        {(fieldType === 'dropdown' || fieldType === 'radio') && (
          <div className="form-group">
            <label>Options:</label>
            {options.map((option, index) => (
              <div key={index} className="option-input">
                <input
                  type="text"
                  value={option}
                  onChange={(e) => handleOptionChange(index, e.target.value)}
                  placeholder={`Option ${index + 1}`}
                />
                <button
                  className="remove-option-btn"
                  onClick={() => handleRemoveOption(index)}
                  disabled={options.length === 1}
                >
                  <i className="fas fa-minus"></i>
                </button>
              </div>
            ))}
            <button className="add-option-btn" onClick={handleAddOption}>
              <i className="fas fa-plus"></i> Add Option
            </button>
          </div>
        )}
        <div className="form-editor-actions">
          <button className="btn btn-primary" onClick={handleAddField}>
            Add Field
          </button>
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default FormEditor;
