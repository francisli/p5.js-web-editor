const webpack = require('webpack');
require('dotenv').config();

module.exports = {
  devtool: 'cheap-module-eval-source-map',
  entry: {
    app: [
      'webpack-hot-middleware/client',
      'react-hot-loader/patch',
      './client/index.jsx',
    ],
    vendor: [
      'react',
      'react-dom'
    ]
  },
  output: {
    path: `${__dirname}`,
    filename: 'app.js',
    publicPath: '/'
  },
  resolve: {
    extensions: ['.js', '.jsx'],
    modules: [
      'client',
      'node_modules'
    ]
  },
  plugins: [
    new webpack.HotModuleReplacementPlugin(),
    new webpack.optimize.CommonsChunkPlugin({
      name: 'vendor',
      minChunks: Infinity,
      filename: 'vendor.js',
    }),
    new webpack.DefinePlugin({
      'process.env': {
        API_URL: process.env.API_URL ? `"${process.env.API_URL}"` : undefined,
        CLIENT: JSON.stringify(true),
        FORCE_TO_HTTPS: process.env.FORCE_TO_HTTPS === 'true' ?
          JSON.stringify(true) :
          JSON.stringify(false),
        NODE_ENV: JSON.stringify('development'),
        S3_BUCKET: process.env.S3_BUCKET ? `"${process.env.S3_BUCKET}"` : undefined,
        S3_BUCKET_URL_BASE: process.env.S3_BUCKET_URL_BASE ? `"${process.env.S3_BUCKET_URL_BASE}"` : undefined,
        AWS_REGION: process.env.AWS_REGION ? `"${process.env.AWS_REGION}"` : undefined
      }
    })
  ],
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        exclude: [/node_modules/, /.+\.config.js/],
        use: [{
          loader: 'babel-loader',
          options: {
            cacheDirectory: true,
            plugins: ['react-hot-loader/babel'],
          } 
        }, {
          loader: 'eslint-loader'
        }]
        // use: {
        //   loader: 'babel-loader',
        //   options: {
        //     cacheDirectory: true,
        //     plugins: ['react-hot-loader/babel'],
        //   }
        // }
      },
      {
        test: /\.scss$/,
        loaders: ['style-loader', 'css-loader', 'sass-loader']
      },
      {
        test: /\.(svg|mp3)$/,
        loader: 'file-loader'
      },
      {
        test: /fonts\/.*\.(eot|svg|ttf|woff|woff2)$/,
        loader: 'file-loader'
      }
    ],
  },
};
