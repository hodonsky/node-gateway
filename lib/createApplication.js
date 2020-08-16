"use strict"

import Actor from "./Actor"
import Koa from "koa"
import koaBodyParser from "koa-bodyparser"
import KoaRouter from "koa-router"
import { actionHandler, actionResponseHandler } from "./routeHelpers"

// const hasStringProperty = property =>
//   action =>
//     action.hasOwnProperty( property )
//     && typeof action[ property ] === "string"
// const hasArrayProperty = property =>
//   action =>
//     action.hasOwnProperty( property )
//     && action[ property ] instanceof Array

// const hasTopic = hasStringProperty( "topic" )
// const hasAction = hasStringProperty( "action" )
// const hasRoute = hasStringProperty( "route" )
// const hasMethod = hasStringProperty( "method" )
// const hasResponseAVRO = hasArrayProperty( "responseAVRO" )
// const hasRequestAVRO = hasArrayProperty( "requestAVRO" )
// const hasAVRO = action => ( action |> hasResponseAVRO ) && ( action |> hasRequestAVRO )

// /**
//  * Validates action object
//  * @param { Object } action - action to validate
//  */
// const isValid = action =>
//   ( action |> hasTopic )
//   && ( action |> hasMethod )
//   && ( action |> hasRoute )
//   && ( action |> hasAction )
//   && ( action |> hasAVRO )

/**
 * Constructs KoaJS App
 * @param { Array } koaMiddleware - list of imported middleware for KoaJS
 * @param { Object<Router(KoaJS-Router)> } router - Router w/ action hooks
 * @param { Object<Application(KoaJS)>} app - Application starting point
 * @returns { Object<Application(KoaJS)> } - Constructed Application
 */
const buildKoaApp = ( koaMiddleware, router, app = new Koa() ) => (
  app.proxy = true,
  koaMiddleware.forEach( middleware => app.use( middleware ) ),
  app.use( koaBodyParser( { enableTypes: [ "json" ] } ) )
    .use( router.routes() )
    .use( router.allowedMethods() )
)

const actors = {}

const processor = actions => {
  const last = actions.pop()
  return [
    ...actions.map( action => actionHandler( { ...action, actor: actors[ action.topic ] } ) ),
    actionResponseHandler( { ...last, actor: actors[ last.topic ] } )
  ]
}
/**
 * Builds routes from actions
 * @param { Object } mq - mq config properties
 * @param { Array<Object> } actions - array of actions objects
 * @returns { Object<Router(KoaJS-Router)>} - koajs router
 */
const mqKoaRouteBuilder = ( mq, wrappers ) =>
  wrappers.reduce( ( router, { method, route, actions } ) => {
    try {
      actions.forEach( ( { topic } ) => {
        if ( !actors[ topic ] ){
          actors[ topic ] = new Actor( { mq, topic } )
        }
      } )
    } catch ( err ) {
      throw { error, value: JSON.stringify( val ) }
    }

    router[ method ](
      route,
      ...( actions |> processor )
    )
    return router
  }, new KoaRouter() )
/**
 * Koa Application factory with actor hooks from 'actions'
 * @param { Object{actions,koaMiddleware,mq} } config - Application config
 * @returns { Object<Application(KoaJS)>} - ready to listen constructed application
 */
export default ( { actions = [], koaMiddleware = [], mq } ) => {

  if ( !( actions instanceof Array ) ){
    throw new TypeError( "'actions' is not of type Array" )
  // } else if ( !actions.every( isValid ) ){
  //   throw new TypeError( "'action(s)' do not fit action schema" )
  } else if ( !mq ) {
    throw new TypeError( "destructured mq property is undefined" )
  }

  return buildKoaApp( koaMiddleware, mqKoaRouteBuilder( mq, actions ) )
}