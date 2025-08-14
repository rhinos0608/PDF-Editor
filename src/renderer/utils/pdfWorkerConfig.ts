/**
 * PDF.js Worker Configuration Fix
 * Addresses the critical "No GlobalWorkerOptions.workerSrc specified" error
 */

// Configure PDF.js worker for both Electron and Web environments
export function configurePDFJSWorker(): void {
  try {
    // Import PDF.js dynamically
    import('pdfjs-dist').then(pdfjsLib => {
      // Check if we're in Electron environment
      const isElectron = typeof window !== 'undefined' && window.electronAPI;
      
      if (isElectron) {
        // In Electron, use the bundled worker from dist
        pdfjsLib.GlobalWorkerOptions.workerSrc = './pdf.worker.min.js';
        console.log('✅ PDF.js worker configured for Electron environment');
      } else {
        // In web mode, use CDN
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@latest/build/pdf.worker.min.js';
        console.log('✅ PDF.js worker configured for Web environment');
      }
    }).catch(error => {
      console.error('❌ Failed to configure PDF.js worker:', error);
      
      // Fallback configuration
      if (typeof window !== 'undefined' && (window as any).pdfjsLib) {
        const pdfjsLib = (window as any).pdfjsLib;
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@latest/build/pdf.worker.min.js';
        console.log('✅ PDF.js worker configured via fallback method');
      }
    });
  } catch (error) {
    console.error('❌ Critical error configuring PDF.js worker:', error);
  }
}

// Auto-configure when this module is imported
configurePDFJSWorker();
