import ErrorHandler, { ExtendedAppError } from '../utils/ErrorHandler';

// Define error codes and their user-friendly messages
export const ERROR_CODES = {
  // File operation errors
  FILE_OPEN_FAILED: {
    code: 'FILE_OPEN_FAILED',
    message: 'Failed to open the selected file',
    userMessage: 'Unable to open the selected file. Please make sure the file exists and is accessible.'
  },
  FILE_SAVE_FAILED: {
    code: 'FILE_SAVE_FAILED',
    message: 'Failed to save the file',
    userMessage: 'Unable to save the file. Please check if you have permission to write to the selected location.'
  },
  FILE_TOO_LARGE: {
    code: 'FILE_TOO_LARGE',
    message: 'File is too large',
    userMessage: 'The selected file is too large. Please choose a smaller file (maximum 100MB).'
  },
  INVALID_FILE_PATH: {
    code: 'INVALID_FILE_PATH',
    message: 'Invalid file path',
    userMessage: 'The file path is invalid. Please select a valid file.'
  },
  
  // PDF processing errors
  PDF_LOAD_FAILED: {
    code: 'PDF_LOAD_FAILED',
    message: 'Failed to load PDF document',
    userMessage: 'Unable to load the PDF document. The file may be corrupted or in an unsupported format.'
  },
  PDF_PROCESSING_FAILED: {
    code: 'PDF_PROCESSING_FAILED',
    message: 'Failed to process PDF',
    userMessage: 'An error occurred while processing the PDF. Please try again or contact support.'
  },
  
  // OCR errors
  OCR_INITIALIZATION_FAILED: {
    code: 'OCR_INITIALIZATION_FAILED',
    message: 'Failed to initialize OCR engine',
    userMessage: 'Unable to initialize the OCR engine. Please make sure all required files are installed.'
  },
  OCR_PROCESSING_FAILED: {
    code: 'OCR_PROCESSING_FAILED',
    message: 'Failed to perform OCR',
    userMessage: 'OCR processing failed. Please try again with a different page or document.'
  },
  
  // Network errors
  NETWORK_ERROR: {
    code: 'NETWORK_ERROR',
    message: 'Network error occurred',
    userMessage: 'A network error occurred. Please check your internet connection and try again.'
  },
  
  // Memory errors
  OUT_OF_MEMORY: {
    code: 'OUT_OF_MEMORY',
    message: 'Out of memory',
    userMessage: 'The application ran out of memory. Please close other applications and try again with a smaller file.'
  },
  
  // General errors
  UNKNOWN_ERROR: {
    code: 'UNKNOWN_ERROR',
    message: 'An unknown error occurred',
    userMessage: 'An unexpected error occurred. Please try again or restart the application.'
  },
  UNAUTHORIZED_ACCESS: {
    code: 'UNAUTHORIZED_ACCESS',
    message: 'Unauthorized access attempt',
    userMessage: 'You do not have permission to perform this action.'
  }
};

// Define log levels
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

// Define log entry structure
export interface LogEntry {
  level: LogLevel;
  message: string;
  code?: string;
  timestamp: Date;
  metadata?: Record<string, any>;
  stack?: string;
}

// Define error structure
export interface AppError extends Error {
  code?: string;
  userMessage?: string;
  metadata?: Record<string, any>;
}

export class LoggerService {
  private static instance: LoggerService;
  private logs: LogEntry[] = [];
  private maxLogs = 1000;

  private constructor() {}

  static getInstance(): LoggerService {
    if (!LoggerService.instance) {
      LoggerService.instance = new LoggerService();
    }
    return LoggerService.instance;
  }

  // Log a message
  log(level: LogLevel, message: string, metadata?: Record<string, any>): void {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date(),
      metadata
    };

    this.addLogEntry(entry);
    this.outputToConsole(entry);
  }

  // Log debug message
  debug(message: string, metadata?: Record<string, any>): void {
    this.log('debug', message, metadata);
  }

  // Log info message
  info(message: string, metadata?: Record<string, any>): void {
    this.log('info', message, metadata);
  }

  // Log warning message
  warn(message: string, metadata?: Record<string, any>): void {
    this.log('warn', message, metadata);
  }

  // Log error message
  error(message: string, error?: AppError | Error, metadata?: Record<string, any>): void {
    const entry: LogEntry = {
      level: 'error',
      message,
      timestamp: new Date(),
      metadata,
      code: error && 'code' in error ? error.code : undefined,
      stack: error ? error.stack : undefined
    };

    this.addLogEntry(entry);
    this.outputToConsole(entry);
    
    // Send error to main process for logging
    if (typeof window !== 'undefined' && (window as any).electronAPI) {
      // Note: This would need to be implemented in preload.ts if needed
      console.log('📤 Error logged to main process:', entry.message);
    }
  }

  // Log an application error with structured information
  logError(error: AppError | ExtendedAppError, context?: string): void {
    // Handle extended errors
    const extendedError = ErrorHandler.handle(error, context);
    
    const entry: LogEntry = {
      level: 'error',
      message: extendedError.message || 'An error occurred',
      timestamp: extendedError.timestamp || new Date(),
      code: extendedError.code,
      metadata: {
        ...extendedError.metadata,
        context: extendedError.context,
        category: extendedError.category,
        severity: extendedError.severity
      },
      stack: extendedError.stack
    };

    this.addLogEntry(entry);
    this.outputToConsole(entry);
    
    // Send error to main process for logging
    if (typeof window !== 'undefined' && (window as any).electronAPI) {
      // Note: This would need to be implemented in preload.ts if needed
      console.log('📤 Error logged to main process:', entry.message);
    }
  }

  // Get error information by code
  getErrorInfo(code: string): { message: string; userMessage: string } | null {
    const errorInfo = Object.values(ERROR_CODES).find(e => e.code === code);
    return errorInfo || null;
  }

  // Get all logs
  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  // Clear logs
  clearLogs(): void {
    this.logs = [];
  }

  // Export logs to string
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  // Add log entry to internal storage
  private addLogEntry(entry: LogEntry): void {
    this.logs.push(entry);
    
    // Keep only the most recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }
  }

  // Output log entry to console
  private outputToConsole(entry: LogEntry): void {
    const timestamp = entry.timestamp.toISOString();
    const prefix = `[${timestamp}] [${entry.level.toUpperCase()}]`;
    
    switch (entry.level) {
      case 'debug':
        console.debug(`${prefix} ${entry.message}`, entry.metadata || '');
        break;
      case 'info':
        console.info(`${prefix} ${entry.message}`, entry.metadata || '');
        break;
      case 'warn':
        console.warn(`${prefix} ${entry.message}`, entry.metadata || '');
        break;
      case 'error':
        console.error(`${prefix} ${entry.message}`, entry.metadata || '', entry.stack || '');
        break;
    }
  }
}

// Create a default instance
export const logger = LoggerService.getInstance();

// Helper function to create structured errors
export function createAppError(
  code: string, 
  message?: string, 
  metadata?: Record<string, any>
): AppError {
  const errorInfo = logger.getErrorInfo(code);
  const error = new Error(message || errorInfo?.message || 'An error occurred') as AppError;
  error.code = code;
  error.userMessage = errorInfo?.userMessage;
  error.metadata = metadata;
  return error;
}

// Helper function to wrap async operations with error handling
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  errorCode: string,
  context?: string
): Promise<T | null> {
  try {
    return await operation();
  } catch (error: any) {
    const appError: AppError = {
      ...error,
      code: error.code || errorCode,
      userMessage: error.userMessage || logger.getErrorInfo(errorCode)?.userMessage,
      metadata: {
        ...error.metadata,
        context
      }
    };
    
    logger.logError(appError, context);
    return null;
  }
}

export default LoggerService;