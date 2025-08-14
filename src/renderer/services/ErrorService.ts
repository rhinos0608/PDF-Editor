import { ipcRenderer } from 'electron';
import { toast } from 'react-toastify';

type ErrorLevel = 'info' | 'warning' | 'error' | 'critical';

interface ErrorContext {
  componentStack?: string;
  userActions?: string[];
  metadata?: Record<string, unknown>;
}

class ErrorService {
  private static instance: ErrorService;
  private errorListeners: Array<(error: Error, context?: ErrorContext) => void> = [];
  private isInitialized = false;

  private constructor() {
    // Private constructor to enforce singleton
  }

  public static getInstance(): ErrorService {
    if (!ErrorService.instance) {
      ErrorService.instance = new ErrorService();
    }
    return ErrorService.instance;
  }

  public initialize(): void {
    if (this.isInitialized) return;

    // Handle uncaught errors
    window.addEventListener('error', (event) => {
      this.handleError(event.error || new Error(event.message), {
        componentStack: event.filename,
      });
    });

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      const error = event.reason instanceof Error 
        ? event.reason 
        : new Error(String(event.reason));
      
      this.handleError(error, {
        componentStack: 'Unhandled promise rejection',
      });
    });

    this.isInitialized = true;
  }

  public handleError(
    error: Error | string,
    context: ErrorContext = {},
    level: ErrorLevel = 'error'
  ): void {
    const errorObj = typeof error === 'string' ? new Error(error) : error;
    
    // Log to console for development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error handled by ErrorService:', errorObj, context);
    }

    // Notify listeners
    this.errorListeners.forEach(listener => {
      try {
        listener(errorObj, context);
      } catch (listenerError) {
        console.error('Error in error listener:', listenerError);
      }
    });

    // Show toast notification
    this.showErrorToast(errorObj, level);

    // Send to main process for logging
    this.logToMainProcess(errorObj, context, level);
  }

  public addErrorListener(listener: (error: Error, context?: ErrorContext) => void): () => void {
    this.errorListeners.push(listener);
    return () => {
      this.errorListeners = this.errorListeners.filter(l => l !== listener);
    };
  }

  private showErrorToast(error: Error, level: ErrorLevel): void {
    const message = error.message || 'An unknown error occurred';
    const options = {
      position: 'top-right' as const,
      autoClose: level === 'error' || level === 'critical' ? 10000 : 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
    };

    switch (level) {
      case 'info':
        toast.info(message, options);
        break;
      case 'warning':
        toast.warn(message, options);
        break;
      case 'critical':
        toast.error(`Critical: ${message}`, {
          ...options,
          autoClose: false,
        });
        break;
      case 'error':
      default:
        toast.error(message, options);
        break;
    }
  }

  private logToMainProcess(
    error: Error,
    context: ErrorContext,
    level: ErrorLevel
  ): void {
    try {
      ipcRenderer.send('log-error', {
        timestamp: new Date().toISOString(),
        level,
        message: error.message,
        stack: error.stack,
        name: error.name,
        context: {
          ...context,
          userAgent: navigator.userAgent,
          url: window.location.href,
        },
      });
    } catch (e) {
      console.error('Failed to send error to main process:', e);
    }
  }

  // Helper methods for common error types
  public handleNetworkError(error: Error, operation: string): void {
    this.handleError(
      new Error(`Network error during ${operation}: ${error.message}`),
      { metadata: { operation } },
      'error'
    );
  }

  public handleFileError(error: Error, operation: string, filePath?: string): void {
    this.handleError(
      new Error(`File ${operation} failed: ${error.message}`),
      { 
        metadata: { 
          operation,
          filePath,
        },
      },
      'error'
    );
  }

  public handlePdfError(error: Error, operation: string): void {
    this.handleError(
      new Error(`PDF operation failed (${operation}): ${error.message}`),
      { metadata: { operation } },
      'error'
    );
  }
}

export const errorService = ErrorService.getInstance();

// Initialize the error service when imported
if (typeof window !== 'undefined') {
  errorService.initialize();
}
