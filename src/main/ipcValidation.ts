import { BrowserWindow, ipcMain, IpcMainInvokeEvent } from 'electron';
import * as path from 'path';
import * as fs from 'fs';

class SecurityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SecurityError';
  }
}

export class IPCValidator {
  private static allowedWindows = new Set<Electron.BrowserWindow>();
  private static rateLimits = new Map<string, { count: number; lastCall: number }>();

  /**
   * Register a window that is allowed to make IPC calls
   */
  static registerWindow(win: Electron.BrowserWindow): void {
    this.allowedWindows.add(win);
    win.on('closed', () => this.allowedWindows.delete(win));
  }

  /**
   * Validate that the sender is an allowed window
   */
  static validateSender(event: IpcMainInvokeEvent): void {
    const sender = BrowserWindow.fromWebContents(event.sender);
    if (!sender || !this.allowedWindows.has(sender)) {
      console.error('Security: IPC call from unauthorized sender');
      throw new SecurityError('Unauthorized sender');
    }
  }

  /**
   * Apply rate limiting to IPC calls
   */
  static checkRateLimit(channel: string, maxCalls: number, timeWindowMs: number): void {
    const now = Date.now();
    const key = `${channel}:${now - (now % timeWindowMs)}`;
    const count = (this.rateLimits.get(key)?.count || 0) + 1;
    
    if (count > maxCalls) {
      throw new SecurityError(`Rate limit exceeded for ${channel}. Max ${maxCalls} calls per ${timeWindowMs}ms`);
    }
    
    this.rateLimits.set(key, { count, lastCall: now });
    
    // Clean up old entries
    for (const [k, v] of this.rateLimits.entries()) {
      if (now - v.lastCall > timeWindowMs * 2) {
        this.rateLimits.delete(k);
      }
    }
  }

  /**
   * Validate and sanitize a file path
   */
  static validateFilePath(filePath: string, allowedExtensions: string[] = ['.pdf']): string {
    if (typeof filePath !== 'string') {
      throw new SecurityError('Invalid file path: must be a string');
    }

    // Normalize and resolve the path
    const normalizedPath = path.normalize(filePath);
    
    // Check for directory traversal
    if (normalizedPath !== path.normalize(path.resolve(normalizedPath))) {
      throw new SecurityError('Invalid file path: potential directory traversal attempt');
    }

    // Check file extension
    const ext = path.extname(normalizedPath).toLowerCase();
    if (allowedExtensions.length > 0 && !allowedExtensions.includes(ext)) {
      throw new SecurityError(`Invalid file type. Allowed: ${allowedExtensions.join(', ')}`);
    }

    return normalizedPath;
  }

  /**
   * Create a secure IPC handler with validation
   */
  static createHandler<T extends any[], R>(
    channel: string,
    handler: (event: IpcMainInvokeEvent, ...args: T) => Promise<R>,
    options: {
      rateLimit?: { maxCalls: number; timeWindowMs: number };
      validateArgs?: (args: T) => void;
    } = {}
  ): void {
    ipcMain.handle(channel, async (event, ...args: T) => {
      try {
        // Validate sender
        this.validateSender(event);

        // Apply rate limiting if configured
        if (options.rateLimit) {
          this.checkRateLimit(channel, options.rateLimit.maxCalls, options.rateLimit.timeWindowMs);
        }

        // Validate arguments if validator provided
        if (options.validateArgs) {
          options.validateArgs(args);
        }

        // Call the handler
        return await handler(event, ...args);
      } catch (error) {
        console.error(`IPC Error in ${channel}:`, error);
        throw error; // Rethrow to send back to renderer
      }
    });
  }
}

// Example usage:
/*
IPCValidator.createHandler('save-file', 
  async (event, filePath: string, content: string) => {
    const safePath = IPCValidator.validateFilePath(filePath, ['.pdf', '.txt']);
    await fs.promises.writeFile(safePath, content);
    return { success: true };
  },
  {
    rateLimit: { maxCalls: 10, timeWindowMs: 1000 },
    validateArgs: (args) => {
      if (typeof args[0] !== 'string' || typeof args[1] !== 'string') {
        throw new Error('Invalid arguments');
      }
    }
  }
);
*/
