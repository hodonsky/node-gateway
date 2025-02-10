"use strict"

import { actionHandler, actionResponseHandler } from "./routeHelpers"
import Actor from "./Actor"
import Base from "./Base"
import cors from "@koa/cors"
import Koa from "koa"
import koaBodyParser from "@koa/bodyparser"
import KoaRouter from "@koa/router"
import koaHelmet from "koa-helmet"
import koaMorgan from "koa-morgan"
import koaSSLify from "koa-sslify"
import ServiceRegistry from "./ServiceRegistry"

const koaMiddleware = [
  cors(),
  koaHelmet(),
  koaMorgan( "combined" )
]

// if ( process.env.NODE_ENV === "production" ){
//   koaMiddleware.push(
//     koaSSLify({
//       trustProtoHeader     : true,
//       redirectMethods      : [ "HEAD", "OPTIONS", "GET", "POST" ],
//       specCompliantDisallow: true
//     })
//   )
// }

export default class Application extends Base {
  #app = null
  #actors = {}
  #config = {}
  #koaMiddleware = koaMiddleware
  #router = new KoaRouter()

  constructor( config ){
    super();
    this.#config = { ...config }
    this.#subscribeToActionsRegister()
  }
  #subscribeToActionsRegister(){
    const serviceRegistry = new ServiceRegistry( { mq: this.#config.mq, topic: this.#config.mq.serviceRegistry})
    serviceRegistry.on( "service-registry-updated", action => {
      action.requestTransformers = action.requestTransformers.map( str => new Function( 'return ' + str )())
      action.responseTransformers = action.responseTransformers.map( str => new Function( 'return ' + str )())
      this.#router.routes().router.stack.splice(
        this.#router.routes().router.stack.findIndex(
          layer => layer.path === action.route && layer.methods.includes(action.method)
        ),
        1
      )
      if ( !this.#actors[ action.topic ] ){
        this.#actors[ action.topic ] = new Actor( { mq: this.#config.mq, topic: action.topic } )
        this.#actors[ action.topic ].on("error", error => {
          console.error(error)
        })
      }
      this.#router[ action.method ](
        action.route,
        actionHandler( { ...action, actor: this.#actors[ action.topic ] } ),
        actionResponseHandler( { ...action, actor: this.#actors[ action.topic ] } )
      )
      console.log( this.#router.routes().router )
      this.emit( "router-updated" )
    })
    // serviceRegistry.on( "service-registry-updated", ( actions ) => {
      // this.#router = actions.reduce(
      //   ( router, action ) => {
      //     action.requestTransformers = action.requestTransformers.map( str => new Function( 'return ' + str )())
      //     action.responseTransformers = action.responseTransformers.map( str => new Function( 'return ' + str )())
      //     // console.log( `action: ${action.route}`, action )
      //     // this.#routes.removeRoutes(this.#routes.searchRoutes( layer => layer.path === action.route))
      //     const { stack } = router.routes().router
      //     console.log( "stack", stack )
      //     router.routes().router.stack = stack.filter( layer =>
      //                                                   layer.path !== action.route
      //                                                   || (
      //                                                     layer.path === action.route
      //                                                     && !layer.methods.includes(action.method)
      //                                                   )
      //                                                 )
      //     if ( !this.#actors[ action.topic ] ){
      //       this.#actors[ action.topic ] = new Actor( { mq: this.#config.mq, topic: action.topic } )
      //       this.#actors[ action.topic ].on("error", error => {
      //         console.error(error)
      //       })
      //     }
      //     console.log( "stack2", router.routes().router.stack )
      //     router[ action.method ](
      //       action.route,
      //       actionHandler( { ...action, actor: this.#actors[ action.topic ] } ),
      //       actionResponseHandler( { ...action, actor: this.#actors[ action.topic ] } )
      //     )
      //     console.log( "stack3", router.routes().router.stack )
      //     return router 
      //   },
      //   this.#router
      // )
      // this.emit( "router-updated" )          
    // })
  }
  listen( port, callback ){
    const koaApp = new Koa()
    koaApp.proxy = true,
    this.#koaMiddleware.forEach( middleware => koaApp.use( middleware ) ),
    koaApp.use( koaBodyParser( { enableTypes: [ "json" ] } ) )
    this.#app = koaApp.use( this.#router.routes() )
                      .use( this.#router.allowedMethods() )
                      .listen( port, callback )
    // const listener = () => {
    //   this.off( "router-updated", listener );
    //   this.#app.close()
    //   this.#app = null
    //   this.listen( port, callback )
    // }
    // this.on( "router-updated", listener)
    return this
  }
}