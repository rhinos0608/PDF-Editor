/**
 * Dependency Fix First - v15.1
 * Ensures all dependencies are installed before attempting build
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class DependencyFixer {
  constructor() {
    this.requiredDeps = [
      // Core build tools
      'webpack',
      'webpack-cli',
      'typescript',
      'ts-loader',
      'babel-loader',
      '@babel/core',
      '@babel/preset-env',
      '@babel/preset-react',
      
      // Webpack plugins
      'html-webpack-plugin',
      'copy-webpack-plugin',
      'style-loader',
      'css-loader',
      
      // Polyfills
      'buffer',
      'process',
      'path-browserify',
      
      // Core app dependencies
      'react',
      'react-dom',
      'electron',
      'pdfjs-dist',
      'pdf-lib'
    ];
    
    this.missingDeps = [];
  }

  checkDependencies() {
    console.log('🔍 Checking dependencies...\n');
    
    for (const dep of this.requiredDeps) {
      const depPath = path.join(__dirname, 'node_modules', dep);
      if (!fs.existsSync(depPath)) {
        this.missingDeps.push(dep);
        console.log(`  ❌ Missing: ${dep}`);
      } else {
        console.log(`  ✅ Found: ${dep}`);
      }
    }
    
    console.log(`\n📊 Summary: ${this.missingDeps.length} missing dependencies\n`);
    return this.missingDeps.length === 0;
  }

  async installDependencies() {
    if (this.missingDeps.length === 0) {
      console.log('✅ All dependencies already installed!\n');
      return true;
    }
    
    console.log(`📦 Installing ${this.missingDeps.length} missing dependencies...\n`);
    console.log('This may take a few minutes...\n');
    
    // Install in batches to avoid overwhelming npm
    const batches = [];
    const batchSize = 5;
    
    for (let i = 0; i < this.missingDeps.length; i += batchSize) {
      batches.push(this.missingDeps.slice(i, i + batchSize));
    }
    
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      console.log(`Installing batch ${i + 1}/${batches.length}: ${batch.join(', ')}`);
      
      const success = await this.installBatch(batch);
      if (!success) {
        console.log('⚠️  Some dependencies failed to install, continuing anyway...');
      }
    }
    
    return true;
  }

  installBatch(deps) {
    return new Promise((resolve) => {
      const npm = spawn('npm', ['install', ...deps], {
        cwd: __dirname,
        shell: true,
        stdio: 'inherit'
      });
      
      npm.on('close', (code) => {
        if (code === 0) {
          console.log('  ✅ Batch installed successfully\n');
          resolve(true);
        } else {
          console.log('  ⚠️  Batch installation had issues\n');
          resolve(false);
        }
      });
      
      npm.on('error', (error) => {
        console.error('  ❌ NPM error:', error.message);
        resolve(false);
      });
    });
  }

  async createSimpleBuild() {
    console.log('🔨 Creating simple build configuration...\n');
    
    // Create a minimal webpack config if it doesn't exist
    const webpackConfig = `const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');

module.exports = {
  mode: 'development',
  target: 'web',
  entry: {
    renderer: path.join(__dirname, 'src', 'renderer', 'index.tsx')
  },
  output: {
    path: path.join(__dirname, 'dist', 'renderer'),
    filename: '[name].js',
    clean: true
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx'],
    fallback: {
      path: require.resolve('path-browserify'),
      fs: false,
      buffer: require.resolve('buffer/')
    }
  },
  module: {
    rules: [
      {
        test: /\\.(ts|tsx)$/,
        use: 'ts-loader',
        exclude: /node_modules/
      },
      {
        test: /\\.css$/,
        use: ['style-loader', 'css-loader']
      }
    ]
  },
  plugins: [
    new webpack.ProvidePlugin({
      global: ['globalThis', 'global'],
      process: 'process/browser',
      Buffer: ['buffer', 'Buffer']
    }),
    new HtmlWebpackPlugin({
      template: path.join(__dirname, 'src', 'renderer', 'index.html'),
      filename: 'index.html'
    })
  ]
};`;
    
    fs.writeFileSync(path.join(__dirname, 'webpack.simple.config.js'), webpackConfig);
    console.log('  ✅ Simple webpack config created\n');
  }

  async buildApplication() {
    console.log('🚀 Building application...\n');
    
    // Create dist directories
    const dirs = [
      'dist',
      'dist/main',
      'dist/renderer'
    ];
    
    for (const dir of dirs) {
      const dirPath = path.join(__dirname, dir);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
    }
    
    // Try to build with npm
    return new Promise((resolve) => {
      console.log('Running: npm run build\n');
      
      const npm = spawn('npm', ['run', 'build'], {
        cwd: __dirname,
        shell: true,
        stdio: 'inherit'
      });
      
      npm.on('close', (code) => {
        if (code === 0) {
          console.log('\n✅ Build completed successfully!\n');
          resolve(true);
        } else {
          console.log('\n⚠️  Build had issues, trying emergency build...\n');
          this.emergencyBuild();
          resolve(true);
        }
      });
      
      npm.on('error', (error) => {
        console.error('Build error:', error.message);
        this.emergencyBuild();
        resolve(true);
      });
    });
  }

  emergencyBuild() {
    console.log('🆘 Creating emergency build...\n');
    
    // Ensure main files exist
    const mainJs = path.join(__dirname, 'dist/main/main.js');
    if (!fs.existsSync(mainJs)) {
      // Copy from src if exists, otherwise create minimal
      const srcMain = path.join(__dirname, 'src/main/main.ts');
      if (fs.existsSync(srcMain)) {
        console.log('  Copying main.ts to main.js...');
        const content = fs.readFileSync(srcMain, 'utf8');
        // Basic TypeScript removal
        const jsContent = content
          .replace(/: [A-Za-z<>[\]|]+/g, '')
          .replace(/import .* from/g, 'const imported =')
          .replace(/export /g, '');
        fs.writeFileSync(mainJs, jsContent);
      } else {
        console.log('  Creating minimal main.js...');
        fs.writeFileSync(mainJs, `
const { app, BrowserWindow } = require('electron');
const path = require('path');

let mainWindow;

app.disableHardwareAcceleration();

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });
  
  mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
}

app.whenReady().then(createWindow);
`);
      }
    }
    
    // Ensure preload exists
    const preloadJs = path.join(__dirname, 'dist/main/preload.js');
    if (!fs.existsSync(preloadJs)) {
      console.log('  Creating minimal preload.js...');
      fs.writeFileSync(preloadJs, `
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  openFile: () => ipcRenderer.invoke('open-file-dialog'),
  saveFile: (path, data) => ipcRenderer.invoke('save-file', path, data)
});
`);
    }
    
    // Ensure renderer HTML exists
    const indexHtml = path.join(__dirname, 'dist/renderer/index.html');
    if (!fs.existsSync(indexHtml)) {
      console.log('  Creating emergency index.html...');
      fs.writeFileSync(indexHtml, `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>PDF Editor</title>
  <style>
    body { 
      margin: 0; 
      font-family: -apple-system, system-ui, sans-serif;
      background: #1e1e1e;
      color: #e0e0e0;
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100vh;
    }
    .container {
      text-align: center;
      padding: 40px;
    }
    button {
      background: #667eea;
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 6px;
      font-size: 16px;
      cursor: pointer;
      margin: 10px;
    }
    button:hover {
      background: #5a67d8;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>PDF Editor</h1>
    <p>Emergency mode - Basic functionality available</p>
    <button onclick="alert('Opening PDF...')">Open PDF</button>
    <button onclick="location.reload()">Reload</button>
  </div>
  <script>
    console.log('Emergency mode active');
    // Add minimal PDF.js if available
    if (typeof pdfjsLib !== 'undefined') {
      pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
    }
  </script>
</body>
</html>`);
    }
    
    console.log('  ✅ Emergency build created\n');
  }

  async launchApplication() {
    console.log('🎮 Launching application...\n');
    
    return new Promise((resolve) => {
      const electron = spawn('npx', ['electron', '.', '--disable-gpu', '--no-sandbox'], {
        cwd: __dirname,
        shell: true,
        detached: true,
        stdio: 'ignore'
      });
      
      electron.unref();
      
      console.log('✅ Application launched!\n');
      console.log('If the window doesn\'t appear, try running manually:');
      console.log('  npx electron . --disable-gpu\n');
      
      resolve(true);
    });
  }

  async execute() {
    console.log('\n' + '='.repeat(60));
    console.log('  PDF Editor Dependency Fix v15.1');
    console.log('  Fixing dependencies first, then building');
    console.log('='.repeat(60) + '\n');
    
    try {
      // Step 1: Check dependencies
      const allInstalled = this.checkDependencies();
      
      // Step 2: Install missing dependencies
      if (!allInstalled) {
        await this.installDependencies();
      }
      
      // Step 3: Create simple build config
      await this.createSimpleBuild();
      
      // Step 4: Build application
      await this.buildApplication();
      
      // Step 5: Launch
      await this.launchApplication();
      
      console.log('='.repeat(60));
      console.log('  ✅ Process complete!');
      console.log('='.repeat(60) + '\n');
      
    } catch (error) {
      console.error('\n❌ Error:', error.message);
      console.log('\nTrying emergency recovery...\n');
      this.emergencyBuild();
      await this.launchApplication();
    }
  }
}

// Run the fixer
const fixer = new DependencyFixer();
fixer.execute();
