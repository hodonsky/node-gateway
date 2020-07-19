"use strict"

import Koa from "koa"
import koaBodyParser from "koa-bodyparser"
import cors from "koa-cors"
import helmet from "koa-helmet"
import enforceHttps from "koa-sslify"
import morgan from "koa-morgan"


import KoaRouter from "koa-router"

import Actor from "./Actor"
import Logger from "./Logger"
import { /*doAuth, */handleRequest } from "./routeHelpers"

export default ( config ) => {
  const { verbose, logger:loggerConfig , env, actions, mq } = config
  const app = new Koa()
  const router = new KoaRouter()
  const logger = new Logger( { ...loggerConfig, env } )
  app.proxy = true
  app.on( "error", ( error, ctx ) => {
    if ( verbose ) {
      logger.submit( "error", { error, ctx } )
    }
  })

  if ( env === "production" ) {
    app
      .use( enforceHttps({
        trustProtoHeader     : true,
        redirectMethods      : [ "HEAD", "OPTIONS", "GET", "POST" ],
        specCompliantDisallow: true
      }))
  }

  const actors = {}
  // build routes
  actions.forEach( val => {
    const args = [ val.method, val.route ]
    // TODO: this concept needs to be abstracted,
    // 'doAuth' currently requires the auth module,
    // which won't exist upon library completion
    // if ( val.auth ) {
    //   args.push(  val.auth === true ? doAuth( 0 ) : doAuth( val.auth ) )
    // }
    if ( !actors[ val.topic ] ){
      actors[ val.topic ] = new Actor({ topic:val.topic, logger: loggerConfig, mq })
    }
    val.actor = actors[ val.topic ]
    args.push( handleRequest( val ) )
    router[ val.method ]( ...args )
  })

  app
    .use( morgan( "combined", { stream: logger.stream }))
    //TODO: set list of FROM domains per environment, probably should be and env var actually
    .use( cors())
    .use( helmet())
    .use( koaBodyParser({
      enableTypes: [ "json", "form" ],
      formLimit  : "5mb"
    }))
    .use( router.routes() )
    .use( router.allowedMethods() )

  return app
}