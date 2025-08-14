const path = require('path');

module.exports = {
  mode: process.env.NODE_ENV || 'production',
  target: 'electron-main',
  entry: {
    main: path.join(__dirname, 'src', 'main', 'main.ts'),
    preload: path.join(__dirname, 'src', 'main', 'preload.ts')
  },
  output: {
    path: path.join(__dirname, 'dist', 'main'),
    filename: '[name].js',
    clean: true
  },
  resolve: {
    extensions: ['.ts', '.js', '.json']
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: 'ts-loader'
      },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
      }
    ]
  },
  externals: {
    electron: 'commonjs electron',
    'fs-extra': 'commonjs fs-extra',
    'electron-store': 'commonjs electron-store',
    'electron-updater': 'commonjs electron-updater',
    'electron-log': 'commonjs electron-log'
  },
  node: {
    __dirname: false,
    __filename: false
  },
  optimization: {
    minimize: true
  }
};