/**
 * PDF.js Worker Configuration Fix
 * Addresses the critical "No GlobalWorkerOptions.workerSrc specified" error
 */

// Configure PDF.js worker for both Electron and Web environments
export function configurePDFJSWorker(): void {
  try {
    // Import PDF.js dynamically
    import('pdfjs-dist').then(pdfjsLib => {
      // Always use local worker file to avoid CSP issues
      // The worker file is bundled with webpack and available locally
      pdfjsLib.GlobalWorkerOptions.workerSrc = './pdf.worker.min.js';
      
      const isElectron = typeof window !== 'undefined' && window.electronAPI;
      
      if (isElectron) {
        console.log('✅ PDF.js worker configured for Electron environment (local file)');
      } else {
        console.log('✅ PDF.js worker configured for Web environment (local file)');
      }
      
      // Verify worker is accessible
      fetch('./pdf.worker.min.js')
        .then(response => {
          if (response.ok) {
            console.log('✅ PDF.js worker file verified as accessible');
          } else {
            console.warn('⚠️ PDF.js worker file returned status:', response.status);
          }
        })
        .catch(error => {
          console.warn('⚠️ Could not verify PDF.js worker file:', error.message);
        });
    }).catch(error => {
      console.error('❌ Failed to configure PDF.js worker:', error);
      
      // Fallback configuration - still use local file
      if (typeof window !== 'undefined' && (window as any).pdfjsLib) {
        const pdfjsLib = (window as any).pdfjsLib;
        pdfjsLib.GlobalWorkerOptions.workerSrc = './pdf.worker.min.js';
        console.log('✅ PDF.js worker configured via fallback method (local file)');
      }
    });
  } catch (error) {
    console.error('❌ Critical error configuring PDF.js worker:', error);
  }
}

// Auto-configure when this module is imported
configurePDFJSWorker();
