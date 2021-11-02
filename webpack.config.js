const path = require('path')
const CopyPlugin = require('copy-webpack-plugin')
const BrowserSyncPlugin = require('browser-sync-webpack-plugin')
const WorkboxPlugin = require('workbox-webpack-plugin')

if (process.env.NODE_ENV !== 'production') {
  console.log('Looks like we are in development mode!')
}

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
        { from: 'cache.manifest', to: '' }
      ]
    }),
    new BrowserSyncPlugin({
      host: 'localhost',
      port: 3000,
      server: {
        baseDir: ['dist']
      }
    }),
    new WorkboxPlugin.GenerateSW({
      runtimeCaching: [
        {
          urlPattern: 'https://aymanbagabas.com/fnanendb/fnanendb.js',
          handler: 'NetworkFirst'
        }
      ]
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
