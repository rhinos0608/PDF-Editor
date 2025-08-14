const fs = require('fs');
const path = require('path');

console.log('🚀 Emergency Build System - PDF Editor v6.0');
console.log('============================================\n');

// Create dist directories
const distDir = path.join(__dirname, 'dist');
const rendererDir = path.join(distDir, 'renderer');
const publicDir = path.join(distDir, 'public');

console.log('📁 Creating directories...');
[distDir, rendererDir, publicDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Copy main process files
console.log('📋 Copying main process files...');
const mainFiles = ['main.js', 'preload.js'];
mainFiles.forEach(file => {
  const src = path.join(__dirname, 'src', file);
  const dest = path.join(distDir, file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log(`  ✓ ${file}`);
  }
});

// Create a simple HTML file if webpack fails
console.log('📄 Creating fallback HTML...');
const fallbackHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy" content="default-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdnjs.cloudflare.com; img-src 'self' data: blob:;">
    <title>PDF Editor - Recovery Mode</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .container {
            text-align: center;
            padding: 2rem;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 20px;
            backdrop-filter: blur(10px);
        }
        h1 { margin-bottom: 1rem; font-size: 2.5rem; }
        p { margin-bottom: 2rem; opacity: 0.9; }
        button {
            background: white;
            color: #667eea;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            font-size: 16px;
            cursor: pointer;
            transition: transform 0.2s;
        }
        button:hover { transform: translateY(-2px); }
        .status { margin-top: 2rem; font-size: 0.9rem; opacity: 0.8; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🎯 PDF Editor v6.0</h1>
        <p>Emergency Recovery Mode Active</p>
        <button onclick="tryLoadApp()">Load Full Application</button>
        <div class="status">
            <p>If the application doesn't load, the build needs to be fixed.</p>
            <p>Run: <code>npm run build:emergency</code></p>
        </div>
    </div>
    <script>
        function tryLoadApp() {
            // Try to load the webpack bundle
            const script = document.createElement('script');
            script.src = 'renderer.js';
            script.onerror = () => {
                alert('Application bundle not found. Please rebuild the application.');
            };
            document.body.appendChild(script);
        }
        
        // Check if renderer bundle exists
        fetch('renderer.js').then(r => {
            if (r.ok) {
                tryLoadApp();
            }
        }).catch(() => {
            console.log('Renderer bundle not found, staying in recovery mode');
        });
    </script>
</body>
</html>`;

fs.writeFileSync(path.join(rendererDir, 'index.html'), fallbackHtml);
console.log('  ✓ Fallback HTML created');

// Copy PDF.js worker if available
const pdfWorkerSrc = path.join(__dirname, 'node_modules', 'pdfjs-dist', 'build', 'pdf.worker.min.js');
if (fs.existsSync(pdfWorkerSrc)) {
  fs.copyFileSync(pdfWorkerSrc, path.join(rendererDir, 'pdf.worker.min.js'));
  console.log('  ✓ PDF.js worker copied');
}

// Try to run webpack with a simple config
console.log('\n🔧 Attempting webpack build...');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const config = {
  mode: 'development',
  target: 'electron-renderer',
  entry: path.join(__dirname, 'src', 'renderer', 'index.tsx'),
  output: {
    path: rendererDir,
    filename: 'renderer.js'
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx']
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: path.join(__dirname, 'src', 'renderer', 'index.html'),
      filename: 'index.html'
    })
  ],
  performance: { hints: false },
  stats: 'minimal'
};

webpack(config, (err, stats) => {
  if (err) {
    console.error('❌ Webpack build failed:', err.message);
    console.log('\n⚠️  Using fallback HTML mode');
  } else if (stats.hasErrors()) {
    console.error('❌ Build errors:', stats.toString('errors-only'));
    console.log('\n⚠️  Using fallback HTML mode');
  } else {
    console.log('✅ Webpack build successful!');
  }
  
  // Create package.json for Electron
  const packageJson = {
    name: 'pdf-editor',
    version: '1.0.0',
    main: 'main.js',
    description: 'PDF Editor with Search v6.0'
  };
  
  fs.writeFileSync(
    path.join(distDir, 'package.json'),
    JSON.stringify(packageJson, null, 2)
  );
  
  console.log('\n✨ Build complete!');
  console.log('📦 Output directory:', distDir);
  console.log('\nTo run the application:');
  console.log('  cd dist && npx electron .');
});
