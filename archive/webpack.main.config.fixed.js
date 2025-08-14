const path = require('path');
const webpack = require('webpack');

module.exports = {
  mode: 'production',
  target: 'electron-main',
  
  // Explicit entry points
  entry: {
    main: path.resolve(__dirname, 'src', 'main.js'),
    preload: path.resolve(__dirname, 'src', 'preload.js')
  },
  
  // Explicit output configuration
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
    clean: false // Don't clean, renderer files are also here
  },
  
  resolve: {
    extensions: ['.js', '.json'],
    fallback: {
      "path": require.resolve("path-browserify"),
      "fs": false
    }
  },
  
  // No module rules needed for plain JS
  module: {
    rules: []
  },
  
  // Electron externals
  externals: {
    'electron': 'commonjs electron',
    'electron-store': 'commonjs electron-store',
    'electron-updater': 'commonjs electron-updater',
    'fs': 'commonjs fs',
    'path': 'commonjs path',
    'os': 'commonjs os',
    'crypto': 'commonjs crypto',
    'buffer': 'commonjs buffer',
    'stream': 'commonjs stream',
    'util': 'commonjs util'
  },
  
  node: {
    __dirname: false,
    __filename: false,
    global: false
  },
  
  plugins: [
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify('production')
    })
  ],
  
  optimization: {
    minimize: true
  },
  
  stats: 'verbose' // Show detailed output
};
