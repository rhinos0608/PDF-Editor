const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  mode: process.env.NODE_ENV || 'production',
  target: 'web', // Changed from 'electron-renderer' to 'web' to avoid Node.js context issues
  entry: {
    renderer: path.join(__dirname, 'src', 'renderer', 'index.tsx')
  },
  // Development server configuration
  devServer: {
    port: 8082,
    host: '0.0.0.0',
    static: {
      directory: path.join(__dirname, 'dist', 'renderer'),
    },
    historyApiFallback: true,
    hot: true,
    liveReload: true,
    open: false, // Don't open browser, Electron will handle this
    // Enhanced headers for development mode - secure but HMR-compatible
    headers: {
      'Content-Security-Policy': [
        "default-src 'self'",
        "script-src 'self' 'unsafe-eval' 'unsafe-inline' ws: wss:",  // HMR + PDF.js + inline scripts
        "style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com", // Styled components + FontAwesome
        "style-src-elem 'self' 'unsafe-inline' https://cdnjs.cloudflare.com", // Style elements
        "img-src 'self' data: blob:",                               // Images + embedded
        "font-src 'self' data: https://cdnjs.cloudflare.com",      // Local + CDN fonts
        "worker-src 'self' blob: data:",                           // PDF.js + OCR workers
        "connect-src 'self' ws: wss: http: https:",                // WebSocket HMR + API
        "object-src 'none'",                                       // No plugins
        "media-src 'none'",                                        // No media
        "frame-ancestors 'none'",                                  // Anti-framing
        "form-action 'none'",                                      // No form submission
        "base-uri 'self'",                                         // Restrict base
        "child-src 'self' blob:",                                  // Child contexts
        "manifest-src 'self'"                                      // Web manifest
      ].join('; '),
      'X-Content-Type-Options': 'nosniff',                        // MIME sniffing protection
      'X-Frame-Options': 'DENY',                                  // Frame protection
      'X-XSS-Protection': '1; mode=block',                       // XSS protection
      'Referrer-Policy': 'strict-origin-when-cross-origin'       // Referrer policy
    },
    client: {
      logging: 'info',
      overlay: {
        errors: true,
        warnings: false,
        runtimeErrors: false
      },
      reconnect: 10,
      progress: true
    }
  },
  // Reduce rebuild warnings and improve performance
  watchOptions: {
    aggregateTimeout: 300,
    poll: 1000,
    ignored: /node_modules/
  },
  output: {
    path: path.join(__dirname, 'dist', 'renderer'),
    filename: '[name].js',
    chunkFilename: '[name].chunk.js',
    clean: true,
    globalObject: 'this' // Fix for web workers
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
    alias: {
      '@': path.resolve(__dirname, 'src/renderer')
    },
    fallback: {
      // Node.js polyfills for browser - Provide safe fallbacks
      path: require.resolve('path-browserify'),
      fs: false,  // Disable fs - should use electronAPI instead
      crypto: false,  // Use Web Crypto API instead
      stream: false,
      buffer: require.resolve('buffer/'),
      process: require.resolve('process/browser.js'),
      util: require.resolve('util/'),
      os: false,  // Use navigator instead
      assert: false,
      url: false,
      child_process: false,
      net: false,
      tls: false,
      dns: false
    }
  },
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'ts-loader',
          options: {
            transpileOnly: true,
            compilerOptions: {
              module: 'esnext'
            }
          }
        }
      },
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              '@babel/preset-env',
              '@babel/preset-react'
            ]
          }
        }
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      },
      {
        test: /\.(png|jpg|jpeg|gif|svg|ico)$/,
        type: 'asset/resource',
        generator: {
          filename: 'images/[name][ext]'
        }
      },
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/,
        type: 'asset/resource',
        generator: {
          filename: 'fonts/[name][ext]'
        }
      },
      {
        test: /\.pdf$/,
        type: 'asset/resource',
        generator: {
          filename: 'pdf/[name][ext]'
        }
      },
      {
        test: /pdf\.worker\.min\.(js|mjs)$/,
        type: 'asset/resource',
        generator: {
          filename: 'pdf.worker.min.js'
        }
      },
      {
        test: /\.mjs$/,
        type: 'javascript/auto',
        resolve: {
          fullySpecified: false
        }
      }
    ]
  },
  plugins: [
    // Provide Node.js globals for browser environment - Enhanced fs handling
    new webpack.ProvidePlugin({
      global: ['globalThis', 'global'],
      process: 'process/browser.js',
      Buffer: ['buffer', 'Buffer']
    }),
    // Resolve Node.js module access issues - Enhanced for multiple modules
    new webpack.NormalModuleReplacementPlugin(
      /^fs$/,
      path.resolve(__dirname, 'src/renderer/utils/fs-mock.js')
    ),
    new webpack.NormalModuleReplacementPlugin(
      /^os$/,
      path.resolve(__dirname, 'src/renderer/utils/os-mock.js')
    ),
    new webpack.NormalModuleReplacementPlugin(
      /^crypto$/,
      path.resolve(__dirname, 'src/renderer/utils/crypto-mock.js')
    ),
    // Define environment variables (avoid NODE_ENV conflict with webpack mode)
    new webpack.DefinePlugin({
      'process.env.IS_ELECTRON': JSON.stringify(true),
      'process.env.APP_VERSION': JSON.stringify(require('./package.json').version),
      'process.env.IS_RENDERER': JSON.stringify(true),
      'global': 'globalThis',
      // Ensure Node.js globals are properly defined
      '__dirname': JSON.stringify('/'),
      '__filename': JSON.stringify('/index.js')
    }),
    new HtmlWebpackPlugin({
      template: path.join(__dirname, 'src', 'renderer', 'index.html'),
      filename: 'index.html',
      inject: 'body',
      chunks: ['renderer'],
      scriptLoading: 'defer'
    }),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: path.join(__dirname, 'node_modules', 'pdfjs-dist', 'build', 'pdf.worker.min.mjs'),
          to: 'pdf.worker.min.js',
          noErrorOnMissing: true
        },
        {
          from: path.join(__dirname, 'node_modules', 'pdfjs-dist', 'build', 'pdf.worker.min.js'),
          to: 'pdf.worker.min.js',
          noErrorOnMissing: true
        },
        {
          from: path.join(__dirname, 'node_modules', 'pdfjs-dist', 'cmaps'),
          to: 'cmaps',
          noErrorOnMissing: true
        },
        // Tesseract.js worker files
        {
          from: path.join(__dirname, 'node_modules', 'tesseract.js', 'dist', 'worker.min.js'),
          to: 'worker.min.js',
          noErrorOnMissing: true
        },
        {
          from: path.join(__dirname, 'node_modules', 'tesseract.js', 'dist', 'tesseract.min.js'),
          to: 'tesseract.min.js',
          noErrorOnMissing: true
        },
        // Tesseract.js core files
        {
          from: path.join(__dirname, 'node_modules', 'tesseract.js-core', 'tesseract-core.wasm.js'),
          to: 'tesseract-core.wasm.js',
          noErrorOnMissing: true
        },
        {
          from: path.join(__dirname, 'node_modules', 'tesseract.js-core', 'tesseract-core.wasm'),
          to: 'tesseract-core.wasm',
          noErrorOnMissing: true
        },
        // Tesseract language data files
        {
          from: path.join(__dirname, 'public', 'tessdata'),
          to: 'tessdata',
          noErrorOnMissing: true
        },
        {
          from: path.join(__dirname, 'public'),
          to: '../public',
          noErrorOnMissing: true
        },
        {
          from: path.join(__dirname, 'src', 'renderer', 'loading.css'),
          to: 'loading.css',
          noErrorOnMissing: true
        },
        {
          from: path.join(__dirname, 'src', 'renderer', 'loading.js'),
          to: 'loading.js',
          noErrorOnMissing: true
        }
      ]
    })
  ],
  optimization: {
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          priority: 10,
          reuseExistingChunk: true
        },
        pdfjs: {
          test: /[\\/]node_modules[\\/]pdfjs-dist[\\/]/,
          name: 'pdfjs',
          priority: 20,
          reuseExistingChunk: true
        },
        common: {
          minChunks: 2,
          priority: -10,
          reuseExistingChunk: true
        }
      }
    },
    runtimeChunk: 'single'
  },
  performance: {
    hints: false,
    maxEntrypointSize: 512000,
    maxAssetSize: 512000
  },
  stats: {
    colors: true,
    children: false,
    chunks: false,
    modules: false
  }
};
