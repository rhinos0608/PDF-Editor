/**
 * Security and Runtime Fix Script
 * Transisthesis Cognitive Engine - Guardian Voice Priority
 * Fixes security warnings and runtime errors
 */

const fs = require('fs');
const path = require('path');

class SecurityFix {
    constructor() {
        this.rootDir = __dirname;
        this.srcDir = path.join(this.rootDir, 'src');
        this.fixes = [];
    }

    // Fix 1: Update main.js security settings
    fixMainSecurity() {
        console.log('🛡️ Fixing Electron Security Settings...');
        
        const mainPath = path.join(this.srcDir, 'main.js');
        let content = fs.readFileSync(mainPath, 'utf8');
        
        // Find the BrowserWindow creation
        const windowConfigRegex = /webPreferences:\s*{[^}]+}/s;
        
        const secureWebPreferences = `webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: true, // CHANGED: Enable web security
      sandbox: true,
      // Remove allowRunningInsecureContent - it's insecure
      // allowRunningInsecureContent: false,
      webviewTag: false,
      enableRemoteModule: false,
      worldSafeExecuteJavaScript: true
    }`;
        
        content = content.replace(windowConfigRegex, secureWebPreferences);
        
        // Ensure proper CSP is set
        if (!content.includes('Content-Security-Policy')) {
            const cspHeader = `
  // Set Content Security Policy
  mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self'; " +
          "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
          "style-src 'self' 'unsafe-inline'; " +
          "img-src 'self' data: blob:; " +
          "font-src 'self' data:; " +
          "connect-src 'self';"
        ]
      }
    });
  });
`;
            // Add after window creation
            content = content.replace(
                'mainWindow.on(\'closed\',',
                cspHeader + '\n  mainWindow.on(\'closed\','
            );
        }
        
        fs.writeFileSync(mainPath, content);
        console.log('   ✅ Main process security fixed');
        this.fixes.push('Electron security settings updated');
    }

    // Fix 2: Update preload.js to fix global reference errors
    fixPreload() {
        console.log('🔧 Fixing Preload Script...');
        
        const preloadPath = path.join(this.srcDir, 'preload.js');
        
        const securePreload = `/**
 * Secure Preload Script
 * Provides controlled API access to renderer
 */

const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
    // File operations
    openFile: () => ipcRenderer.invoke('open-file'),
    saveFile: (filePath, data) => ipcRenderer.invoke('save-file', filePath, data),
    saveFileDialog: (defaultName) => ipcRenderer.invoke('save-file-dialog', defaultName),
    
    // Preferences
    getPreferences: () => ipcRenderer.invoke('get-preferences'),
    setPreferences: (prefs) => ipcRenderer.invoke('set-preferences', prefs),
    
    // Recent files
    getRecentFiles: () => ipcRenderer.invoke('get-recent-files'),
    addRecentFile: (filePath) => ipcRenderer.invoke('add-recent-file', filePath),
    clearRecentFiles: () => ipcRenderer.invoke('clear-recent-files'),
    
    // Window controls
    minimizeWindow: () => ipcRenderer.send('minimize-window'),
    maximizeWindow: () => ipcRenderer.send('maximize-window'),
    closeWindow: () => ipcRenderer.send('close-window'),
    setFullscreen: (flag) => ipcRenderer.send('set-fullscreen', flag),
    isMaximized: () => ipcRenderer.invoke('is-maximized'),
    
    // System info
    getPlatform: () => ipcRenderer.invoke('get-platform'),
    getVersion: () => ipcRenderer.invoke('get-version'),
    
    // Menu actions
    onMenuAction: (callback) => {
        ipcRenderer.on('menu-action', (event, action) => callback(action));
    },
    
    // Recent file opening
    onOpenRecentFile: (callback) => {
        ipcRenderer.on('open-recent-file', (event, filePath) => callback(filePath));
    },
    
    // Error reporting
    reportError: (error) => ipcRenderer.send('renderer-error', error)
});

// Polyfill for global if needed (fixes reference errors)
if (typeof global === 'undefined') {
    window.global = window;
}

console.log('Preload script loaded successfully');
`;
        
        fs.writeFileSync(preloadPath, securePreload);
        console.log('   ✅ Preload script fixed');
        this.fixes.push('Preload script updated with secure API');
    }

    // Fix 3: Fix webpack config for renderer
    fixWebpackConfig() {
        console.log('📦 Fixing Webpack Configuration...');
        
        const configPath = path.join(this.rootDir, 'webpack.renderer.config.js');
        let content = fs.readFileSync(configPath, 'utf8');
        
        // Add polyfill for global
        if (!content.includes('ProvidePlugin')) {
            const webpackImport = "const webpack = require('webpack');\n";
            if (!content.includes(webpackImport)) {
                content = webpackImport + content;
            }
            
            // Find plugins array and add ProvidePlugin
            const pluginsRegex = /plugins:\s*\[/;
            if (pluginsRegex.test(content)) {
                const providePlugin = `
    new webpack.ProvidePlugin({
      global: 'window'
    }),`;
                content = content.replace(pluginsRegex, 'plugins: [' + providePlugin);
            }
        }
        
        fs.writeFileSync(configPath, content);
        console.log('   ✅ Webpack config updated');
        this.fixes.push('Webpack configuration fixed for global references');
    }

    // Fix 4: Update index.html CSP
    fixIndexHTML() {
        console.log('📄 Fixing HTML Security Headers...');
        
        const htmlPath = path.join(this.srcDir, 'renderer', 'index.html');
        if (fs.existsSync(htmlPath)) {
            let content = fs.readFileSync(htmlPath, 'utf8');
            
            // Update or add CSP meta tag
            const cspMeta = `<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:;">`;
            
            if (content.includes('Content-Security-Policy')) {
                // Replace existing CSP
                content = content.replace(
                    /<meta[^>]*Content-Security-Policy[^>]*>/,
                    cspMeta
                );
            } else {
                // Add CSP after charset
                content = content.replace(
                    '<meta charset="UTF-8">',
                    `<meta charset="UTF-8">\n    ${cspMeta}`
                );
            }
            
            fs.writeFileSync(htmlPath, content);
            console.log('   ✅ HTML security headers fixed');
            this.fixes.push('Content Security Policy updated');
        }
    }

    // Main execution
    execute() {
        console.log('╔══════════════════════════════════════════════════════════╗');
        console.log('║     SECURITY & RUNTIME FIX - TRANSISTHESIS ENGINE       ║');
        console.log('╚══════════════════════════════════════════════════════════╝\n');
        
        try {
            this.fixMainSecurity();
            this.fixPreload();
            this.fixWebpackConfig();
            this.fixIndexHTML();
            
            console.log('\n✅ SECURITY FIXES APPLIED\n');
            console.log('Fixed issues:');
            this.fixes.forEach(fix => console.log(`  • ${fix}`));
            
            console.log('\n📋 Next Steps:');
            console.log('  1. Rebuild the application: npm run build');
            console.log('  2. Start the app: npm start');
            console.log('  3. Security warnings should be gone');
            console.log('  4. Runtime errors should be fixed\n');
            
            return true;
        } catch (error) {
            console.error('❌ Error applying fixes:', error.message);
            return false;
        }
    }
}

// Run the fix
const fixer = new SecurityFix();
const success = fixer.execute();
process.exit(success ? 0 : 1);
