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
