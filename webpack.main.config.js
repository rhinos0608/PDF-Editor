const path = require('path');

module.exports = (env, argv) => {
  const isDev = argv.mode === 'development';
  
  return {
    mode: argv.mode || 'production',
    target: 'electron-main',
    entry: path.join(__dirname, 'src', 'main', 'main.ts'),
    output: {
      path: path.join(__dirname, 'dist', 'main'),
      filename: 'main.js'
    },
    resolve: {
      extensions: ['.ts', '.js', '.json']
    },
    module: {
      rules: [
        {
          test: /\.ts$/,
          use: 'ts-loader',
          exclude: /node_modules/
        }
      ]
    },
    externals: {
      'electron': 'commonjs electron',
      'electron-store': 'commonjs electron-store',
      'electron-updater': 'commonjs electron-updater'
    },
    node: {
      __dirname: false,
      __filename: false
    },
    optimization: {
      minimize: !isDev
    },
    devtool: isDev ? 'source-map' : false
  };
};
