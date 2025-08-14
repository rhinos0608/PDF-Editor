import React from 'react';
import { PDFDocumentProxy } from 'pdfjs-dist/types/src/display/api';
import './PropertiesPanel.css';

interface PropertiesPanelProps {
  pdf: PDFDocumentProxy;
  fileName: string;
  fileSize: number;
}

const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  pdf,
  fileName,
  fileSize
}) => {
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getMetadata = async () => {
    try {
      const metadata = await pdf.getMetadata();
      return metadata;
    } catch (error) {
      return null;
    }
  };

  const [metadata, setMetadata] = React.useState<any>(null);

  React.useEffect(() => {
    getMetadata().then(setMetadata);
  }, [pdf]);

  return (
    <div className="properties-panel">
      <div className="properties-header">
        <h3>Document Properties</h3>
      </div>
      <div className="properties-content">
        <div className="property-group">
          <h4>File Information</h4>
          <div className="property-item">
            <span className="property-label">File Name:</span>
            <span className="property-value">{fileName}</span>
          </div>
          <div className="property-item">
            <span className="property-label">File Size:</span>
            <span className="property-value">{formatFileSize(fileSize)}</span>
          </div>
          <div className="property-item">
            <span className="property-label">Page Count:</span>
            <span className="property-value">{pdf.numPages}</span>
          </div>
        </div>

        {metadata && metadata.info && (
          <div className="property-group">
            <h4>Document Metadata</h4>
            {metadata.info.Title && (
              <div className="property-item">
                <span className="property-label">Title:</span>
                <span className="property-value">{metadata.info.Title}</span>
              </div>
            )}
            {metadata.info.Author && (
              <div className="property-item">
                <span className="property-label">Author:</span>
                <span className="property-value">{metadata.info.Author}</span>
              </div>
            )}
            {metadata.info.Subject && (
              <div className="property-item">
                <span className="property-label">Subject:</span>
                <span className="property-value">{metadata.info.Subject}</span>
              </div>
            )}
            {metadata.info.Keywords && (
              <div className="property-item">
                <span className="property-label">Keywords:</span>
                <span className="property-value">{metadata.info.Keywords}</span>
              </div>
            )}
            {metadata.info.Creator && (
              <div className="property-item">
                <span className="property-label">Creator:</span>
                <span className="property-value">{metadata.info.Creator}</span>
              </div>
            )}
            {metadata.info.Producer && (
              <div className="property-item">
                <span className="property-label">Producer:</span>
                <span className="property-value">{metadata.info.Producer}</span>
              </div>
            )}
            {metadata.info.CreationDate && (
              <div className="property-item">
                <span className="property-label">Created:</span>
                <span className="property-value">
                  {new Date(metadata.info.CreationDate).toLocaleString()}
                </span>
              </div>
            )}
            {metadata.info.ModDate && (
              <div className="property-item">
                <span className="property-label">Modified:</span>
                <span className="property-value">
                  {new Date(metadata.info.ModDate).toLocaleString()}
                </span>
              </div>
            )}
          </div>
        )}

        <div className="property-group">
          <h4>Security</h4>
          <div className="property-item">
            <span className="property-label">Encrypted:</span>
            <span className="property-value">
              {pdf.filterFactory ? 'Yes' : 'No'}
            </span>
          </div>
          <div className="property-item">
            <span className="property-label">Permissions:</span>
            <span className="property-value">All</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertiesPanel;
