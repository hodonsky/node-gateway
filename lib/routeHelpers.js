"use strict"

const headerName = "x-request-id"

/**
 * Processes requestTransformers on an action related to the root context
 * @param { Array<Function> } requestPipe - Array of functions
 * @param { Object } ctx
 */
const requestTransformer = async ( ctx, requestPipe = [] ) =>
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
const responseTransformer = async ( ctx, responsePipe = [], data = {} ) =>
  responsePipe && responsePipe.length > 0
    ? await responsePipe.reduce( async ( result, fn ) =>
      await fn( result ? result : data, ctx ), null )
    : data

/**
 * An error handler
 * @param { Object } response - response handling setters
 * @param { Error<xRequestId,status,userError,message> } error - error block
 */
const handleError = ( response, error ) => {
  const { xRequestId = "000-00-00-00-000", status = 500, userError, message } = error
  response.set( headerName, xRequestId )
  response.status = status
  response.body = { error: userError && message ? message : `System Error: see ${ headerName }`}
}


export const actionHandler = ( {
  actor,
  requestTransformers = [],
  responseTransformers = [],
  ...action
} ) => async ( ctx, next ) => {
  try {
    const { data } = await actor.createRequest(
      action,
      { data: await requestTransformer( ctx, requestTransformers ) }
    )
    ctx.state.last = await responseTransformer( ctx, responseTransformers, data )
    return next()
  } catch ( error ) {
    handleError( ctx.response, error )
  }
}
/**
 * Service request handler
 * @param { String } action - action name in the service to pass the request to
 */
export const actionResponseHandler = ( {
  actor,
  requestTransformers = [],
  responseTransformers = [],
  ...action
} ) => async ctx => {
  const { response } = ctx
  try {
    const { data, xRequestId } = await actor.createRequest(
      action,
      { data: await requestTransformer( ctx, requestTransformers ) }
    )
    response.set( headerName, xRequestId )
    response.status = 200
    response.body = await responseTransformer( ctx, responseTransformers, data )
  } catch ( error ) {
    handleError( response, error )
  }
}
