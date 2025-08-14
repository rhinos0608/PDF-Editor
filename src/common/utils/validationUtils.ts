/**
 * Validation Utility Functions
 * Consolidated validation utilities used throughout the application
 */

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate URL format
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate file extension
 */
export function hasValidExtension(filename: string, allowedExtensions: string[]): boolean {
  const extension = filename.toLowerCase().split('.').pop();
  return extension ? allowedExtensions.includes(extension) : false;
}

/**
 * Validate file size is within limits
 */
export function isValidFileSize(sizeInBytes: number, maxSizeInMB: number): boolean {
  const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
  return sizeInBytes > 0 && sizeInBytes <= maxSizeInBytes;
}

/**
 * Validate string is not empty and within length limits
 */
export function isValidString(value: string, minLength: number = 1, maxLength: number = 1000): boolean {
  return typeof value === 'string' && 
         value.trim().length >= minLength && 
         value.length <= maxLength;
}

/**
 * Validate number is within range
 */
export function isValidNumber(value: number, min: number = -Infinity, max: number = Infinity): boolean {
  return typeof value === 'number' && 
         !isNaN(value) && 
         isFinite(value) && 
         value >= min && 
         value <= max;
}

/**
 * Validate object has required properties
 */
export function hasRequiredProperties(obj: any, requiredProps: string[]): boolean {
  if (!obj || typeof obj !== 'object') {
    return false;
  }
  
  return requiredProps.every(prop => prop in obj && obj[prop] !== undefined);
}

/**
 * Validate array contains only valid items
 */
export function isValidArray<T>(
  array: any, 
  itemValidator: (item: any) => item is T,
  minLength: number = 0,
  maxLength: number = Infinity
): array is T[] {
  if (!Array.isArray(array)) {
    return false;
  }
  
  if (array.length < minLength || array.length > maxLength) {
    return false;
  }
  
  return array.every(itemValidator);
}

/**
 * Validate password strength
 */
export function isStrongPassword(password: string): boolean {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special char
  const minLength = 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  return password.length >= minLength && hasUpper && hasLower && hasNumber && hasSpecial;
}

/**
 * Validate hex color code
 */
export function isValidHexColor(color: string): boolean {
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
}

/**
 * Validate RGB color values
 */
export function isValidRGB(r: number, g: number, b: number): boolean {
  return isValidNumber(r, 0, 255) && 
         isValidNumber(g, 0, 255) && 
         isValidNumber(b, 0, 255);
}

/**
 * Validate page number for PDF context
 */
export function isValidPageNumber(pageNum: number, totalPages: number): boolean {
  return isValidNumber(pageNum, 1, totalPages) && Number.isInteger(pageNum);
}

/**
 * Validate zoom level
 */
export function isValidZoom(zoom: number): boolean {
  return isValidNumber(zoom, 0.1, 10); // 10% to 1000%
}

/**
 * Validate rectangle coordinates
 */
export function isValidRectangle(rect: { x: number; y: number; width: number; height: number }): boolean {
  return hasRequiredProperties(rect, ['x', 'y', 'width', 'height']) &&
         isValidNumber(rect.x, 0) &&
         isValidNumber(rect.y, 0) &&
         isValidNumber(rect.width, 0) &&
         isValidNumber(rect.height, 0);
}

/**
 * Validate point coordinates
 */
export function isValidPoint(point: { x: number; y: number }): boolean {
  return hasRequiredProperties(point, ['x', 'y']) &&
         isValidNumber(point.x, 0) &&
         isValidNumber(point.y, 0);
}

/**
 * Sanitize string for safe display/storage
 */
export function sanitizeString(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
    .trim();
}

/**
 * Validate and sanitize filename
 */
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[<>:"/\\|?*]/g, '_') // Replace invalid filename characters
    .replace(/\s+/g, '_') // Replace spaces with underscores
    .replace(/_{2,}/g, '_') // Replace multiple underscores with single
    .replace(/^_+|_+$/g, '') // Remove leading/trailing underscores
    .substring(0, 255); // Limit length
}

/**
 * Type guard for non-null/undefined values
 */
export function isNotNull<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

/**
 * Type guard for string values
 */
export function isString(value: any): value is string {
  return typeof value === 'string';
}

/**
 * Type guard for number values
 */
export function isNumber(value: any): value is number {
  return typeof value === 'number' && !isNaN(value);
}

/**
 * Type guard for boolean values
 */
export function isBoolean(value: any): value is boolean {
  return typeof value === 'boolean';
}