/**
 * Simple test to verify security fixes
 */

const { isValidPath, sanitizePath, isValidArrayBuffer } = require('../../src/utils/validation');

console.log('Testing security validation functions...');

// Test path validation
console.log('\n--- Path Validation Tests ---');
const validPaths = [
  'document.pdf',
  'C:\\Users\\test\\document.pdf',
  '/home/user/document.pdf'
];

const invalidPaths = [
  '../etc/passwd',
  '..\\windows\\system32\\config\\sam',
  'document.exe',
  'document.bat'
];

validPaths.forEach(path => {
  try {
    const result = isValidPath(path);
    console.log(`isValidPath('${path}') = ${result} ${result ? '✓' : '✗'}`);
  } catch (error) {
    console.error(`Error testing isValidPath('${path}'):`, error.message);
  }
});

invalidPaths.forEach(path => {
  try {
    const result = isValidPath(path);
    console.log(`isValidPath('${path}') = ${result} ${!result ? '✓' : '✗'}`);
  } catch (error) {
    console.error(`Error testing isValidPath('${path}'):`, error.message);
  }
});

// Test path sanitization
console.log('\n--- Path Sanitization Tests ---');
const dirtyPaths = [
  'document<pdf',
  'document; rm -rf /',
  'document.pdf\u0000',
  'document.pdf<script>alert(1)</script>'
];

dirtyPaths.forEach(path => {
  try {
    const sanitized = sanitizePath(path);
    console.log(`sanitizePath('${path}') = '${sanitized}'`);
  } catch (error) {
    console.error(`Error sanitizing path '${path}':`, error.message);
  }
});

// Test ArrayBuffer validation
console.log('\n--- ArrayBuffer Validation Tests ---');
try {
  const validBuffer = new ArrayBuffer(1024 * 1024); // 1MB
  const invalidBuffer = new ArrayBuffer(101 * 1024 * 1024); // 101MB (too large)
  const emptyBuffer = new ArrayBuffer(0); // Empty

  const validResult = isValidArrayBuffer(validBuffer);
  console.log(`isValidArrayBuffer(1MB buffer) = ${validResult} ${validResult ? '✓' : '✗'}`);

  const invalidResult = isValidArrayBuffer(invalidBuffer);
  console.log(`isValidArrayBuffer(101MB buffer) = ${invalidResult} ${!invalidResult ? '✓' : '✗'}`);

  const emptyResult = isValidArrayBuffer(emptyBuffer);
  console.log(`isValidArrayBuffer(empty buffer) = ${emptyResult} ${!emptyResult ? '✓' : '✗'}`);
} catch (error) {
  console.error('Error in ArrayBuffer validation tests:', error.message);
}

console.log('\nSecurity validation tests completed.');
