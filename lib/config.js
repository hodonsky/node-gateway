"use strict"

const pkg = require( "../package.json" )

export default {
  env          : process.env.NODE_ENV || "local",
  hostname     : process.env.HOSTNAME || "",
  koaMiddleware: [],
  mq           : {
    hostname: process.env.MQ_HOSTNAME,
    password: process.env.MQ_PASSWORD,
    port    : process.env.MQ_PORT,
    protocol: process.env.MQ_PROTOCOL,
    username: process.env.MQ_USERNAME
  },
  port   : process.env.PORT || 8080,
  version: pkg.version || "0.0.0"
}