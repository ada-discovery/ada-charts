const webpack = require('webpack');
const path = require('path');
const commitHash = require('child_process')
  .execSync('git rev-parse --short HEAD')
  .toString()
  .trim();

module.exports = (env, argv) => ({
  entry: './src/index.js',
  output: {
    filename: argv.mode === 'development' ? 'ada-charts.js' : `ada-charts-${commitHash}.min.js`,
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
        test: /\.(png|woff|woff2|eot|ttf|svg)$/,
        loader: 'url-loader',
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
});
