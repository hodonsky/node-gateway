"use strict"
const { resolve } = require( "path" )

module.exports = {
  entry: "./lib/Server.js",
  externals: [ require( "webpack-node-externals" )() ],
  mode: "production",
  output: {
    path: resolve(__dirname, "bin"),
    filename: "index.js",
    libraryTarget: "commonjs2"
  },
  target:"node",
  module: {
    rules: [
      {
        enforce: "pre",
        test: /\.js$/,
        exclude: /(node_modules)/,
        loader: "eslint-loader",
        options: {
          fix: true,
          failOnError: true,
          configFile: resolve( __dirname, ".eslintrc" )
        }
      },
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