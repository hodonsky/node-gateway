"use strict"

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
export const requestTransformer = async ( ctx, requestPipe = [] ) =>
  requestPipe && requestPipe.length > 0
    ? await requestPipe.reduce( async ( result, fn ) =>
      await fn( result ? result : ctx ), null )
    : ( ( { request: { body, query }, params = {} } ) =>
      ( body ? { ...body, ...params } : query ? { ...query, ...params } : {} ) )( ctx )

/**
 * Processes requestTransformers on an action related to the root context
 * @param { Array<Function> } responsePipe - Array of functions
 * @param { Object } data - Initial responseAVRO Object from queue
 * @param { Object } ctx - Original CTX from request
 */
export const responseTransformer = async ( ctx, responsePipe = [], data = {} ) =>
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
        message   : "Invalid request: Missing, argument[0], or argument[0].topic",
        status    : 404,
        userError : true,
        xRequestId: "000-00-00-00-000"
      }
    }
  } catch ( error ) {
    return handleError( response, error )
  }
  const {
    actor,
    requestTransformers = [],
    responseTransformers = [],
    ...request
  } = action
  try {
    const { data, xRequestId } = await actor.createRequest(
      request,
      {
        data: await requestTransformer(
          ctx,
          requestTransformers
        )
      }
    )
    response.set( "x-request-id", xRequestId )
    response.status = 200
    response.body = await responseTransformer( ctx, responseTransformers, data )
  } catch ( error ) {
    handleError( response, error )
  }
}
