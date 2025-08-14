/**
 * Click-to-Edit Overlay Component
 * Provides visual indicators and click handling for editable text regions
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Edit3, Type, MousePointer } from 'lucide-react';
import { EditableTextRegion } from '../services/PDFTextExtractor';
import InlineTextEditor from './InlineTextEditor';
// CSS is handled by styled-jsx below

interface ClickToEditOverlayProps {
  isEditMode: boolean;
  textRegions: EditableTextRegion[];
  currentPage: number;
  zoom: number;
  onTextEdit: (regionId: string, newText: string) => Promise<void>;
  onToggleEditMode: () => void;
}

interface ActiveEdit {
  region: EditableTextRegion;
  screenPosition: { x: number; y: number };
}

const ClickToEditOverlay: React.FC<ClickToEditOverlayProps> = ({
  isEditMode,
  textRegions,
  currentPage,
  zoom,
  onTextEdit,
  onToggleEditMode
}) => {
  const [activeEdit, setActiveEdit] = useState<ActiveEdit | null>(null);
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);
  const [clickFeedback, setClickFeedback] = useState<{ x: number; y: number } | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Get text regions for current page
  const currentPageRegions = textRegions.filter(
    region => region.pageIndex === currentPage - 1
  );

  // Handle clicks on the overlay
  const handleOverlayClick = useCallback((event: React.MouseEvent) => {
    if (!isEditMode || activeEdit) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;

    // Convert screen coordinates to PDF coordinates
    const pdfX = clickX / zoom;
    const pdfY = clickY / zoom;

    // Find clicked text region with improved hit detection
    const clickedRegion = currentPageRegions.find(region => {
      const padding = 8; // Increased padding for easier clicking
      return pdfX >= region.x - padding && 
             pdfX <= region.x + region.width + padding &&
             pdfY >= region.y - padding && 
             pdfY <= region.y + region.height + padding;
    });

    if (clickedRegion) {
      // Start editing
      setActiveEdit({
        region: clickedRegion,
        screenPosition: { x: event.clientX, y: event.clientY }
      });
    } else {
      // Show click feedback for missed clicks
      showClickFeedback(clickX, clickY);
    }
  }, [isEditMode, activeEdit, currentPageRegions, zoom]);

  // Show visual feedback for missed clicks
  const showClickFeedback = useCallback((x: number, y: number) => {
    setClickFeedback({ x, y });
    setTimeout(() => setClickFeedback(null), 800);
  }, []);

  // Handle text save
  const handleTextSave = useCallback(async (newText: string) => {
    if (!activeEdit) return;

    try {
      await onTextEdit(activeEdit.region.id, newText);
      setActiveEdit(null);
    } catch (error) {
      console.error('Failed to save text edit:', error);
      alert('Failed to save text changes. Please try again.');
    }
  }, [activeEdit, onTextEdit]);

  // Handle edit cancel
  const handleEditCancel = useCallback(() => {
    setActiveEdit(null);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && activeEdit) {
        handleEditCancel();
      } else if (event.key === 'e' && event.ctrlKey) {
        event.preventDefault();
        onToggleEditMode();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [activeEdit, handleEditCancel, onToggleEditMode]);

  if (!isEditMode) return null;

  return (
    <>
      {/* Main overlay for click detection */}
      <div
        ref={overlayRef}
        className={`click-to-edit-overlay ${isEditMode ? 'active' : ''}`}
        onClick={handleOverlayClick}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 50,
          cursor: activeEdit ? 'default' : 'text',
          pointerEvents: isEditMode ? 'auto' : 'none'
        }}
      >
        {/* Render text region highlights */}
        {currentPageRegions.map(region => (
          <div
            key={region.id}
            className={`text-region-highlight ${hoveredRegion === region.id ? 'hovered' : ''}`}
            onMouseEnter={() => setHoveredRegion(region.id)}
            onMouseLeave={() => setHoveredRegion(null)}
            style={{
              position: 'absolute',
              left: region.x * zoom,
              top: region.y * zoom,
              width: region.width * zoom,
              height: region.height * zoom,
              border: hoveredRegion === region.id ? '2px solid #007bff' : '1px dashed rgba(0, 123, 255, 0.6)',
              backgroundColor: hoveredRegion === region.id ? 'rgba(0, 123, 255, 0.2)' : 'rgba(0, 123, 255, 0.1)',
              borderRadius: '2px',
              pointerEvents: 'none',
              transition: 'all 0.2s ease'
            }}
            title={`Click to edit: "${region.originalText.substring(0, 50)}${region.originalText.length > 50 ? '...' : ''}"`}
          />
        ))}

        {/* Click feedback animation */}
        {clickFeedback && (
          <div
            className="click-feedback"
            style={{
              position: 'absolute',
              left: clickFeedback.x - 10,
              top: clickFeedback.y - 10,
              width: 20,
              height: 20,
              border: '2px solid #ff6b6b',
              borderRadius: '50%',
              backgroundColor: 'rgba(255, 107, 107, 0.2)',
              pointerEvents: 'none',
              animation: 'clickFeedback 0.8s ease-out forwards'
            }}
          />
        )}

        {/* Edit mode indicator */}
        <div className="edit-mode-indicator">
          <div className="indicator-content">
            <Edit3 size={16} />
            <span>Edit Mode Active</span>
            <div className="indicator-stats">
              {currentPageRegions.length} editable region{currentPageRegions.length !== 1 ? 's' : ''} on this page
            </div>
          </div>
          <div className="indicator-help">
            <MousePointer size={12} />
            <span>Click on highlighted text to edit • Ctrl+E to exit</span>
          </div>
        </div>
      </div>

      {/* Inline text editor */}
      {activeEdit && (
        <InlineTextEditor
          region={activeEdit.region}
          position={activeEdit.screenPosition}
          zoom={zoom}
          onSave={handleTextSave}
          onCancel={handleEditCancel}
        />
      )}

      {/* CSS Styles */}
      <style jsx>{`
        .click-to-edit-overlay {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }

        .text-region-highlight {
          box-sizing: border-box;
        }

        .text-region-highlight.hovered {
          transform: scale(1.02);
          box-shadow: 0 2px 8px rgba(0, 123, 255, 0.3);
        }

        @keyframes clickFeedback {
          0% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.5);
            opacity: 0.7;
          }
          100% {
            transform: scale(2);
            opacity: 0;
          }
        }

        .edit-mode-indicator {
          position: fixed;
          top: 20px;
          right: 20px;
          background: rgba(0, 0, 0, 0.85);
          color: white;
          padding: 12px 16px;
          border-radius: 8px;
          font-size: 14px;
          z-index: 1000;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
          min-width: 280px;
        }

        .indicator-content {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 6px;
        }

        .indicator-stats {
          margin-left: auto;
          font-size: 12px;
          color: #ccc;
        }

        .indicator-help {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          color: #aaa;
          border-top: 1px solid #444;
          padding-top: 6px;
        }

        @media (max-width: 768px) {
          .edit-mode-indicator {
            top: 10px;
            right: 10px;
            left: 10px;
            min-width: auto;
          }
        }

        /* Dark theme adjustments */
        @media (prefers-color-scheme: dark) {
          .text-region-highlight {
            border-color: #4dabf7;
            background-color: rgba(77, 171, 247, 0.15);
          }
          
          .text-region-highlight.hovered {
            border-color: #74c0fc;
            background-color: rgba(116, 192, 252, 0.25);
          }
        }
      `}</style>
    </>
  );
};

export default ClickToEditOverlay;