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
    port: 8080,
    host: '0.0.0.0',
    static: {
      directory: path.join(__dirname, 'dist', 'renderer'),
    },
    historyApiFallback: true,
    hot: true,
    liveReload: true,
    open: false, // Don't open browser, Electron will handle this
    // Headers for development mode - more permissive CSP
    headers: {
      'Content-Security-Policy': [
        "default-src 'self'",
        "script-src 'self' 'unsafe-eval' 'unsafe-inline'", // Allow eval and inline scripts for webpack HMR and PDF.js
        "style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com", // Allow ALL inline styles for development
        "style-src-elem 'self' 'unsafe-inline' https://cdnjs.cloudflare.com", // Explicitly allow style elements
        "img-src 'self' data: blob:",
        "font-src 'self' data: https://cdnjs.cloudflare.com", // Allow FontAwesome fonts
        "worker-src 'self' blob: data:", // Allow workers for PDF.js
        "connect-src 'self' ws: wss: http: https:", // Allow all connections for HMR
        "object-src 'none'",
        "media-src 'none'",
        "frame-ancestors 'none'",
        "form-action 'self'",
        "base-uri 'self'",
        "child-src 'self' blob:"
      ].join('; ')
    },
    client: {
      logging: 'info',
      overlay: {
        errors: true,
        warnings: false
      },
      reconnect: 10
    }
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
      // Node.js polyfills for browser
      path: require.resolve('path-browserify'),
      fs: false,
      crypto: false,
      stream: false,
      buffer: require.resolve('buffer/'),
      process: require.resolve('process/browser.js'),
      util: require.resolve('util/')
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
    // Provide Node.js globals for browser environment
    new webpack.ProvidePlugin({
      global: ['globalThis', 'global'],
      process: 'process/browser.js',
      Buffer: ['buffer', 'Buffer']
    }),
    // Define environment variables
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production'),
      'process.env.IS_ELECTRON': JSON.stringify(true),
      'global': 'globalThis'
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
        {
          from: path.join(__dirname, 'public'),
          to: '../public',
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
