import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log the error to an error reporting service
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
    
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  private handleReload = () => {
    window.location.reload();
  };

  private handleReportError = () => {
    const { error, errorInfo } = this.state;
    const errorData = {
      error: error?.toString(),
      componentStack: errorInfo?.componentStack,
      userAgent: window.navigator.userAgent,
      timestamp: new Date().toISOString(),
    };

    // In a real app, you would send this to your error tracking service
    console.log('Error report:', errorData);
    
    // For now, just show a message
    alert('Thank you for reporting the error. We will look into it!');
  };

  public render() {
    const { children } = this.props;
    const { hasError, error, errorInfo } = this.state;

    if (!hasError) {
      return children;
    }

    const styles = {
      errorBoundary: {
        display: 'flex',
        flexDirection: 'column' as const,
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        padding: '24px',
        textAlign: 'center' as const,
        backgroundColor: 'var(--bg-primary)',
        color: 'var(--text-primary)',
      },
      errorIcon: {
        fontSize: '4rem',
        marginBottom: '16px',
        color: '#f44336',
      },
      errorMessage: {
        margin: '16px 0',
        padding: '16px',
        backgroundColor: 'rgba(244, 67, 54, 0.1)',
        borderRadius: '4px',
        fontFamily: 'monospace',
        whiteSpace: 'pre-wrap' as const,
        textAlign: 'left' as const,
        maxWidth: '800px',
        maxHeight: '300px',
        overflow: 'auto',
        border: '1px solid rgba(244, 67, 54, 0.3)',
      },
      buttonGroup: {
        marginTop: '24px',
        display: 'flex',
        gap: '8px',
      },
      button: {
        padding: '8px 16px',
        borderRadius: '4px',
        border: 'none',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: 500,
        transition: 'background-color 0.3s',
      },
      buttonPrimary: {
        backgroundColor: '#1976d2',
        color: 'white',
      },
      buttonSecondary: {
        backgroundColor: 'transparent',
        color: '#1976d2',
        border: '1px solid #1976d2',
      },
      buttonDanger: {
        backgroundColor: 'transparent',
        color: '#f44336',
        border: '1px solid #f44336',
      }
    };

    return (
      <div style={styles.errorBoundary}>
        <div style={styles.errorIcon}>⚠️</div>
        <h1>Something went wrong</h1>
        <p>We're sorry for the inconvenience. An error has occurred in the application.</p>
        
        {process.env.NODE_ENV === 'development' && (
          <div style={styles.errorMessage}>
            <h3>Error Details:</h3>
            <p><strong>Error:</strong> {error?.toString()}</p>
            <details style={{ whiteSpace: 'pre-wrap' }}>
              <summary>Component Stack</summary>
              {errorInfo?.componentStack}
            </details>
          </div>
        )}
        
        <div style={styles.buttonGroup}>
          <button 
            style={{...styles.button, ...styles.buttonPrimary}}
            onClick={this.handleReset}
          >
            Try Again
          </button>
          
          <button 
            style={{...styles.button, ...styles.buttonSecondary}}
            onClick={this.handleReload}
          >
            Reload Application
          </button>
          
          <button 
            style={{...styles.button, ...styles.buttonDanger}}
            onClick={this.handleReportError}
          >
            Report Error
          </button>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
