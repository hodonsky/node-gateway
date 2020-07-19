"use strict"

const OS = require( "os" )
const pkg = require( "../package.json" )
const cpus = OS.cpus().length

export default {
  cluster : cpus > 1,
  cpus,
  env     : process.env.NODE_ENV || "local",
  hostname: process.env.HOSTNAME || "",
  mq: {
    protocol: process.env.MQ_PROTOCOL,
    hostname: process.env.MQ_HOSTNAME,
    port    : process.env.MQ_PORT,
    username: process.env.MQ_USERNAME,
    password: process.env.MQ_PASSWORD
  },
  port: process.env.PORT || 8080,
  version: pkg.version || "0.0.0"
}