const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const fs = require('fs');

async function createTestPDF() {
  try {
    console.log('🔄 Creating test PDF...');
    
    // Create a new PDF Document
    const pdfDoc = await PDFDocument.create();
    
    // Embed a font
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    
    // Add a page
    const page = pdfDoc.addPage([612, 792]); // Standard letter size
    
    // Get the width and height of the page
    const { width, height } = page.getSize();
    
    // Add some content to test saving
    page.drawText('Test PDF for Professional PDF Editor', {
      x: 50,
      y: height - 50,
      size: 20,
      font,
      color: rgb(0, 0, 0),
    });
    
    page.drawText('This is a test document to verify the save functionality.', {
      x: 50,
      y: height - 100,
      size: 12,
      font,
      color: rgb(0.2, 0.2, 0.2),
    });
    
    page.drawText('Features to test:', {
      x: 50,
      y: height - 150,
      size: 14,
      font,
      color: rgb(0, 0, 0),
    });
    
    const features = [
      '* PDF loading and display',
      '* Annotation creation',
      '* PDF saving with modifications',
      '* Text editing capabilities',
      '* Form field addition'
    ];
    
    features.forEach((feature, index) => {
      page.drawText(feature, {
        x: 70,
        y: height - 180 - (index * 25),
        size: 11,
        font,
        color: rgb(0.1, 0.1, 0.1),
      });
    });
    
    // Add a simple rectangle for annotation testing
    page.drawRectangle({
      x: 50,
      y: height - 400,
      width: 200,
      height: 100,
      borderColor: rgb(0, 0, 1),
      borderWidth: 2,
    });
    
    page.drawText('Test annotation area', {
      x: 60,
      y: height - 360,
      size: 10,
      font,
      color: rgb(0, 0, 1),
    });
    
    // Serialize the PDFDocument to bytes (a Uint8Array)
    const pdfBytes = await pdfDoc.save();
    
    // Write PDF to file
    fs.writeFileSync('./test-document.pdf', pdfBytes);
    
    console.log('✅ Test PDF created successfully: test-document.pdf');
    console.log(`📊 PDF size: ${pdfBytes.length} bytes`);
    
    return pdfBytes;
  } catch (error) {
    console.error('❌ Error creating test PDF:', error);
    throw error;
  }
}

// Run the test PDF creation
createTestPDF().catch(console.error);