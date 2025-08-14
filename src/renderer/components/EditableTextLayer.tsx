import React, { useState, useRef, useEffect } from 'react';
import './EditableTextLayer.css';

interface EditableTextLayerProps {
  pdfPage: any;
  viewport: any;
  zoom: number;
  onTextEdit: (oldText: string, newText: string, coordinates: any) => void;
  isEditMode: boolean;
}

interface EditableTextItem {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  fontFamily: string;
  id: string;
}

const EditableTextLayer: React.FC<EditableTextLayerProps> = ({
  pdfPage,
  viewport,
  zoom,
  onTextEdit,
  isEditMode
}) => {
  const [textItems, setTextItems] = useState<EditableTextItem[]>([]);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const layerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!pdfPage || !viewport) return;

    // Extract text content with positioning
    const extractTextItems = async () => {
      try {
        const textContent = await pdfPage.getTextContent();
        const items: EditableTextItem[] = [];

        textContent.items.forEach((item: any, index: number) => {
          if (item.str && item.str.trim()) {
            // Calculate position based on transform matrix
            const transform = item.transform;
            const x = transform[4];
            const y = viewport.height - transform[5]; // Flip Y coordinate
            const fontSize = Math.abs(transform[0]); // Font size from transform

            items.push({
              id: `text-${index}`,
              text: item.str,
              x,
              y: y - fontSize, // Adjust for baseline
              width: item.width || fontSize * item.str.length * 0.6,
              height: fontSize,
              fontSize,
              fontFamily: item.fontName || 'Helvetica'
            });
          }
        });

        setTextItems(items);
      } catch (error) {
        console.error('Error extracting text items:', error);
      }
    };

    extractTextItems();
  }, [pdfPage, viewport]);

  const handleTextClick = (item: EditableTextItem) => {
    if (!isEditMode) return;
    
    setEditingItem(item.id);
    setEditingText(item.text);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditingText(e.target.value);
  };

  const handleTextSave = (item: EditableTextItem) => {
    if (editingText !== item.text) {
      // Update the text item
      setTextItems(prev => prev.map(ti => 
        ti.id === item.id ? { ...ti, text: editingText } : ti
      ));
      
      // Notify parent component of the change
      onTextEdit(item.text, editingText, {
        x: item.x,
        y: item.y,
        width: item.width,
        height: item.height
      });
    }
    
    setEditingItem(null);
    setEditingText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent, item: EditableTextItem) => {
    if (e.key === 'Enter') {
      handleTextSave(item);
    } else if (e.key === 'Escape') {
      setEditingItem(null);
      setEditingText('');
    }
  };

  const renderTextItem = (item: EditableTextItem) => {
    const isEditing = editingItem === item.id;
    const scale = zoom / 100;

    const style: React.CSSProperties = {
      position: 'absolute',
      left: item.x * scale,
      top: item.y * scale,
      width: item.width * scale,
      height: item.height * scale,
      fontSize: item.fontSize * scale,
      lineHeight: `${item.height * scale}px`,
      fontFamily: item.fontFamily,
      color: isEditMode ? '#000' : 'transparent',
      backgroundColor: isEditMode ? 'rgba(255, 255, 0, 0.1)' : 'transparent',
      border: isEditMode ? '1px dashed #007bff' : 'none',
      cursor: isEditMode ? 'text' : 'default',
      pointerEvents: isEditMode ? 'auto' : 'none',
      overflow: 'hidden',
      whiteSpace: 'nowrap'
    };

    if (isEditing) {
      return (
        <input
          key={item.id}
          type="text"
          value={editingText}
          onChange={handleTextChange}
          onBlur={() => handleTextSave(item)}
          onKeyDown={(e) => handleKeyDown(e, item)}
          style={{
            ...style,
            border: '2px solid #007bff',
            backgroundColor: 'white',
            padding: '2px',
            outline: 'none'
          }}
          autoFocus
        />
      );
    }

    return (
      <div
        key={item.id}
        style={style}
        onClick={() => handleTextClick(item)}
        title={isEditMode ? 'Click to edit' : ''}
      >
        {item.text}
      </div>
    );
  };

  return (
    <div 
      ref={layerRef}
      className={`editable-text-layer ${isEditMode ? 'edit-mode' : ''}`}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: viewport?.width || 0,
        height: viewport?.height || 0,
        pointerEvents: isEditMode ? 'auto' : 'none',
        zIndex: isEditMode ? 100 : 1
      }}
    >
      {textItems.map(renderTextItem)}
    </div>
  );
};

export default EditableTextLayer;