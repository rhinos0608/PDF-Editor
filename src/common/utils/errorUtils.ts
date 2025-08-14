/**
 * Error Utility Functions
 * Consolidated error handling utilities used throughout the application
 */

/**
 * Custom error types for better error handling
 */
export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly context?: Record<string, any>;

  constructor(
    message: string,
    code: string = 'GENERIC_ERROR',
    statusCode: number = 500,
    isOperational: boolean = true,
    context?: Record<string, any>
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.context = context;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, field?: string) {
    super(message, 'VALIDATION_ERROR', 400, true, { field });
  }
}

export class FileError extends AppError {
  constructor(message: string, operation: string, filePath?: string) {
    super(message, 'FILE_ERROR', 500, true, { operation, filePath });
  }
}

export class PDFError extends AppError {
  constructor(message: string, operation: string, pdfPath?: string) {
    super(message, 'PDF_ERROR', 500, true, { operation, pdfPath });
  }
}

export class NetworkError extends AppError {
  constructor(message: string, url?: string, statusCode?: number) {
    super(message, 'NETWORK_ERROR', statusCode || 500, true, { url });
  }
}

export class SecurityError extends AppError {
  constructor(message: string, operation: string) {
    super(message, 'SECURITY_ERROR', 403, true, { operation });
  }
}

/**
 * Error severity levels
 */
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

/**
 * Error information interface
 */
export interface ErrorInfo {
  error: Error;
  severity: ErrorSeverity;
  userMessage: string;
  technicalDetails: string;
  shouldRetry: boolean;
  retryAfter?: number;
  suggestedActions?: string[];
}

/**
 * Safe error message extraction
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'An unknown error occurred';
}

/**
 * Safe error stack extraction
 */
export function getErrorStack(error: unknown): string {
  if (error instanceof Error && error.stack) {
    return error.stack;
  }
  return 'No stack trace available';
}

/**
 * Create user-friendly error information
 */
export function createErrorInfo(
  error: unknown,
  operation: string,
  severity: ErrorSeverity = ErrorSeverity.MEDIUM
): ErrorInfo {
  const message = getErrorMessage(error);
  const stack = getErrorStack(error);

  // Determine user-friendly message based on error type
  let userMessage = 'An unexpected error occurred';
  let shouldRetry = false;
  let suggestedActions: string[] = [];

  if (error instanceof ValidationError) {
    userMessage = `Invalid input: ${message}`;
    suggestedActions = ['Please check your input and try again'];
  } else if (error instanceof FileError) {
    userMessage = `File operation failed: ${message}`;
    shouldRetry = true;
    suggestedActions = ['Check file permissions', 'Ensure file is not in use'];
  } else if (error instanceof PDFError) {
    userMessage = `PDF processing failed: ${message}`;
    suggestedActions = ['Verify PDF is not corrupted', 'Try with a different PDF file'];
  } else if (error instanceof NetworkError) {
    userMessage = 'Network connection failed';
    shouldRetry = true;
    suggestedActions = ['Check internet connection', 'Try again in a few moments'];
  } else if (error instanceof SecurityError) {
    userMessage = 'Access denied for security reasons';
    suggestedActions = ['Contact administrator if you believe this is an error'];
  } else if (message.includes('ENOENT')) {
    userMessage = 'File not found';
    suggestedActions = ['Check if the file exists', 'Verify the file path'];
  } else if (message.includes('EACCES')) {
    userMessage = 'Permission denied';
    suggestedActions = ['Check file permissions', 'Try running as administrator'];
  } else if (message.includes('timeout') || message.includes('ETIMEDOUT')) {
    userMessage = 'Operation timed out';
    shouldRetry = true;
    suggestedActions = ['Try again', 'Check network connection'];
  }

  return {
    error: error instanceof Error ? error : new Error(message),
    severity,
    userMessage,
    technicalDetails: `Operation: ${operation}\nError: ${message}\nStack: ${stack}`,
    shouldRetry,
    suggestedActions
  };
}

/**
 * Log error with context
 */
export function logError(errorInfo: ErrorInfo): void {
  const logLevel = {
    [ErrorSeverity.LOW]: 'warn',
    [ErrorSeverity.MEDIUM]: 'error',
    [ErrorSeverity.HIGH]: 'error',
    [ErrorSeverity.CRITICAL]: 'error'
  }[errorInfo.severity];

  console[logLevel]('Error occurred:', {
    message: errorInfo.error.message,
    severity: errorInfo.severity,
    userMessage: errorInfo.userMessage,
    stack: errorInfo.error.stack,
    suggestedActions: errorInfo.suggestedActions
  });
}

/**
 * Async error wrapper for safe promise handling
 */
export async function safeAsync<T>(
  operation: () => Promise<T>,
  operationName: string,
  fallbackValue?: T
): Promise<{ success: true; data: T } | { success: false; error: ErrorInfo }> {
  try {
    const data = await operation();
    return { success: true, data };
  } catch (error) {
    const errorInfo = createErrorInfo(error, operationName);
    logError(errorInfo);
    
    if (fallbackValue !== undefined) {
      return { success: true, data: fallbackValue };
    }
    
    return { success: false, error: errorInfo };
  }
}

/**
 * Sync error wrapper for safe synchronous operations
 */
export function safeSync<T>(
  operation: () => T,
  operationName: string,
  fallbackValue?: T
): { success: true; data: T } | { success: false; error: ErrorInfo } {
  try {
    const data = operation();
    return { success: true, data };
  } catch (error) {
    const errorInfo = createErrorInfo(error, operationName);
    logError(errorInfo);
    
    if (fallbackValue !== undefined) {
      return { success: true, data: fallbackValue };
    }
    
    return { success: false, error: errorInfo };
  }
}

/**
 * Retry function with exponential backoff
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  operationName: string,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      if (attempt === maxRetries) {
        break;
      }

      // Exponential backoff: baseDelay * 2^attempt
      const delay = baseDelay * Math.pow(2, attempt);
      console.warn(`${operationName} failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${delay}ms...`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

/**
 * Create error boundary for React components
 */
export function createErrorBoundaryError(error: Error, errorInfo: { componentStack: string }) {
  return new AppError(
    `Component error: ${error.message}`,
    'COMPONENT_ERROR',
    500,
    true,
    {
      originalError: error.message,
      componentStack: errorInfo.componentStack,
      stack: error.stack
    }
  );
}

/**
 * Check if error is operational (expected) or programming error
 */
export function isOperationalError(error: unknown): boolean {
  if (error instanceof AppError) {
    return error.isOperational;
  }
  
  // Common operational errors
  const operationalErrors = [
    'ENOENT', 'EACCES', 'ETIMEDOUT', 'ECONNRESET', 
    'ENOTFOUND', 'EMFILE', 'ENOMEM'
  ];
  
  const message = getErrorMessage(error);
  return operationalErrors.some(code => message.includes(code));
}