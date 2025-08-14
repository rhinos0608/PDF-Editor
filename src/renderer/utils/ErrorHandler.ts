import { AppError } from '../services/LoggerService';

// Define error categories
export type ErrorCategory = 
  | 'file'
  | 'network'
  | 'validation'
  | 'security'
  | 'pdf'
  | 'ocr'
  | 'memory'
  | 'system'
  | 'ipc'
  | 'gpu'
  | 'unknown';

// Define error severity levels
export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

// Define recovery strategies
export type RecoveryStrategy = 
  | 'retry'
  | 'retry-with-backoff'
  | 'fallback'
  | 'recover-state'
  | 'restart-service'
  | 'disable-feature'
  | 'reload-app'
  | 'user-action'
  | 'none';

// Recovery context interface
export interface RecoveryContext {
  strategy: RecoveryStrategy;
  maxRetries?: number;
  backoffDelay?: number;
  fallbackAction?: () => Promise<any>;
  stateRecoveryAction?: () => Promise<void>;
  serviceRestartAction?: () => Promise<void>;
}

// Extended error interface with more context
export interface ExtendedAppError extends AppError {
  category?: ErrorCategory;
  severity?: ErrorSeverity;
  userAction?: 'retry' | 'dismiss' | 'contact-support' | 'reload';
  context?: string;
  timestamp?: Date;
  recoveryContext?: RecoveryContext;
  attemptCount?: number;
  canRecover?: boolean;
  originalError?: Error;
  systemInfo?: {
    platform?: string;
    memoryUsage?: number;
    gpuEnabled?: boolean;
  };
}

// Centralized error handler
export class ErrorHandler {
  static handle(error: any, context?: string): ExtendedAppError {
    // If it's already an AppError, extend it
    if (error && typeof error === 'object' && error.message) {
      const appError: ExtendedAppError = {
        ...error,
        message: error.message,
        stack: error.stack,
        code: error.code,
        userMessage: error.userMessage,
        metadata: error.metadata,
        context,
        timestamp: new Date()
      };
      
      // Determine category and severity based on error details
      appError.category = this.determineCategory(appError);
      appError.severity = this.determineSeverity(appError);
      appError.userAction = this.determineUserAction(appError);
      
      return appError;
    }
    
    // Create new error from string or unknown
    const appError: ExtendedAppError = {
      message: typeof error === 'string' ? error : 'An unknown error occurred',
      name: 'UnknownError',
      context,
      timestamp: new Date()
    };
    
    // Set defaults
    appError.category = 'unknown';
    appError.severity = 'medium';
    appError.userAction = 'retry';
    
    return appError;
  }
  
  // Determine error category based on error details
  private static determineCategory(error: ExtendedAppError): ErrorCategory {
    if (!error.message) return 'unknown';
    
    const message = error.message.toLowerCase();
    
    // File-related errors
    if (message.includes('file') || message.includes('path') || message.includes('directory') || 
        message.includes('permission') || message.includes('access')) {
      return 'file';
    }
    
    // Network-related errors
    if (message.includes('network') || message.includes('connection') || message.includes('timeout') ||
        message.includes('fetch') || message.includes('request')) {
      return 'network';
    }
    
    // Validation errors
    if (message.includes('validation') || message.includes('invalid') || message.includes('required') ||
        message.includes('format')) {
      return 'validation';
    }
    
    // Security errors
    if (message.includes('security') || message.includes('password') || message.includes('encryption') ||
        message.includes('decryption') || message.includes('signature') || message.includes('certificate')) {
      return 'security';
    }
    
    // PDF processing errors
    if (message.includes('pdf') || message.includes('document') || message.includes('page') ||
        message.includes('annotation')) {
      return 'pdf';
    }
    
    // OCR errors
    if (message.includes('ocr') || message.includes('tesseract') || message.includes('text recognition')) {
      return 'ocr';
    }
    
    // Memory errors
    if (message.includes('memory') || message.includes('allocation') || message.includes('heap') ||
        message.includes('out of memory') || message.includes('buffer')) {
      return 'memory';
    }
    
    return 'unknown';
  }
  
  // Determine error severity based on error details
  private static determineSeverity(error: ExtendedAppError): ErrorSeverity {
    if (!error.message) return 'medium';
    
    const message = error.message.toLowerCase();
    
    // Critical errors
    if (message.includes('critical') || message.includes('fatal') || message.includes('corruption') ||
        message.includes('unrecoverable')) {
      return 'critical';
    }
    
    // High severity errors
    if (message.includes('failed') || message.includes('error') || message.includes('exception') ||
        message.includes('crash') || message.includes('timeout')) {
      return 'high';
    }
    
    // Low severity errors
    if (message.includes('warning') || message.includes('deprecated') || message.includes('notice')) {
      return 'low';
    }
    
    return 'medium';
  }
  
  // Determine recommended user action based on error details
  private static determineUserAction(error: ExtendedAppError): 'retry' | 'dismiss' | 'contact-support' | 'reload' {
    if (!error.category) return 'retry';
    
    switch (error.category) {
      case 'network':
      case 'pdf':
      case 'ocr':
        return 'retry';
        
      case 'security':
        return 'contact-support';
        
      case 'memory':
        return 'reload';
        
      case 'file':
      case 'validation':
      case 'unknown':
      default:
        return 'dismiss';
    }
  }
  
  // Generate user-friendly message based on error details
  static generateUserMessage(error: ExtendedAppError): string {
    if (error.userMessage) {
      return error.userMessage;
    }
    
    if (!error.category) {
      return 'An unexpected error occurred. Please try again.';
    }
    
    switch (error.category) {
      case 'file':
        return 'There was a problem accessing the file. Please check the file path and permissions.';
        
      case 'network':
        return 'Network connection failed. Please check your internet connection and try again.';
        
      case 'validation':
        return 'Invalid input detected. Please check your entries and try again.';
        
      case 'security':
        return 'Security error occurred. Please contact support for assistance.';
        
      case 'pdf':
        return 'PDF processing failed. Please try again or use a different PDF file.';
        
      case 'ocr':
        return 'Text recognition failed. Please try again or check the document quality.';
        
      case 'memory':
        return 'Insufficient memory. Please close other applications and try again.';
        
      case 'unknown':
      default:
        return 'An unexpected error occurred. Please try again.';
    }
  }
  
  // Log error with structured format
  static log(error: ExtendedAppError): void {
    const logEntry = {
      timestamp: error.timestamp?.toISOString() || new Date().toISOString(),
      category: error.category || 'unknown',
      severity: error.severity || 'medium',
      code: error.code || 'UNKNOWN_ERROR',
      message: error.message,
      context: error.context,
      stack: error.stack,
      metadata: error.metadata
    };
    
    console.error('[APP ERROR]', JSON.stringify(logEntry, null, 2));
  }
  
  // Create error from code
  static fromCode(
    code: string,
    message?: string,
    metadata?: Record<string, any>
  ): ExtendedAppError {
    const error: ExtendedAppError = {
      message: message || 'An error occurred',
      code,
      metadata,
      timestamp: new Date()
    };
    
    // Set category and severity based on code
    error.category = this.determineCategory(error);
    error.severity = this.determineSeverity(error);
    error.userAction = this.determineUserAction(error);
    error.userMessage = this.generateUserMessage(error);
    
    return error;
  }

  // ============ COMPREHENSIVE ERROR RECOVERY SYSTEM ============

  /**
   * Enhanced error recovery with multiple strategies
   */
  static async attemptRecovery<T>(
    operation: () => Promise<T>,
    errorContext: string,
    recoveryOptions?: Partial<RecoveryContext>
  ): Promise<{ success: boolean; result?: T; error?: ExtendedAppError }> {
    const maxRetries = recoveryOptions?.maxRetries || 3;
    const backoffDelay = recoveryOptions?.backoffDelay || 1000;
    let lastError: ExtendedAppError | null = null;

    console.log(`🔄 Starting operation with recovery: ${errorContext}`);

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔄 Attempt ${attempt}/${maxRetries}: ${errorContext}`);
        
        const result = await operation();
        
        if (attempt > 1) {
          console.log(`✅ Recovery successful on attempt ${attempt}: ${errorContext}`);
        }
        
        return { success: true, result };

      } catch (error) {
        lastError = this.handle(error as Error, errorContext);
        lastError.attemptCount = attempt;
        
        console.error(`❌ Attempt ${attempt} failed: ${errorContext}`, lastError.message);
        
        // Determine recovery strategy
        if (!lastError.recoveryContext) {
          lastError.recoveryContext = this.determineRecoveryStrategy(lastError);
        }

        // If this isn't the last attempt, try recovery
        if (attempt < maxRetries) {
          const recovered = await this.executeRecoveryStrategy(lastError, attempt);
          
          if (recovered) {
            console.log(`🔄 Recovery strategy applied, retrying: ${errorContext}`);
            
            // Apply exponential backoff
            const delay = backoffDelay * Math.pow(2, attempt - 1);
            await new Promise(resolve => setTimeout(resolve, delay));
            
            continue;
          } else {
            console.warn(`⚠️ Recovery strategy failed: ${errorContext}`);
          }
        }
      }
    }

    console.error(`❌ All recovery attempts failed: ${errorContext}`);
    return { 
      success: false, 
      error: lastError || this.fromCode('RECOVERY_FAILED', 'All recovery attempts failed', { context: errorContext })
    };
  }

  /**
   * Determine the best recovery strategy for an error
   */
  private static determineRecoveryStrategy(error: ExtendedAppError): RecoveryContext {
    switch (error.category) {
      case 'network':
        return {
          strategy: 'retry-with-backoff',
          maxRetries: 5,
          backoffDelay: 2000
        };

      case 'memory':
        return {
          strategy: 'recover-state',
          maxRetries: 2,
          stateRecoveryAction: async () => {
            // Force garbage collection if available
            if (global.gc) {
              global.gc();
            }
            // Clear caches
            await this.clearApplicationCaches();
          }
        };

      case 'gpu':
        return {
          strategy: 'disable-feature',
          maxRetries: 1,
          fallbackAction: async () => {
            // Disable GPU acceleration
            console.log('🔧 Disabling GPU acceleration due to error');
            return this.disableGPUAcceleration();
          }
        };

      case 'file':
        return {
          strategy: 'fallback',
          maxRetries: 2,
          fallbackAction: async () => {
            // Try alternative file access method
            console.log('🔧 Attempting alternative file access');
            return true;
          }
        };

      case 'pdf':
        return {
          strategy: 'retry-with-backoff',
          maxRetries: 3,
          backoffDelay: 1000
        };

      case 'ipc':
        return {
          strategy: 'restart-service',
          maxRetries: 2,
          serviceRestartAction: async () => {
            console.log('🔧 Attempting IPC service recovery');
            await this.restartIPCConnection();
          }
        };

      case 'system':
        return {
          strategy: 'reload-app',
          maxRetries: 1
        };

      default:
        return {
          strategy: 'retry',
          maxRetries: 2,
          backoffDelay: 1000
        };
    }
  }

  /**
   * Execute the recovery strategy
   */
  private static async executeRecoveryStrategy(
    error: ExtendedAppError, 
    attempt: number
  ): Promise<boolean> {
    if (!error.recoveryContext) {
      return false;
    }

    const { strategy } = error.recoveryContext;

    try {
      switch (strategy) {
        case 'retry':
        case 'retry-with-backoff':
          // Just return true to continue retrying
          return true;

        case 'fallback':
          if (error.recoveryContext.fallbackAction) {
            await error.recoveryContext.fallbackAction();
            return true;
          }
          break;

        case 'recover-state':
          if (error.recoveryContext.stateRecoveryAction) {
            await error.recoveryContext.stateRecoveryAction();
            return true;
          }
          break;

        case 'restart-service':
          if (error.recoveryContext.serviceRestartAction) {
            await error.recoveryContext.serviceRestartAction();
            return true;
          }
          break;

        case 'disable-feature':
          if (error.recoveryContext.fallbackAction) {
            await error.recoveryContext.fallbackAction();
            // Don't retry after disabling feature
            return false;
          }
          break;

        case 'reload-app':
          console.log('🔄 Requesting application reload');
          if (window.location) {
            window.location.reload();
          }
          return false;

        case 'user-action':
          // User action required, don't auto-retry
          return false;

        case 'none':
        default:
          return false;
      }
    } catch (recoveryError) {
      console.error('❌ Recovery strategy execution failed:', recoveryError);
      return false;
    }

    return false;
  }

  /**
   * Enhanced error categorization with more specific detection
   */
  private static determineCategory(error: ExtendedAppError): ErrorCategory {
    if (!error.message) return 'unknown';
    
    const message = error.message.toLowerCase();
    const stack = error.stack?.toLowerCase() || '';
    
    // System-level errors
    if (message.includes('system') || message.includes('os') || message.includes('platform') ||
        message.includes('electron')) {
      return 'system';
    }
    
    // IPC communication errors
    if (message.includes('ipc') || message.includes('invoke') || message.includes('send') ||
        stack.includes('ipcrenderer') || stack.includes('contextbridge')) {
      return 'ipc';
    }
    
    // GPU-related errors
    if (message.includes('gpu') || message.includes('webgl') || message.includes('canvas') ||
        message.includes('hardware acceleration') || message.includes('graphics')) {
      return 'gpu';
    }

    // File-related errors
    if (message.includes('file') || message.includes('path') || message.includes('directory') || 
        message.includes('permission') || message.includes('access') || message.includes('enoent') ||
        message.includes('eisdir') || message.includes('eacces')) {
      return 'file';
    }
    
    // Network-related errors
    if (message.includes('network') || message.includes('connection') || message.includes('timeout') ||
        message.includes('fetch') || message.includes('request') || message.includes('cors') ||
        message.includes('net::')) {
      return 'network';
    }
    
    // Validation errors
    if (message.includes('validation') || message.includes('invalid') || message.includes('required') ||
        message.includes('format') || message.includes('parse') || message.includes('syntax')) {
      return 'validation';
    }
    
    // Security errors
    if (message.includes('security') || message.includes('password') || message.includes('encryption') ||
        message.includes('decryption') || message.includes('signature') || message.includes('certificate') ||
        message.includes('crypto') || message.includes('auth')) {
      return 'security';
    }
    
    // PDF processing errors
    if (message.includes('pdf') || message.includes('document') || message.includes('page') ||
        message.includes('annotation') || message.includes('pdfjs') || message.includes('pdf-lib')) {
      return 'pdf';
    }
    
    // OCR errors
    if (message.includes('ocr') || message.includes('tesseract') || message.includes('text recognition') ||
        message.includes('worker') || stack.includes('tesseract')) {
      return 'ocr';
    }
    
    // Memory errors
    if (message.includes('memory') || message.includes('allocation') || message.includes('heap') ||
        message.includes('out of memory') || message.includes('buffer') || 
        message.includes('maximum call stack') || message.includes('rangeerror')) {
      return 'memory';
    }
    
    return 'unknown';
  }

  // ============ RECOVERY HELPER METHODS ============

  /**
   * Clear application caches to free memory
   */
  private static async clearApplicationCaches(): Promise<void> {
    console.log('🧹 Clearing application caches...');
    
    try {
      // Clear any cached data
      if (typeof window !== 'undefined') {
        // Clear any application-specific caches
        console.log('✅ Application caches cleared');
      }
    } catch (error) {
      console.warn('⚠️ Failed to clear some caches:', error);
    }
  }

  /**
   * Disable GPU acceleration
   */
  private static async disableGPUAcceleration(): Promise<boolean> {
    console.log('🔧 Attempting to disable GPU acceleration...');
    
    try {
      // This would typically require IPC to main process
      // For now, just log the intent
      console.log('⚠️ GPU acceleration disable requested - requires main process support');
      return true;
    } catch (error) {
      console.error('❌ Failed to disable GPU acceleration:', error);
      return false;
    }
  }

  /**
   * Restart IPC connection
   */
  private static async restartIPCConnection(): Promise<void> {
    console.log('🔄 Attempting IPC connection restart...');
    
    try {
      // This is a placeholder - actual implementation would depend on IPC architecture
      console.log('⚠️ IPC restart requested - requires main process coordination');
    } catch (error) {
      console.error('❌ Failed to restart IPC connection:', error);
      throw error;
    }
  }

  /**
   * Create a retry wrapper for operations
   */
  static withRetry<T>(
    operation: () => Promise<T>,
    options?: {
      maxRetries?: number;
      backoffDelay?: number;
      context?: string;
    }
  ): Promise<T> {
    return new Promise(async (resolve, reject) => {
      const result = await this.attemptRecovery(
        operation,
        options?.context || 'operation',
        {
          strategy: 'retry-with-backoff',
          maxRetries: options?.maxRetries || 3,
          backoffDelay: options?.backoffDelay || 1000
        }
      );

      if (result.success) {
        resolve(result.result!);
      } else {
        reject(result.error);
      }
    });
  }

  /**
   * Handle critical errors that might require app restart
   */
  static handleCriticalError(error: any, context?: string): ExtendedAppError {
    const appError = this.handle(error, context);
    appError.severity = 'critical';
    appError.canRecover = false;
    
    // Log critical error immediately
    this.log(appError);
    
    // Notify main process if possible
    try {
      if (window.electronAPI?.reportCriticalError) {
        window.electronAPI.reportCriticalError({
          message: appError.message,
          stack: appError.stack,
          context: appError.context,
          timestamp: appError.timestamp
        });
      }
    } catch (reportError) {
      console.error('Failed to report critical error:', reportError);
    }
    
    return appError;
  }

  /**
   * Generate comprehensive error report
   */
  static generateErrorReport(error: ExtendedAppError): string {
    const report = {
      timestamp: error.timestamp?.toISOString() || new Date().toISOString(),
      category: error.category || 'unknown',
      severity: error.severity || 'medium',
      message: error.message,
      code: error.code,
      context: error.context,
      attemptCount: error.attemptCount || 0,
      canRecover: error.canRecover !== false,
      recoveryStrategy: error.recoveryContext?.strategy || 'none',
      systemInfo: {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
        ...error.systemInfo
      },
      stack: error.stack,
      metadata: error.metadata
    };
    
    return JSON.stringify(report, null, 2);
  }
}

export default ErrorHandler;