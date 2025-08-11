const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = (env, argv) => {
  const isDev = argv.mode === 'development';
  
  return {
    mode: argv.mode || 'production',
    target: 'electron-renderer',
    entry: path.join(__dirname, 'src', 'renderer', 'index.tsx'),
    output: {
      path: path.join(__dirname, 'dist', 'renderer'),
      filename: 'bundle.js',
      publicPath: isDev ? '/' : './'
    },
    resolve: {
      extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
      alias: {
        '@': path.join(__dirname, 'src', 'renderer')
      }
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
          test: /\.pdf\.worker\.js$/,
          type: 'asset/resource',
          generator: {
            filename: 'workers/[name][ext]'
          }
        }
      ]
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: path.join(__dirname, 'src', 'renderer', 'index.html'),
        filename: 'index.html',
        inject: 'body',
        scriptLoading: 'defer'
      }),
      new CopyWebpackPlugin({
        patterns: [
          {
            from: 'node_modules/pdfjs-dist/build/pdf.worker.min.js',
            to: 'pdf.worker.min.js'
          },
          {
            from: 'public',
            to: '../public',
            noErrorOnMissing: true
          }
        ]
      })
    ],
    devServer: isDev ? {
      port: 3000,
      hot: true,
      historyApiFallback: true,
      static: {
        directory: path.join(__dirname, 'public')
      },
      headers: {
        'Access-Control-Allow-Origin': '*'
      }
    } : undefined,
    optimization: {
      minimize: !isDev,
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            priority: -10
          },
          default: {
            minChunks: 2,
            priority: -20,
            reuseExistingChunk: true
          }
        }
      }
    },
    performance: {
      hints: isDev ? false : 'warning',
      maxAssetSize: 512000,
      maxEntrypointSize: 512000
    },
    devtool: isDev ? 'source-map' : false
  };
};
