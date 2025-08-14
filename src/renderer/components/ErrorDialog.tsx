import React from 'react';
import './ErrorDialog.css';

interface ErrorDialogProps {
  title: string;
  message: string;
  details?: string;
  onClose: () => void;
  onRetry?: () => void;
}

const ErrorDialog: React.FC<ErrorDialogProps> = ({
  title,
  message,
  details,
  onClose,
  onRetry
}) => {
  return (
    <div className="error-dialog-overlay">
      <div className="error-dialog">
        <div className="error-dialog-header">
          <h2>{title}</h2>
          <button className="error-dialog-close" onClick={onClose}>
            ×
          </button>
        </div>
        
        <div className="error-dialog-body">
          <div className="error-icon">⚠️</div>
          <p className="error-message">{message}</p>
          
          {details && (
            <details className="error-details">
              <summary>Technical Details</summary>
              <pre>{details}</pre>
            </details>
          )}
        </div>
        
        <div className="error-dialog-footer">
          {onRetry && (
            <button className="error-dialog-button retry" onClick={onRetry}>
              Try Again
            </button>
          )}
          <button className="error-dialog-button close" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ErrorDialog;