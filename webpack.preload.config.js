const path = require('path');

module.exports = {
  mode: process.env.NODE_ENV || 'production',
  target: 'electron-preload',
  entry: path.join(__dirname, 'src', 'preload.js'),
  output: {
    path: path.join(__dirname, 'dist', 'main'),
    filename: 'preload.js',
    clean: false // Don't clean to preserve other files
  },
  resolve: {
    extensions: ['.js', '.ts', '.json']
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
      },
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: 'ts-loader'
      }
    ]
  },
  node: {
    __dirname: false,
    __filename: false
  },
  optimization: {
    minimize: false // Don't minimize preload for easier debugging
  }
};
