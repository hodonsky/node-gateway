"use strict"

export default {
  koaMiddleware: [],
  mq           : {
    hostname       : process.env.MQ_HOSTNAME,
    password       : process.env.MQ_PASSWORD,
    port           : process.env.MQ_PORT,
    protocol       : process.env.MQ_PROTOCOL,
    serviceRegistry: process.env.MQ_SERVICE_REGISTRY,
    username       : process.env.MQ_USERNAME
  },
  port: process.env.PORT || 8080
}