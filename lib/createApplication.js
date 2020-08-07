"use strict"

import Actor from "./Actor"
import { handleRequest } from "./routeHelpers"
import Koa from "koa"
import koaBodyParser from "koa-bodyparser"
import KoaRouter from "koa-router"

const METHODS = [ "get", "post", "put", "put", "update", "delete" ]

const hasStringProperty = property =>
  action =>
    action.hasOwnProperty( property )
    && typeof action[ property ] === "string"
const hasArrayProperty = property =>
  action =>
    action.hasOwnProperty( property )
    && action[ property ] instanceof Array

const hasTopic = hasStringProperty( "topic" )
const hasAction = hasStringProperty( "action" )
const hasRoute = hasStringProperty( "route" )
const hasMethod = action =>
  ( action |> hasStringProperty( "method" ) )
  && METHODS.indexOf( action.method ) > -1
const hasResponseAVRO = hasArrayProperty( "responseAVRO" )
const hasRequestAVRO = hasArrayProperty( "requestAVRO" )
const hasAVRO = action => ( action |> hasResponseAVRO ) && ( action |> hasRequestAVRO )

const isValid = action =>
  ( action |> hasTopic )
  && ( action |> hasMethod )
  && ( action |> hasRoute )
  && ( action |> hasAction )
  && ( action |> hasAVRO )

const buildApp = () => {
  const app = new Koa()
  app.proxy = true
  return app.on( "error", ( error, ctx ) => {
    console.error( { ctx, error } )
  } )
}
const buildRoutes = ( actions, mqConfig ) => {
  const actors = {}
  return actions.reduce( ( router, val ) => {
    const args = [ val.method, val.route ]
    if ( !actors[ val.topic ] ){
      try {
        actors[ val.topic ] = new Actor( { mq: mqConfig, topic: val.topic } )
      } catch ( err ) {
        console.error( `Action [${ val.name }] failed to create new actor` )
        console.log( JSON.stringify( val ) )
        return router
      }
    }
    val.actor = actors[ val.topic ]
    args.push( handleRequest( val ) )
    router[ val.method ]( ...args )
    return router
  }, new KoaRouter() )
}

export default ( { actions = [], koaMiddleware = [], env = "local", mq: mqConfig } ) => {

  if ( !( actions instanceof Array ) ){
    throw new TypeError( "argument[0]['actions'] is required to be an Array" )
  } else if ( !actions.every( action => action |> isValid ) ){
    throw new TypeError(
      "'actions' items are required to fit the action object schema"
    )
  }

  const
    app = buildApp( env ),
    router = buildRoutes( actions, mqConfig )

  koaMiddleware.forEach( middle => middle |> app.use )

  return app
    .use( koaBodyParser( { enableTypes: [ "json" ] } ) )
    .use( router.routes() )
    .use( router.allowedMethods() )
}