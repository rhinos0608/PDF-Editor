/**
 * AnnotationPropertiesPanel - Professional annotation editing panel
 */

import React, { useState, useEffect } from 'react';
import { ProfessionalAnnotation } from '../services/ProfessionalPDFService';
import './AnnotationPropertiesPanel.css';

interface AnnotationPropertiesPanelProps {
  selectedAnnotation: ProfessionalAnnotation | null;
  onUpdateAnnotation: (id: string, changes: Partial<ProfessionalAnnotation>) => void;
  onDeleteAnnotation: (id: string) => void;
  onClose: () => void;
  isVisible: boolean;
}

const AnnotationPropertiesPanel: React.FC<AnnotationPropertiesPanelProps> = ({
  selectedAnnotation,
  onUpdateAnnotation,
  onDeleteAnnotation,
  onClose,
  isVisible
}) => {
  const [localAnnotation, setLocalAnnotation] = useState<ProfessionalAnnotation | null>(null);
  const [activeTab, setActiveTab] = useState<'appearance' | 'text' | 'advanced'>('appearance');

  useEffect(() => {
    if (selectedAnnotation) {
      setLocalAnnotation({ ...selectedAnnotation });
    }
  }, [selectedAnnotation]);

  if (!isVisible || !localAnnotation) {
    return null;
  }

  const updateProperty = (property: keyof ProfessionalAnnotation, value: any) => {
    const updated = { ...localAnnotation, [property]: value };
    setLocalAnnotation(updated);
    onUpdateAnnotation(updated.id, { [property]: value });
  };

  const updateColor = (colorType: 'color' | 'fillColor', r: number, g: number, b: number) => {
    const colorValue = { r: r / 255, g: g / 255, b: b / 255 };
    updateProperty(colorType, colorValue);
  };

  const ColorPicker: React.FC<{
    label: string;
    color: { r: number; g: number; b: number } | undefined;
    onChange: (r: number, g: number, b: number) => void;
  }> = ({ label, color, onChange }) => {
    const hexColor = color 
      ? `#${Math.round(color.r * 255).toString(16).padStart(2, '0')}${Math.round(color.g * 255).toString(16).padStart(2, '0')}${Math.round(color.b * 255).toString(16).padStart(2, '0')}`
      : '#000000';

    return (
      <div className="color-picker-group">
        <label>{label}</label>
        <div className="color-picker-container">
          <input
            type="color"
            value={hexColor}
            onChange={(e) => {
              const hex = e.target.value.slice(1);
              const r = parseInt(hex.slice(0, 2), 16);
              const g = parseInt(hex.slice(2, 4), 16);
              const b = parseInt(hex.slice(4, 6), 16);
              onChange(r, g, b);
            }}
            className="color-picker-input"
          />
          <div 
            className="color-preview"
            style={{ backgroundColor: hexColor }}
          />
          <span className="color-value">{hexColor.toUpperCase()}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="annotation-properties-panel">
      <div className="panel-header">
        <div className="panel-title">
          <i className="fas fa-edit"></i>
          <span>Annotation Properties</span>
        </div>
        <button className="panel-close-btn" onClick={onClose}>
          <i className="fas fa-times"></i>
        </button>
      </div>

      <div className="panel-tabs">
        <button 
          className={`tab-button ${activeTab === 'appearance' ? 'active' : ''}`}
          onClick={() => setActiveTab('appearance')}
        >
          <i className="fas fa-palette"></i>
          Appearance
        </button>
        <button 
          className={`tab-button ${activeTab === 'text' ? 'active' : ''}`}
          onClick={() => setActiveTab('text')}
          disabled={localAnnotation.type !== 'text'}
        >
          <i className="fas fa-font"></i>
          Text
        </button>
        <button 
          className={`tab-button ${activeTab === 'advanced' ? 'active' : ''}`}
          onClick={() => setActiveTab('advanced')}
        >
          <i className="fas fa-cog"></i>
          Advanced
        </button>
      </div>

      <div className="panel-content">
        {activeTab === 'appearance' && (
          <div className="tab-content">
            <div className="property-section">
              <h4>Colors</h4>
              
              <ColorPicker
                label="Stroke Color"
                color={localAnnotation.color}
                onChange={(r, g, b) => updateColor('color', r, g, b)}
              />

              {(localAnnotation.type === 'rectangle' || localAnnotation.type === 'circle') && (
                <ColorPicker
                  label="Fill Color"
                  color={localAnnotation.fillColor}
                  onChange={(r, g, b) => updateColor('fillColor', r, g, b)}
                />
              )}
            </div>

            <div className="property-section">
              <h4>Stroke</h4>
              
              <div className="property-group">
                <label>Stroke Width</label>
                <div className="slider-container">
                  <input
                    type="range"
                    min="0.5"
                    max="10"
                    step="0.5"
                    value={localAnnotation.strokeWidth || 1}
                    onChange={(e) => updateProperty('strokeWidth', parseFloat(e.target.value))}
                    className="property-slider"
                  />
                  <span className="slider-value">{localAnnotation.strokeWidth || 1}px</span>
                </div>
              </div>

              <div className="property-group">
                <label>Opacity</label>
                <div className="slider-container">
                  <input
                    type="range"
                    min="0.1"
                    max="1"
                    step="0.1"
                    value={localAnnotation.opacity || 1}
                    onChange={(e) => updateProperty('opacity', parseFloat(e.target.value))}
                    className="property-slider"
                  />
                  <span className="slider-value">{Math.round((localAnnotation.opacity || 1) * 100)}%</span>
                </div>
              </div>
            </div>

            <div className="property-section">
              <h4>Transform</h4>
              
              <div className="property-group">
                <label>Rotation</label>
                <div className="slider-container">
                  <input
                    type="range"
                    min="0"
                    max="360"
                    step="15"
                    value={localAnnotation.rotation || 0}
                    onChange={(e) => updateProperty('rotation', parseInt(e.target.value))}
                    className="property-slider"
                  />
                  <span className="slider-value">{localAnnotation.rotation || 0}°</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'text' && localAnnotation.type === 'text' && (
          <div className="tab-content">
            <div className="property-section">
              <h4>Text Content</h4>
              
              <div className="property-group">
                <label>Text</label>
                <textarea
                  value={localAnnotation.text || ''}
                  onChange={(e) => updateProperty('text', e.target.value)}
                  className="text-input"
                  rows={3}
                  placeholder="Enter text..."
                />
              </div>
            </div>

            <div className="property-section">
              <h4>Typography</h4>
              
              <div className="property-group">
                <label>Font Family</label>
                <select
                  value={localAnnotation.fontFamily || 'Helvetica'}
                  onChange={(e) => updateProperty('fontFamily', e.target.value)}
                  className="property-select"
                >
                  <option value="Helvetica">Helvetica</option>
                  <option value="Times">Times Roman</option>
                  <option value="Courier">Courier</option>
                </select>
              </div>

              <div className="property-group">
                <label>Font Weight</label>
                <select
                  value={localAnnotation.fontWeight || 'normal'}
                  onChange={(e) => updateProperty('fontWeight', e.target.value)}
                  className="property-select"
                >
                  <option value="normal">Normal</option>
                  <option value="bold">Bold</option>
                </select>
              </div>

              <div className="property-group">
                <label>Font Size</label>
                <div className="slider-container">
                  <input
                    type="range"
                    min="8"
                    max="72"
                    step="1"
                    value={localAnnotation.fontSize || 12}
                    onChange={(e) => updateProperty('fontSize', parseInt(e.target.value))}
                    className="property-slider"
                  />
                  <span className="slider-value">{localAnnotation.fontSize || 12}pt</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'advanced' && (
          <div className="tab-content">
            <div className="property-section">
              <h4>Position & Size</h4>
              
              <div className="position-grid">
                <div className="property-group">
                  <label>X</label>
                  <input
                    type="number"
                    value={Math.round(localAnnotation.x)}
                    onChange={(e) => updateProperty('x', parseInt(e.target.value) || 0)}
                    className="number-input"
                  />
                </div>
                <div className="property-group">
                  <label>Y</label>
                  <input
                    type="number"
                    value={Math.round(localAnnotation.y)}
                    onChange={(e) => updateProperty('y', parseInt(e.target.value) || 0)}
                    className="number-input"
                  />
                </div>
                <div className="property-group">
                  <label>Width</label>
                  <input
                    type="number"
                    value={Math.round(localAnnotation.width)}
                    onChange={(e) => updateProperty('width', parseInt(e.target.value) || 1)}
                    className="number-input"
                  />
                </div>
                <div className="property-group">
                  <label>Height</label>
                  <input
                    type="number"
                    value={Math.round(localAnnotation.height)}
                    onChange={(e) => updateProperty('height', parseInt(e.target.value) || 1)}
                    className="number-input"
                  />
                </div>
              </div>
            </div>

            <div className="property-section">
              <h4>Metadata</h4>
              
              <div className="property-group">
                <label>Notes</label>
                <textarea
                  value={localAnnotation.notes || ''}
                  onChange={(e) => updateProperty('notes', e.target.value)}
                  className="text-input"
                  rows={2}
                  placeholder="Add notes about this annotation..."
                />
              </div>

              <div className="metadata-info">
                <div className="metadata-item">
                  <span className="metadata-label">ID:</span>
                  <span className="metadata-value">{localAnnotation.id}</span>
                </div>
                <div className="metadata-item">
                  <span className="metadata-label">Created:</span>
                  <span className="metadata-value">
                    {localAnnotation.createdAt ? new Date(localAnnotation.createdAt).toLocaleString() : 'Unknown'}
                  </span>
                </div>
                {localAnnotation.modifiedAt && (
                  <div className="metadata-item">
                    <span className="metadata-label">Modified:</span>
                    <span className="metadata-value">
                      {new Date(localAnnotation.modifiedAt).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="panel-footer">
        <button
          className="btn btn-danger"
          onClick={() => {
            onDeleteAnnotation(localAnnotation.id);
            onClose();
          }}
        >
          <i className="fas fa-trash"></i>
          Delete
        </button>
        <button className="btn btn-secondary" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
};

export default AnnotationPropertiesPanel;