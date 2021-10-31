const path = require('path')
const CopyPlugin = require('copy-webpack-plugin')
const BrowserSyncPlugin = require('browser-sync-webpack-plugin')

module.exports = {
  mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
  entry: './kalimat.js',
  output: {
    filename: 'kalimat.js',
    path: path.resolve(__dirname, 'dist'),
    library: 'Kalimat'
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: 'logo.png', to: '' },
        { from: 'favicon.ico', to: '' },
        { from: 'index.html', to: '' },
        { from: 'kalimat.webmanifest', to: '' },
        { from: 'cache.manifest', to: '' },
        { from: 'fnanendb.js', to: '' },
        { from: 'fnanendb.json', to: '' }
      ]
    }),
    new BrowserSyncPlugin({
      host: 'localhost',
      port: 3000,
      server: {
        baseDir: ['dist']
      }
    })
  ],
  module: {
    rules: [
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      },
      {
        test: /\.m?js$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
      }
    ]
  }
}
