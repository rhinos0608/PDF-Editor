/**
 * Test Build Script
 * Identifies and reports specific TypeScript errors
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Running TypeScript compiler with detailed errors...\n');

try {
  // Run TypeScript compiler to show errors
  execSync('npx tsc --noEmit --pretty', { 
    stdio: 'inherit',
    cwd: __dirname 
  });
  console.log('\n✅ No TypeScript errors found!');
} catch (error) {
  console.log('\n❌ TypeScript errors detected (see above)');
  
  // Try to get more specific error information
  console.log('\nAttempting to identify specific issues...\n');
  
  // Check App.tsx for common issues
  const appPath = path.join(__dirname, 'src', 'renderer', 'App.tsx');
  const content = fs.readFileSync(appPath, 'utf8');
  const lines = content.split('\n');
  
  // Check line 98 specifically
  if (lines[97]) {
    console.log('Line 98 content:');
    console.log(`  ${lines[97]}`);
    console.log(`  Character at position 61: "${lines[97][60]}"`);
    console.log(`  Substring 55-70: "${lines[97].substring(55, 70)}"`);
  }
  
  // Look for common issues
  const issues = [];
  
  // Check for empty object literals used incorrectly
  lines.forEach((line, index) => {
    if (line.includes('{}') && !line.includes('= {}') && !line.includes(': {}')) {
      const match = line.match(/(\w+)\s*\(\s*\{\}\s*\)/);
      if (match) {
        issues.push(`Line ${index + 1}: Possible empty object passed to function: ${match[0]}`);
      }
    }
  });
  
  if (issues.length > 0) {
    console.log('\nPotential issues found:');
    issues.forEach(issue => console.log(`  - ${issue}`));
  }
}

console.log('\nPress any key to continue...');
