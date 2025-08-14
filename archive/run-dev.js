/**
 * PDF Editor - Development Runner
 * This script runs the app in development mode with proper configuration
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('\n🚀 Starting PDF Editor in Development Mode\n');

// Set environment variables
process.env.NODE_ENV = 'development';
process.env.ELECTRON_DISABLE_GPU = '1';

// Check if dist files exist
const distPath = path.join(__dirname, 'dist', 'renderer', 'index.html');
if (!fs.existsSync(distPath)) {
  console.log('⚠️  Built files not found. Building first...');
  console.log('Run: npm run build\n');
  process.exit(1);
}

// Make sure web-init.js is loaded properly
const webInitPath = path.join(__dirname, 'dist', 'renderer', 'web-init.js');
if (!fs.existsSync(webInitPath)) {
  console.log('⚠️  web-init.js not found. Creating it...');
  const webInitContent = `
// Web initialization - ensures electronAPI exists
(function() {
  if (typeof window !== 'undefined' && !window.electronAPI) {
    window.electronAPI = {
      isDev: false,
      openFile: async () => null,
      saveFileDialog: async (p) => p || 'document.pdf',
      saveFile: async () => ({ success: false }),
      getPreferences: async () => ({ theme: 'dark' }),
      setPreferences: async () => ({ success: true }),
      getRecentFiles: async () => [],
      addRecentFile: async () => [],
      onMenuAction: () => {},
      removeAllListeners: () => {}
    };
  }
})();
`;
  fs.writeFileSync(webInitPath, webInitContent);
}

// Start Electron with the built files
console.log('📂 Loading from: dist/renderer/index.html');
console.log('🔧 GPU acceleration disabled for stability');
console.log('✨ Starting Electron...\n');

const electron = spawn('npx', ['electron', 'dist/main/main.js', '--disable-gpu'], {
  stdio: 'inherit',
  shell: true,
  env: process.env
});

electron.on('close', (code) => {
  console.log(`\n👋 PDF Editor closed with code ${code}`);
  process.exit(code);
});

electron.on('error', (err) => {
  console.error('❌ Failed to start:', err);
  process.exit(1);
});
