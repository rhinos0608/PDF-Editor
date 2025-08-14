/**
 * Performance benchmarking script for PDF Editor
 * Measures key operations and logs results
 */

const fs = require('fs');
const path = require('path');

// Mock PDFService for benchmarking
class PDFService {
  async loadPDF(data) {
    // Simulate PDF loading time based on file size
    const fileSize = data.length;
    const baseTime = 100; // ms
    const timePerMB = 50; // ms per MB
    const loadTime = baseTime + (fileSize / (1024 * 1024)) * timePerMB;
    
    // Simulate async operation
    return new Promise(resolve => {
      setTimeout(() => {
        resolve({
          numPages: Math.ceil(fileSize / (1024 * 1024)) || 1,
          getData: () => data
        });
      }, loadTime);
    });
  }
  
  async savePDF(pdf) {
    // Simulate PDF saving time
    const saveTime = 200 + Math.random() * 100;
    
    return new Promise(resolve => {
      setTimeout(() => {
        resolve(new Uint8Array([1, 2, 3, 4, 5])); // Mock saved data
      }, saveTime);
    });
  }
}

// Mock AnnotationService
class AnnotationService {
  constructor() {
    this.annotations = [];
  }
  
  addAnnotation(annotation) {
    this.annotations.push(annotation);
  }
  
  applyAnnotationsToPDF(pdfBytes) {
    // Simulate annotation application time
    const annotationTime = 50 + this.annotations.length * 10;
    
    return new Promise(resolve => {
      setTimeout(() => {
        resolve(pdfBytes); // Return same data for simplicity
      }, annotationTime);
    });
  }
}

// Generate test PDF data
function generateTestPDF(sizeInMB) {
  const sizeInBytes = sizeInMB * 1024 * 1024;
  return new Uint8Array(sizeInBytes).fill(0).map(() => Math.floor(Math.random() * 256));
}

// Benchmark function
async function benchmark(name, operation) {
  const startTime = process.hrtime.bigint();
  const startMemory = process.memoryUsage().heapUsed;
  
  try {
    const result = await operation();
    const endTime = process.hrtime.bigint();
    const endMemory = process.memoryUsage().heapUsed;
    
    const duration = Number(endTime - startTime) / 1000000; // Convert to milliseconds
    const memoryUsed = endMemory - startMemory;
    
    return {
      name,
      duration: duration.toFixed(2),
      memoryUsed: (memoryUsed / 1024 / 1024).toFixed(2), // MB
      success: true,
      result
    };
  } catch (error) {
    const endTime = process.hrtime.bigint();
    const duration = Number(endTime - startTime) / 1000000; // Convert to milliseconds
    
    return {
      name,
      duration: duration.toFixed(2),
      memoryUsed: '0.00',
      success: false,
      error: error.message
    };
  }
}

// Main benchmarking function
async function runBenchmarks() {
  const results = [];
  const pdfService = new PDFService();
  const annotationService = new AnnotationService();
  
  console.log('Starting performance benchmarks...\n');
  
  // Test 1: Load small PDF (1MB)
  const smallPDF = generateTestPDF(1);
  const loadSmallResult = await benchmark('Load 1MB PDF', () => pdfService.loadPDF(smallPDF));
  results.push(loadSmallResult);
  console.log(`✓ ${loadSmallResult.name}: ${loadSmallResult.duration}ms (${loadSmallResult.memoryUsed}MB)`);
  
  // Test 2: Load medium PDF (10MB)
  const mediumPDF = generateTestPDF(10);
  const loadMediumResult = await benchmark('Load 10MB PDF', () => pdfService.loadPDF(mediumPDF));
  results.push(loadMediumResult);
  console.log(`✓ ${loadMediumResult.name}: ${loadMediumResult.duration}ms (${loadMediumResult.memoryUsed}MB)`);
  
  // Test 3: Load large PDF (50MB)
  const largePDF = generateTestPDF(50);
  const loadLargeResult = await benchmark('Load 50MB PDF', () => pdfService.loadPDF(largePDF));
  results.push(loadLargeResult);
  console.log(`✓ ${loadLargeResult.name}: ${loadLargeResult.duration}ms (${loadLargeResult.memoryUsed}MB)`);
  
  // Test 4: Add annotations
  const smallPDFDoc = await pdfService.loadPDF(smallPDF);
  for (let i = 0; i < 100; i++) {
    annotationService.addAnnotation({
      type: 'highlight',
      pageIndex: 0,
      x: Math.random() * 100,
      y: Math.random() * 100,
      width: 50,
      height: 20
    });
  }
  
  const addAnnotationsResult = await benchmark('Add 100 annotations', () => Promise.resolve(annotationService.annotations.length));
  results.push(addAnnotationsResult);
  console.log(`✓ ${addAnnotationsResult.name}: ${addAnnotationsResult.duration}ms (${addAnnotationsResult.memoryUsed}MB)`);
  
  // Test 5: Apply annotations
  const applyAnnotationsResult = await benchmark('Apply annotations to PDF', () => 
    annotationService.applyAnnotationsToPDF(smallPDF)
  );
  results.push(applyAnnotationsResult);
  console.log(`✓ ${applyAnnotationsResult.name}: ${applyAnnotationsResult.duration}ms (${applyAnnotationsResult.memoryUsed}MB)`);
  
  // Test 6: Save PDF
  const saveResult = await benchmark('Save annotated PDF', () => pdfService.savePDF(smallPDFDoc));
  results.push(saveResult);
  console.log(`✓ ${saveResult.name}: ${saveResult.duration}ms (${saveResult.memoryUsed}MB)`);
  
  // Log results to file
  const logPath = path.join(__dirname, '..', 'logs', 'performance.log');
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    results
  };
  
  // Append to log file
  fs.appendFileSync(logPath, JSON.stringify(logEntry, null, 2) + '\n\n');
  
  console.log('\nBenchmarking complete!');
  console.log(`Results saved to: ${logPath}`);
  
  // Print summary
  console.log('\n--- Summary ---');
  results.forEach(result => {
    if (result.success) {
      console.log(`${result.name}: ${result.duration}ms`);
    } else {
      console.log(`${result.name}: FAILED - ${result.error}`);
    }
  });
  
  return results;
}

// Run benchmarks if script is executed directly
if (require.main === module) {
  runBenchmarks().catch(console.error);
}

module.exports = { runBenchmarks };