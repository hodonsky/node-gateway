"use strict"

const invalidRequestXRequestId = "000-00-00-00-000"
const nonServiceXRequestId = "000-000-00-000-000"

/**
 * Builds a service request action
 * @param { String } action - Service Action
 * @param { Object } data - data blob ( usually JSON ) to be sent to the service action
 * @return { Object<String,Object>} - Object with action and data AS an object.
 */
const buildAction = ( action, data ) => ( data ? { action, data } : { action })

/**
 * An error handler
 * @param { Object } response - response handling setters
 * @param { Error<xRequestId,status,userError,message> } error - error block
 */
export const handleError = ( response, error ) => {
  const { xRequestId, status = 500, userError, message } = error
  
  console.error( error )
  response.set( "x-request-id", xRequestId )
  response.status = status
  response.body = {
    error: userError && message ? message :
      "System Error!! If you do not understand why you are getting this error " +
          "please email administrator and reference the [ 'x-request-id' ] " +
          "header in this response."
  }
}

/**
 * Processes requestTransformers on an action related to the root context
 * @param { Array<Function> } requestPipe - Array of functions
 * @param { Object } ctx 
 */
export const requestTransformer = async ( requestPipe = [], ctx ) =>
  requestPipe && requestPipe.length > 0
    ? await requestPipe.reduce( async ( result, fn ) =>
        await fn( result ? result : ctx ), null )
    : (({ request: { body, query }, params = {} })=>
        ( body ? { ...body, ...params } : query ? { ...query, ...params } : {}))( ctx )

/**
 * Processes requestTransformers on an action related to the root context
 * @param { Array<Function> } responsePipe - Array of functions
 * @param { Object } data - Initial responseAVRO Object from queue
 * @param { Object } ctx - Original CTX from request
 */        
export const responseTransformer = async ( responsePipe = [], data = {}, ctx ) =>
  responsePipe && responsePipe.length > 0
    ? await responsePipe.reduce( async ( result, fn ) =>
        await fn( result ? result : data, ctx ), null )
    : data 

/**
 * Service request handler
 * @param { String } action - action name in the service to pass the request to
 */
export const handleRequest = action => async ctx => {
  const { response } = ctx
  try{
    if ( !action || !action?.topic ) {
      throw {
        xRequestId: invalidRequestXRequestId,
        message   : "Invalid request: Missing, argument[0], or argument[0].topic",
        userError : true,
        status    : 404
      }
    }
  } catch ( error ) {
    return handleError( response,  error )
  } 
  const {
    actor,
    name,
    requestAVRO,
    responseAVRO,
    requestTransformers = [],
    responseTransformers = [],
  } = action
  try {
    const { data, xRequestId } = await actor.createRequest(
                                          buildAction(
                                            name,
                                            await requestTransformer(
                                              requestTransformers,
                                              ctx
                                            )
                                          ),
                                          { requestAVRO, responseAVRO }
                                        )
    response.set( "x-request-id", xRequestId )
    response.status = 200
    response.body = responseTransformer( responseTransformers, data, ctx )
  } catch ( error ) {
    handleError( response, error )
  }
}

/**
 * Request service actions
 */
export const requestServicesActions = () => async ({ response }) => {
  try {
    response.set( "x-request-id", nonServiceXRequestId )
    response.status = 200
    const actionsArr = Object.keys( Actions ).filter( action => action !== "default" )

    response.body = actionsArr.reduce(( str, action ) =>
      str + ( actionsArr.indexOf( action ) === actionsArr.length - 1 ?
        `<li style='margin: 5px 0;'>${action}</li></ul>` :
        `<li style='margin: 5px 0;'>${action}</li>` ), "<ul style='list-style-type:none;'>" )
  } catch ( error ) {
    handleError( response, error )
  }
}

