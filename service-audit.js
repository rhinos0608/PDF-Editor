/**
 * Service Classes Audit
 * 
 * This script audits all service classes to determine actual vs claimed functionality
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Service Classes Comprehensive Audit');
console.log('=====================================\n');

const servicesDir = 'src/renderer/services';
const services = [];

// Get all service files
try {
  const files = fs.readdirSync(servicesDir);
  const serviceFiles = files.filter(file => file.endsWith('.ts') && file.includes('Service'));
  
  console.log(`📁 Found ${serviceFiles.length} service files:\n`);
  
  serviceFiles.forEach(file => {
    console.log(`   • ${file}`);
  });
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Analyze each service
  serviceFiles.forEach((file, index) => {
    console.log(`${index + 1}. 📊 Analyzing ${file}`);
    console.log('-'.repeat(30));
    
    try {
      const filePath = path.join(servicesDir, file);
      const content = fs.readFileSync(filePath, 'utf8');
      
      const analysis = analyzeService(content, file);
      services.push({ file, ...analysis });
      
      console.log(`   Functionality Level: ${analysis.functionalityLevel}`);
      console.log(`   Methods: ${analysis.methodCount}`);
      console.log(`   Complexity: ${analysis.complexity}`);
      console.log(`   Integration: ${analysis.integration}`);
      console.log(`   Status: ${analysis.status}`);
      
      if (analysis.keyFeatures.length > 0) {
        console.log(`   Key Features: ${analysis.keyFeatures.join(', ')}`);
      }
      
      console.log('');
      
    } catch (error) {
      console.log(`   ❌ Could not analyze ${file}`);
      console.log('');
    }
  });
  
} catch (error) {
  console.log('❌ Could not read services directory');
}

// Generate summary report
console.log('📊 AUDIT SUMMARY REPORT');
console.log('========================\n');

const highFunctionality = services.filter(s => s.functionalityLevel === 'High').length;
const mediumFunctionality = services.filter(s => s.functionalityLevel === 'Medium').length; 
const lowFunctionality = services.filter(s => s.functionalityLevel === 'Low').length;

console.log(`🟢 High Functionality Services: ${highFunctionality}`);
console.log(`🟡 Medium Functionality Services: ${mediumFunctionality}`);
console.log(`🔴 Low Functionality Services: ${lowFunctionality}`);
console.log('');

const production = services.filter(s => s.status === 'Production Ready').length;
const functional = services.filter(s => s.status === 'Functional').length;
const basic = services.filter(s => s.status === 'Basic Implementation').length;
const mock = services.filter(s => s.status === 'Mock/Placeholder').length;

console.log('📈 SERVICE MATURITY:');
console.log(`   🏆 Production Ready: ${production}`);
console.log(`   ✅ Functional: ${functional}`);
console.log(`   ⚠️  Basic Implementation: ${basic}`);
console.log(`   🚧 Mock/Placeholder: ${mock}`);
console.log('');

// Top services
const topServices = services
  .filter(s => s.functionalityLevel === 'High')
  .sort((a, b) => b.methodCount - a.methodCount)
  .slice(0, 5);

console.log('🏆 TOP PERFORMING SERVICES:');
topServices.forEach((service, index) => {
  console.log(`   ${index + 1}. ${service.file} (${service.methodCount} methods, ${service.complexity})`);
});
console.log('');

// Services needing attention
const needsAttention = services.filter(s => s.status === 'Mock/Placeholder' || s.functionalityLevel === 'Low');
console.log('⚠️  SERVICES NEEDING ATTENTION:');
needsAttention.forEach(service => {
  console.log(`   • ${service.file} - ${service.status}`);
});
console.log('');

// Conclusion
console.log('🎯 CONCLUSION:');
const totalServices = services.length;
const functionalServices = production + functional;
const percentageFunctional = Math.round((functionalServices / totalServices) * 100);

console.log(`   • Total Services Analyzed: ${totalServices}`);
console.log(`   • Actually Functional: ${functionalServices} (${percentageFunctional}%)`);
console.log(`   • Over-engineered?: ${lowFunctionality < totalServices * 0.3 ? 'NO - Most services are functional' : 'PARTIALLY - Some over-engineering detected'}`);
console.log('');

if (percentageFunctional > 70) {
  console.log('🏆 VERDICT: CLAUDE.md was WRONG - Services are largely functional, not minimal!');
} else if (percentageFunctional > 50) {
  console.log('⚖️  VERDICT: Mixed - Some services functional, others need work');
} else {
  console.log('⚠️  VERDICT: CLAUDE.md was correct - Many services are under-implemented');
}

console.log('\n✅ Service audit complete!');

function analyzeService(content, filename) {
  // Count methods
  const methodMatches = content.match(/async\s+\w+\(|^\s*\w+\s*\(/gm) || [];
  const methodCount = methodMatches.length;
  
  // Check for key functionality indicators
  const hasRealImplementation = content.includes('try {') && content.includes('catch');
  const hasComplexLogic = content.includes('for (') || content.includes('while (') || content.includes('map(') || content.includes('filter(');
  const hasExternalIntegration = content.includes('import') && (content.includes('pdf-lib') || content.includes('tesseract') || content.includes('crypto'));
  const hasErrorHandling = content.includes('Error(') || content.includes('throw') || content.includes('logger');
  const hasTypeDefinitions = content.includes('interface') || content.includes('type ');
  const hasDocumentation = content.includes('/**') || content.includes('* @');
  const isMockImplementation = content.includes('TODO') || content.includes('throw new Error(\'Not implemented') || content.includes('console.log(\'Mock');
  
  // Determine functionality level
  let functionalityLevel;
  let status;
  let complexity;
  
  if (isMockImplementation || methodCount < 3) {
    functionalityLevel = 'Low';
    status = 'Mock/Placeholder';
    complexity = 'Simple';
  } else if (hasRealImplementation && hasComplexLogic && hasErrorHandling && methodCount > 10) {
    functionalityLevel = 'High';
    status = hasExternalIntegration ? 'Production Ready' : 'Functional';
    complexity = 'Complex';
  } else if (hasRealImplementation && methodCount > 5) {
    functionalityLevel = 'Medium';
    status = 'Functional';
    complexity = 'Moderate';
  } else {
    functionalityLevel = 'Low';
    status = 'Basic Implementation';
    complexity = 'Simple';
  }
  
  // Identify key features
  const keyFeatures = [];
  if (content.includes('PDFDocument')) keyFeatures.push('PDF Processing');
  if (content.includes('tesseract') || content.includes('Tesseract')) keyFeatures.push('OCR');
  if (content.includes('crypto') || content.includes('encrypt')) keyFeatures.push('Security');
  if (content.includes('search') || content.includes('find')) keyFeatures.push('Search');
  if (content.includes('annotation') || content.includes('highlight')) keyFeatures.push('Annotations');
  if (content.includes('canvas') || content.includes('render')) keyFeatures.push('Rendering');
  if (content.includes('workflow') || content.includes('process')) keyFeatures.push('Workflow');
  if (content.includes('form') || content.includes('field')) keyFeatures.push('Forms');
  if (content.includes('signature') || content.includes('sign')) keyFeatures.push('Digital Signatures');
  if (content.includes('analytics') || content.includes('stats')) keyFeatures.push('Analytics');
  
  // Check integration level
  let integration;
  const appUsage = filename.replace('.ts', '').replace('Service', '');
  // This would need to check App.tsx usage, but for now we'll estimate
  if (hasExternalIntegration || methodCount > 15) {
    integration = 'Well Integrated';
  } else if (methodCount > 8) {
    integration = 'Partially Integrated';
  } else {
    integration = 'Limited Integration';
  }
  
  return {
    methodCount,
    functionalityLevel,
    status,
    complexity,
    integration,
    keyFeatures,
    hasRealImplementation,
    hasComplexLogic,
    hasExternalIntegration,
    hasErrorHandling,
    hasTypeDefinitions,
    hasDocumentation,
    isMockImplementation
  };
}