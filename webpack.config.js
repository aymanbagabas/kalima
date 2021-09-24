const path = require('path')
const CopyPlugin = require('copy-webpack-plugin')

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
        { from: 'index.html', to: '' },
        { from: 'kalimat.webmanifest', to: '' },
        { from: 'cache.manifest', to: '' },
        { from: 'fnanendb.json', to: '' }
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
