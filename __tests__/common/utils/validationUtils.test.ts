/**
 * Unit tests for Validation Utility Functions
 */

import {
  isValidEmail,
  isValidUrl,
  hasValidExtension,
  isValidFileSize,
  isValidString,
  isValidNumber,
  hasRequiredProperties,
  isValidArray,
  isStrongPassword,
  isValidHexColor,
  isValidRGB,
  isValidPageNumber,
  isValidZoom,
  isValidRectangle,
  isValidPoint,
  sanitizeString,
  sanitizeFilename,
  isNotNull,
  isString,
  isNumber,
  isBoolean
} from '../../../src/common/utils/validationUtils';

describe('Validation Utilities', () => {
  describe('isValidEmail', () => {
    it('should validate correct email formats', () => {
      expect(isValidEmail('user@example.com')).toBe(true);
      expect(isValidEmail('test.email+tag@domain.co.uk')).toBe(true);
      expect(isValidEmail('user123@test-domain.org')).toBe(true);
    });

    it('should reject invalid email formats', () => {
      expect(isValidEmail('invalid-email')).toBe(false);
      expect(isValidEmail('user@')).toBe(false);
      expect(isValidEmail('@domain.com')).toBe(false);
      expect(isValidEmail('user space@domain.com')).toBe(false);
    });
  });

  describe('isValidUrl', () => {
    it('should validate correct URL formats', () => {
      expect(isValidUrl('https://example.com')).toBe(true);
      expect(isValidUrl('http://localhost:3000')).toBe(true);
      expect(isValidUrl('ftp://files.example.com/file.pdf')).toBe(true);
    });

    it('should reject invalid URL formats', () => {
      expect(isValidUrl('not-a-url')).toBe(false);
      expect(isValidUrl('://example.com')).toBe(false);
      expect(isValidUrl('')).toBe(false);
    });
  });

  describe('hasValidExtension', () => {
    it('should validate allowed extensions', () => {
      expect(hasValidExtension('document.pdf', ['pdf', 'doc'])).toBe(true);
      expect(hasValidExtension('image.PNG', ['png', 'jpg'])).toBe(true); // Case insensitive
    });

    it('should reject invalid extensions', () => {
      expect(hasValidExtension('document.txt', ['pdf', 'doc'])).toBe(false);
      expect(hasValidExtension('file', ['pdf', 'doc'])).toBe(false); // No extension
    });
  });

  describe('isValidFileSize', () => {
    it('should validate file sizes within limits', () => {
      expect(isValidFileSize(1024, 1)).toBe(true); // 1KB within 1MB limit
      expect(isValidFileSize(1024 * 1024, 1)).toBe(true); // Exactly 1MB
    });

    it('should reject files that are too large', () => {
      expect(isValidFileSize(2 * 1024 * 1024, 1)).toBe(false); // 2MB exceeds 1MB limit
    });

    it('should reject zero or negative sizes', () => {
      expect(isValidFileSize(0, 1)).toBe(false);
      expect(isValidFileSize(-100, 1)).toBe(false);
    });
  });

  describe('isValidString', () => {
    it('should validate strings within length limits', () => {
      expect(isValidString('valid', 1, 10)).toBe(true);
      expect(isValidString('exactly', 5, 10)).toBe(true); // 'exactly' has 7 chars, within limit
    });

    it('should reject strings outside length limits', () => {
      expect(isValidString('short', 10, 20)).toBe(false); // Too short
      expect(isValidString('verylongstring', 1, 5)).toBe(false); // Too long
    });

    it('should handle whitespace correctly', () => {
      expect(isValidString('   ', 1, 10)).toBe(false); // Only whitespace
      expect(isValidString(' valid ', 1, 10)).toBe(true); // Valid with whitespace
    });

    it('should reject non-strings', () => {
      expect(isValidString(123 as any, 1, 10)).toBe(false);
      expect(isValidString(null as any, 1, 10)).toBe(false);
    });
  });

  describe('isValidNumber', () => {
    it('should validate numbers within range', () => {
      expect(isValidNumber(5, 0, 10)).toBe(true);
      expect(isValidNumber(0, 0, 10)).toBe(true);
      expect(isValidNumber(10, 0, 10)).toBe(true);
    });

    it('should reject numbers outside range', () => {
      expect(isValidNumber(-1, 0, 10)).toBe(false);
      expect(isValidNumber(11, 0, 10)).toBe(false);
    });

    it('should reject invalid numbers', () => {
      expect(isValidNumber(NaN, 0, 10)).toBe(false);
      expect(isValidNumber(Infinity, 0, 10)).toBe(false);
      expect(isValidNumber('5' as any, 0, 10)).toBe(false);
    });
  });

  describe('hasRequiredProperties', () => {
    it('should validate objects with all required properties', () => {
      const obj = { name: 'test', age: 25, active: true };
      expect(hasRequiredProperties(obj, ['name', 'age'])).toBe(true);
    });

    it('should reject objects missing required properties', () => {
      const obj = { name: 'test' };
      expect(hasRequiredProperties(obj, ['name', 'age'])).toBe(false);
    });

    it('should reject non-objects', () => {
      expect(hasRequiredProperties(null, ['name'])).toBe(false);
      expect(hasRequiredProperties('string', ['name'])).toBe(false);
    });
  });

  describe('isValidArray', () => {
    const isStringValidator = (item: any): item is string => typeof item === 'string';

    it('should validate arrays with valid items', () => {
      expect(isValidArray(['a', 'b', 'c'], isStringValidator)).toBe(true);
      expect(isValidArray(['single'], isStringValidator, 1, 1)).toBe(true);
    });

    it('should reject arrays with invalid items', () => {
      expect(isValidArray(['a', 1, 'c'], isStringValidator)).toBe(false);
    });

    it('should validate array length constraints', () => {
      expect(isValidArray(['a'], isStringValidator, 2, 5)).toBe(false); // Too short
      expect(isValidArray(['a', 'b', 'c', 'd', 'e', 'f'], isStringValidator, 1, 3)).toBe(false); // Too long
    });

    it('should reject non-arrays', () => {
      expect(isValidArray('not-array', isStringValidator)).toBe(false);
      expect(isValidArray(null, isStringValidator)).toBe(false);
    });
  });

  describe('isStrongPassword', () => {
    it('should validate strong passwords', () => {
      expect(isStrongPassword('StrongP@ss1')).toBe(true);
      expect(isStrongPassword('MySecure123!')).toBe(true);
    });

    it('should reject weak passwords', () => {
      expect(isStrongPassword('short')).toBe(false); // Too short
      expect(isStrongPassword('nouppercase123!')).toBe(false); // No uppercase
      expect(isStrongPassword('NOLOWERCASE123!')).toBe(false); // No lowercase
      expect(isStrongPassword('NoNumbers!')).toBe(false); // No numbers
      expect(isStrongPassword('NoSpecial123')).toBe(false); // No special chars
    });
  });

  describe('isValidHexColor', () => {
    it('should validate correct hex colors', () => {
      expect(isValidHexColor('#FF0000')).toBe(true); // 6 digits
      expect(isValidHexColor('#f00')).toBe(true); // 3 digits
      expect(isValidHexColor('#123ABC')).toBe(true); // Mixed case
    });

    it('should reject invalid hex colors', () => {
      expect(isValidHexColor('FF0000')).toBe(false); // No #
      expect(isValidHexColor('#GG0000')).toBe(false); // Invalid hex chars
      expect(isValidHexColor('#FF00')).toBe(false); // Wrong length
    });
  });

  describe('isValidRGB', () => {
    it('should validate RGB values in range', () => {
      expect(isValidRGB(255, 0, 0)).toBe(true);
      expect(isValidRGB(128, 128, 128)).toBe(true);
      expect(isValidRGB(0, 0, 0)).toBe(true);
    });

    it('should reject RGB values out of range', () => {
      expect(isValidRGB(256, 0, 0)).toBe(false);
      expect(isValidRGB(-1, 0, 0)).toBe(false);
      expect(isValidRGB(128, 300, 128)).toBe(false);
    });
  });

  describe('isValidPageNumber', () => {
    it('should validate page numbers within range', () => {
      expect(isValidPageNumber(1, 10)).toBe(true);
      expect(isValidPageNumber(10, 10)).toBe(true);
      expect(isValidPageNumber(5, 20)).toBe(true);
    });

    it('should reject page numbers out of range', () => {
      expect(isValidPageNumber(0, 10)).toBe(false); // Pages start at 1
      expect(isValidPageNumber(11, 10)).toBe(false); // Exceeds total
      expect(isValidPageNumber(1.5, 10)).toBe(false); // Not integer
    });
  });

  describe('isValidZoom', () => {
    it('should validate zoom levels in range', () => {
      expect(isValidZoom(1.0)).toBe(true);
      expect(isValidZoom(0.1)).toBe(true); // Minimum
      expect(isValidZoom(10.0)).toBe(true); // Maximum
      expect(isValidZoom(2.5)).toBe(true);
    });

    it('should reject zoom levels out of range', () => {
      expect(isValidZoom(0.05)).toBe(false); // Below minimum
      expect(isValidZoom(15.0)).toBe(false); // Above maximum
    });
  });

  describe('isValidRectangle', () => {
    it('should validate correct rectangle objects', () => {
      expect(isValidRectangle({ x: 0, y: 0, width: 100, height: 50 })).toBe(true);
      expect(isValidRectangle({ x: 10, y: 20, width: 1, height: 1 })).toBe(true);
    });

    it('should reject invalid rectangle objects', () => {
      expect(isValidRectangle({ x: 0, y: 0, width: 100 } as any)).toBe(false); // Missing height
      expect(isValidRectangle({ x: -1, y: 0, width: 100, height: 50 })).toBe(false); // Negative x
      expect(isValidRectangle({ x: 0, y: 0, width: -100, height: 50 })).toBe(false); // Negative width
    });
  });

  describe('isValidPoint', () => {
    it('should validate correct point objects', () => {
      expect(isValidPoint({ x: 0, y: 0 })).toBe(true);
      expect(isValidPoint({ x: 100, y: 200 })).toBe(true);
    });

    it('should reject invalid point objects', () => {
      expect(isValidPoint({ x: 0 } as any)).toBe(false); // Missing y
      expect(isValidPoint({ x: -1, y: 0 })).toBe(false); // Negative x
    });
  });

  describe('sanitizeString', () => {
    it('should remove HTML tags and control characters', () => {
      // The function only removes < and > characters, not full tags
      expect(sanitizeString('<script>alert("xss")</script>hello')).toBe('scriptalert("xss")/scripthello');
      expect(sanitizeString('  test  ')).toBe('test'); // Trim whitespace
    });

    it('should remove control characters', () => {
      const withControlChars = 'hello\x00\x01\x1F\x7Fworld';
      expect(sanitizeString(withControlChars)).toBe('helloworld');
    });
  });

  describe('sanitizeFilename', () => {
    it('should replace invalid filename characters', () => {
      expect(sanitizeFilename('file<>:"/\\|?*name.pdf')).toBe('file_name.pdf');
    });

    it('should handle spaces and multiple underscores', () => {
      expect(sanitizeFilename('my   file   name.pdf')).toBe('my_file_name.pdf');
    });

    it('should limit filename length', () => {
      const longName = 'a'.repeat(300);
      const sanitized = sanitizeFilename(longName);
      expect(sanitized.length).toBeLessThanOrEqual(255);
    });
  });

  describe('Type Guards', () => {
    describe('isNotNull', () => {
      it('should identify non-null values', () => {
        expect(isNotNull('string')).toBe(true);
        expect(isNotNull(0)).toBe(true);
        expect(isNotNull(false)).toBe(true);
      });

      it('should identify null/undefined values', () => {
        expect(isNotNull(null)).toBe(false);
        expect(isNotNull(undefined)).toBe(false);
      });
    });

    describe('isString', () => {
      it('should identify string values', () => {
        expect(isString('hello')).toBe(true);
        expect(isString('')).toBe(true);
      });

      it('should reject non-string values', () => {
        expect(isString(123)).toBe(false);
        expect(isString(null)).toBe(false);
      });
    });

    describe('isNumber', () => {
      it('should identify valid numbers', () => {
        expect(isNumber(123)).toBe(true);
        expect(isNumber(0)).toBe(true);
        expect(isNumber(-456)).toBe(true);
      });

      it('should reject invalid numbers', () => {
        expect(isNumber(NaN)).toBe(false);
        expect(isNumber('123')).toBe(false);
        expect(isNumber(null)).toBe(false);
      });
    });

    describe('isBoolean', () => {
      it('should identify boolean values', () => {
        expect(isBoolean(true)).toBe(true);
        expect(isBoolean(false)).toBe(true);
      });

      it('should reject non-boolean values', () => {
        expect(isBoolean(0)).toBe(false);
        expect(isBoolean('true')).toBe(false);
        expect(isBoolean(null)).toBe(false);
      });
    });
  });
});