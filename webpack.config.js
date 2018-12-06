const webpack = require('webpack');
const path = require('path');

module.exports = {
  entry: './src/index.js',
  output: {
    filename: 'ada-charts.js',
    path: path.resolve(__dirname, 'lib'),
    library: 'AdaCharts',
    libraryExport: 'default',
    libraryTarget: 'var',
    hotUpdateChunkFilename: 'hot/hot-update.js',
    hotUpdateMainFilename: 'hot/hot-update.json',
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        exclude: /node_modules/,
        use: [
          { loader: 'style-loader' },
          { loader: 'css-loader' },
        ],
      },
      {
        test: /\.(woff2?|ttf)$/,
        exclude: /node_modules/,
        loader: 'base64-inline-loader',
        options: {
          limit: 1000,
          name: '[name].[ext]',
        },
      },
    ],
  },
  devtool: '#inline-source-map',
  context: __dirname,
  target: 'web',
  devServer: {
    host: '0.0.0.0',
    port: '8080',
    hot: true,
    inline: true,
  },
  plugins: [
    new webpack.HotModuleReplacementPlugin(),
  ],
};
