import React, { useState } from 'react';
import './TextEditor.css';

interface TextEditorProps {
  initialText?: string;
  onSave: (text: string) => void;
  onCancel: () => void;
}

const TextEditor: React.FC<TextEditorProps> = ({
  initialText = '',
  onSave,
  onCancel
}) => {
  const [text, setText] = useState(initialText);
  const [fontSize, setFontSize] = useState(12);
  const [fontFamily, setFontFamily] = useState('Helvetica');
  const [bold, setBold] = useState(false);
  const [italic, setItalic] = useState(false);
  const [underline, setUnderline] = useState(false);

  const handleSave = () => {
    onSave(text);
  };

  return (
    <div className="text-editor">
      <div className="text-editor-toolbar">
        <select
          value={fontFamily}
          onChange={(e) => setFontFamily(e.target.value)}
        >
          <option value="Helvetica">Helvetica</option>
          <option value="Times-Roman">Times Roman</option>
          <option value="Courier">Courier</option>
          <option value="Arial">Arial</option>
        </select>
        <select
          value={fontSize}
          onChange={(e) => setFontSize(parseInt(e.target.value))}
        >
          {[8, 10, 12, 14, 16, 18, 20, 24, 28, 32].map(size => (
            <option key={size} value={size}>{size}pt</option>
          ))}
        </select>
        <button
          className={`format-btn ${bold ? 'active' : ''}`}
          onClick={() => setBold(!bold)}
        >
          <i className="fas fa-bold"></i>
        </button>
        <button
          className={`format-btn ${italic ? 'active' : ''}`}
          onClick={() => setItalic(!italic)}
        >
          <i className="fas fa-italic"></i>
        </button>
        <button
          className={`format-btn ${underline ? 'active' : ''}`}
          onClick={() => setUnderline(!underline)}
        >
          <i className="fas fa-underline"></i>
        </button>
      </div>
      <textarea
        className="text-editor-content"
        value={text}
        onChange={(e) => setText(e.target.value)}
        style={{
          fontSize: `${fontSize}px`,
          fontFamily,
          fontWeight: bold ? 'bold' : 'normal',
          fontStyle: italic ? 'italic' : 'normal',
          textDecoration: underline ? 'underline' : 'none'
        }}
        placeholder="Enter text here..."
      />
      <div className="text-editor-actions">
        <button className="btn btn-primary" onClick={handleSave}>
          Save
        </button>
        <button className="btn btn-secondary" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
};

export default TextEditor;
