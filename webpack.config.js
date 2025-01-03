"use strict"

const { resolve } = require( "path" )
const TerserPlugin = require( "terser-webpack-plugin" )

module.exports = {
  devtool: "source-map",
  entry: "./lib/Gateway.js",
  externals: [ require( "webpack-node-externals" )() ],
  mode: "production",
  optimization: {
    minimize: true,
    minimizer: [new TerserPlugin({
      terserOptions: {
        compress:{
          passes: 2,
          toplevel: true,
          unsafe: true,
          unsafe_methods: true,
          unsafe_math: true
        },
        mangle: {
          toplevel: true
        }
      }
    })]
  },
  output: {
    path: resolve(__dirname, "bin"),
    filename: "index.js",
    libraryTarget: "commonjs2"
  },
  target:"node",
  module: {
    rules: [
      // {
      //   enforce: "pre",
      //   test: /\.js$/,
      //   exclude: /(node_modules)/,
      //   loader: "eslint-webpack-plugin",
      //   options: {
      //     fix: true,
      //     failOnError: true,
      //     configFile: resolve( __dirname, ".eslintrc" )
      //   }
      // },
      {
        test: /\.js$/,
        exclude: /(node_modules)/,
        use: {
          loader: "babel-loader"
        }
      }
    ]
  }
}