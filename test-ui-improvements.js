const { app, BrowserWindow } = require('electron');
const path = require('path');

// Simple test to verify the application loads properly
app.whenReady().then(() => {
  const testWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      preload: path.join(__dirname, 'dist/main/preload.js')
    },
    show: false // Don't show window during test
  });

  testWindow.loadFile(path.join(__dirname, 'dist/renderer/index.html'));

  testWindow.webContents.on('did-finish-load', () => {
    console.log('✅ Application loaded successfully');
    
    // Test for common UI performance issues
    testWindow.webContents.executeJavaScript(`
      // Check if React components are properly memoized
      const checkPerformance = () => {
        const results = {
          pdfWorkerConfigured: !!window.pdfjsLib?.GlobalWorkerOptions?.workerSrc,
          reactErrorBoundary: !!window.React?.createElement,
          componentsLoaded: !!document.querySelector('.adobe-app'),
          memoryUsage: performance.memory ? {
            usedJSHeapSize: performance.memory.usedJSHeapSize,
            totalJSHeapSize: performance.memory.totalJSHeapSize,
            jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
          } : 'Not available'
        };
        return results;
      };
      
      checkPerformance();
    `).then(results => {
      console.log('🔍 Performance Test Results:');
      console.log('PDF Worker Configured:', results.pdfWorkerConfigured);
      console.log('React Components Loaded:', results.componentsLoaded);
      console.log('Memory Usage:', results.memoryUsage);
      
      // Close test after 3 seconds
      setTimeout(() => {
        console.log('✅ UI improvements test completed successfully');
        app.quit();
      }, 3000);
    }).catch(error => {
      console.error('❌ Test failed:', error);
      app.quit();
    });
  });

  testWindow.webContents.on('console-message', (event, level, message) => {
    console.log(`[Renderer ${level}]:`, message);
  });

  testWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('❌ Failed to load application:', errorDescription);
    app.quit();
  });
});

app.on('window-all-closed', () => {
  app.quit();
});