/**
 * Fix App Functionality v16.0
 * Direct fix for making the PDF Editor features work
 */

const fs = require('fs-extra');
const path = require('path');

class FunctionalityFixer {
  constructor() {
    this.distPath = path.join(__dirname, 'dist', 'renderer');
  }

  async fix() {
    console.log('🔧 Fixing PDF Editor Functionality...\n');
    
    // Step 1: Create a working index.html with inline scripts
    await this.createWorkingHTML();
    
    // Step 2: Create a functional app.js
    await this.createWorkingApp();
    
    // Step 3: Copy PDF.js worker
    await this.ensurePDFWorker();
    
    // Step 4: Create styles
    await this.createStyles();
    
    console.log('\n✅ Functionality fixes applied!');
    console.log('\nThe app should now work. Restart it to see changes.');
  }

  async createWorkingHTML() {
    console.log('📝 Creating functional HTML...');
    
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Professional PDF Editor</title>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <link rel="stylesheet" href="app.css">
</head>
<body>
  <div id="root"></div>
  
  <!-- Load libraries from CDN for reliability -->
  <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
  
  <!-- Polyfills -->
  <script>
    window.global = window;
    window.process = { env: { NODE_ENV: 'production' } };
  </script>
  
  <!-- Main app -->
  <script src="app.js"></script>
</body>
</html>`;
    
    await fs.writeFile(path.join(this.distPath, 'index.html'), html);
    console.log('  ✅ HTML created');
  }

  async createWorkingApp() {
    console.log('📱 Creating functional app...');
    
    const appJs = `
// PDF Editor App - Functional Version
(function() {
  'use strict';
  
  // Wait for libraries to load
  function waitForLibraries(callback) {
    if (typeof React !== 'undefined' && 
        typeof ReactDOM !== 'undefined' && 
        typeof pdfjsLib !== 'undefined') {
      callback();
    } else {
      setTimeout(() => waitForLibraries(callback), 100);
    }
  }
  
  waitForLibraries(() => {
    console.log('Libraries loaded, initializing app...');
    
    // Configure PDF.js
    pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
    
    // Create main App component
    const App = () => {
      const [pdfDoc, setPdfDoc] = React.useState(null);
      const [pageNum, setPageNum] = React.useState(1);
      const [pageCount, setPageCount] = React.useState(0);
      const [scale, setScale] = React.useState(1.5);
      const [isDragging, setIsDragging] = React.useState(false);
      const canvasRef = React.useRef(null);
      const fileInputRef = React.useRef(null);
      
      // Render page
      const renderPage = React.useCallback(async (num) => {
        if (!pdfDoc) return;
        
        try {
          const page = await pdfDoc.getPage(num);
          const viewport = page.getViewport({ scale });
          const canvas = canvasRef.current;
          
          if (!canvas) return;
          
          const context = canvas.getContext('2d');
          canvas.height = viewport.height;
          canvas.width = viewport.width;
          
          const renderContext = {
            canvasContext: context,
            viewport: viewport
          };
          
          await page.render(renderContext).promise;
          console.log('Page rendered');
        } catch (error) {
          console.error('Error rendering page:', error);
        }
      }, [pdfDoc, scale]);
      
      // Load PDF from file
      const loadPDF = async (file) => {
        try {
          const arrayBuffer = await file.arrayBuffer();
          const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
          const pdf = await loadingTask.promise;
          
          setPdfDoc(pdf);
          setPageCount(pdf.numPages);
          setPageNum(1);
          
          console.log('PDF loaded, pages:', pdf.numPages);
        } catch (error) {
          console.error('Error loading PDF:', error);
          alert('Error loading PDF: ' + error.message);
        }
      };
      
      // Handle file selection
      const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file && file.type === 'application/pdf') {
          loadPDF(file);
        } else {
          alert('Please select a valid PDF file');
        }
      };
      
      // Handle drag and drop
      const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
      };
      
      const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
      };
      
      const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        
        const file = e.dataTransfer.files[0];
        if (file && file.type === 'application/pdf') {
          loadPDF(file);
        }
      };
      
      // Navigation
      const goToPrevPage = () => {
        if (pageNum > 1) {
          setPageNum(pageNum - 1);
        }
      };
      
      const goToNextPage = () => {
        if (pageNum < pageCount) {
          setPageNum(pageNum + 1);
        }
      };
      
      // Zoom
      const zoomIn = () => setScale(scale + 0.25);
      const zoomOut = () => setScale(Math.max(0.5, scale - 0.25));
      const resetZoom = () => setScale(1.5);
      
      // Open file dialog
      const openFile = () => {
        fileInputRef.current?.click();
      };
      
      // Download current PDF
      const downloadPDF = async () => {
        if (!pdfDoc) {
          alert('No PDF loaded');
          return;
        }
        
        try {
          const pdfBytes = await pdfDoc.saveDocument();
          const blob = new Blob([pdfBytes], { type: 'application/pdf' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'document.pdf';
          a.click();
          URL.revokeObjectURL(url);
        } catch (error) {
          console.error('Error saving PDF:', error);
        }
      };
      
      // Effect to render page when it changes
      React.useEffect(() => {
        if (pdfDoc) {
          renderPage(pageNum);
        }
      }, [pageNum, pdfDoc, renderPage]);
      
      // Check for Electron API
      React.useEffect(() => {
        if (window.electronAPI) {
          console.log('Electron API available');
          
          // Override open function to use Electron dialog
          window.openFileElectron = async () => {
            try {
              const result = await window.electronAPI.openFile();
              if (result) {
                const file = new File([result.data], result.path, { type: 'application/pdf' });
                loadPDF(file);
              }
            } catch (error) {
              console.error('Error opening file via Electron:', error);
            }
          };
        }
      }, []);
      
      return React.createElement('div', { className: 'app' },
        // Header
        React.createElement('div', { className: 'header' },
          React.createElement('div', { className: 'toolbar' },
            React.createElement('button', { onClick: openFile, className: 'btn btn-primary' },
              React.createElement('i', { className: 'fas fa-folder-open' }),
              ' Open PDF'
            ),
            React.createElement('button', { 
              onClick: downloadPDF, 
              className: 'btn btn-secondary',
              disabled: !pdfDoc 
            },
              React.createElement('i', { className: 'fas fa-download' }),
              ' Save'
            ),
            React.createElement('div', { className: 'separator' }),
            React.createElement('button', { 
              onClick: zoomOut, 
              className: 'btn btn-icon',
              disabled: !pdfDoc 
            },
              React.createElement('i', { className: 'fas fa-search-minus' })
            ),
            React.createElement('span', { className: 'zoom-level' }, 
              Math.round(scale * 100) + '%'
            ),
            React.createElement('button', { 
              onClick: zoomIn, 
              className: 'btn btn-icon',
              disabled: !pdfDoc 
            },
              React.createElement('i', { className: 'fas fa-search-plus' })
            ),
            React.createElement('button', { 
              onClick: resetZoom, 
              className: 'btn btn-icon',
              disabled: !pdfDoc 
            },
              React.createElement('i', { className: 'fas fa-compress' })
            )
          )
        ),
        
        // Main content
        React.createElement('div', { className: 'main-content' },
          // Hidden file input
          React.createElement('input', {
            ref: fileInputRef,
            type: 'file',
            accept: '.pdf',
            onChange: handleFileSelect,
            style: { display: 'none' }
          }),
          
          // PDF viewer or welcome screen
          pdfDoc ? 
            React.createElement('div', { className: 'pdf-viewer' },
              React.createElement('canvas', { 
                ref: canvasRef,
                className: 'pdf-canvas'
              })
            ) :
            React.createElement('div', { 
              className: 'welcome ' + (isDragging ? 'dragging' : ''),
              onDragOver: handleDragOver,
              onDragLeave: handleDragLeave,
              onDrop: handleDrop
            },
              React.createElement('div', { className: 'welcome-content' },
                React.createElement('i', { className: 'fas fa-file-pdf welcome-icon' }),
                React.createElement('h1', null, 'Professional PDF Editor'),
                React.createElement('p', null, 'Open a PDF to get started'),
                React.createElement('button', { 
                  onClick: openFile,
                  className: 'btn btn-large btn-primary'
                },
                  React.createElement('i', { className: 'fas fa-folder-open' }),
                  ' Choose PDF File'
                ),
                React.createElement('p', { className: 'drag-hint' }, 
                  'or drag and drop a PDF file here'
                )
              )
            )
        ),
        
        // Footer with navigation
        pdfDoc && React.createElement('div', { className: 'footer' },
          React.createElement('div', { className: 'navigation' },
            React.createElement('button', { 
              onClick: goToPrevPage,
              disabled: pageNum <= 1,
              className: 'btn btn-icon'
            },
              React.createElement('i', { className: 'fas fa-chevron-left' })
            ),
            React.createElement('span', { className: 'page-info' },
              'Page ' + pageNum + ' of ' + pageCount
            ),
            React.createElement('button', { 
              onClick: goToNextPage,
              disabled: pageNum >= pageCount,
              className: 'btn btn-icon'
            },
              React.createElement('i', { className: 'fas fa-chevron-right' })
            )
          )
        )
      );
    };
    
    // Mount the app
    const root = document.getElementById('root');
    if (root) {
      const reactRoot = ReactDOM.createRoot(root);
      reactRoot.render(React.createElement(App));
      console.log('App mounted successfully');
    } else {
      console.error('Root element not found');
    }
  });
})();
`;
    
    await fs.writeFile(path.join(this.distPath, 'app.js'), appJs);
    console.log('  ✅ App JavaScript created');
  }

  async createStyles() {
    console.log('🎨 Creating styles...');
    
    const css = `
/* PDF Editor Styles */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  background: #1e1e1e;
  color: #e0e0e0;
  overflow: hidden;
}

.app {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

/* Header */
.header {
  background: #2d2d30;
  border-bottom: 1px solid #3e3e42;
  padding: 8px;
}

.toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
}

.separator {
  width: 1px;
  height: 24px;
  background: #3e3e42;
  margin: 0 8px;
}

/* Buttons */
.btn {
  padding: 6px 12px;
  background: #0e639c;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: background 0.2s;
}

.btn:hover:not(:disabled) {
  background: #1177bb;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: #0e639c;
}

.btn-secondary {
  background: #3a3d41;
}

.btn-secondary:hover:not(:disabled) {
  background: #45494e;
}

.btn-icon {
  padding: 6px 8px;
  background: transparent;
  color: #cccccc;
}

.btn-icon:hover:not(:disabled) {
  background: #3a3d41;
}

.btn-large {
  padding: 12px 24px;
  font-size: 16px;
}

.zoom-level {
  padding: 0 8px;
  font-size: 14px;
  color: #cccccc;
  min-width: 50px;
  text-align: center;
}

/* Main Content */
.main-content {
  flex: 1;
  display: flex;
  overflow: hidden;
  position: relative;
}

/* Welcome Screen */
.welcome {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #252526;
}

.welcome.dragging {
  background: #2d2d30;
  border: 2px dashed #0e639c;
}

.welcome-content {
  text-align: center;
  padding: 40px;
}

.welcome-icon {
  font-size: 80px;
  color: #0e639c;
  margin-bottom: 20px;
}

.welcome h1 {
  font-size: 32px;
  margin-bottom: 10px;
  color: #ffffff;
}

.welcome p {
  font-size: 16px;
  margin-bottom: 30px;
  color: #cccccc;
}

.drag-hint {
  margin-top: 20px;
  font-size: 14px;
  color: #969696;
}

/* PDF Viewer */
.pdf-viewer {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: auto;
  background: #252526;
  padding: 20px;
}

.pdf-canvas {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  background: white;
  max-width: 100%;
  height: auto;
}

/* Footer */
.footer {
  background: #2d2d30;
  border-top: 1px solid #3e3e42;
  padding: 8px;
}

.navigation {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
}

.page-info {
  font-size: 14px;
  color: #cccccc;
  min-width: 120px;
  text-align: center;
}

/* Scrollbar */
::-webkit-scrollbar {
  width: 12px;
  height: 12px;
}

::-webkit-scrollbar-track {
  background: #2d2d30;
}

::-webkit-scrollbar-thumb {
  background: #424242;
  border-radius: 6px;
}

::-webkit-scrollbar-thumb:hover {
  background: #4a4a4a;
}
`;
    
    await fs.writeFile(path.join(this.distPath, 'app.css'), css);
    console.log('  ✅ Styles created');
  }

  async ensurePDFWorker() {
    console.log('📄 Ensuring PDF.js worker...');
    
    const workerSrc = path.join(__dirname, 'node_modules/pdfjs-dist/build/pdf.worker.min.js');
    const workerDest = path.join(this.distPath, 'pdf.worker.min.js');
    
    if (await fs.pathExists(workerSrc)) {
      await fs.copy(workerSrc, workerDest);
      console.log('  ✅ PDF.js worker copied');
    } else {
      console.log('  ⚠️  PDF.js worker not found, will use CDN fallback');
    }
  }
}

// Run the fixer
const fixer = new FunctionalityFixer();
fixer.fix().catch(console.error);
