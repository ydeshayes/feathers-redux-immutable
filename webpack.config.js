var env = require('yargs').argv.env;
const ESLintPlugin = require('eslint-webpack-plugin');

var libraryName = 'feathers-redux';

var plugins = [new ESLintPlugin()], outputFile;

if (env.mode === 'production') {
  outputFile = libraryName + '.min.js';
} else {
  outputFile = libraryName + '.js';
}

const config = {
  mode: 'development',
  entry: __dirname + '/src/index.js',
  output: {
    path: __dirname + '/lib',
    filename: outputFile,
    library: libraryName,
    libraryTarget: 'umd',
    umdNamedDefine: true
  },
  module: {
    rules: [
      {
        test: /(\.js)$/,
        use: 'babel-loader',
        exclude: /(node_modules|bower_components)/
      }
    ]
  },
  plugins: plugins
};

if (env === 'mode=production') {
  config.mode = 'production';
}

module.exports = config;
