"use strict"

const OS = require( "os" )
const pkg = require( "../package.json" )
const cpus = OS.cpus().length

export default {
  cluster : cpus > 1,
  cpus,
  env     : process.env.NODE_ENV,
  hostname: process.env.HOSTNAME,
  logger: {
    domain: process.env.LOGGLY_DOMAIN,
    token : process.env.LOGGLY_TOKEN,
    tags  : [ process.env.HOSTNAME, process.env.NODE_ENV ]
  },
  mq: {
    protocol: process.env.MQ_PROTOCOL,
    hostname: process.env.MQ_HOSTNAME,
    port    : process.env.MQ_PORT,
    username: process.env.MQ_USERNAME,
    password: process.env.MQ_PASSWORD
  },
  port: process.env.PORT || 8080,
  version: pkg.version
}