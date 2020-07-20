"use strict"
import { performance } from "perf_hooks"
import { v4 } from "uuid"

import mqConnection from "./connector"
import { fromAVRO, toAVRO } from "./avro"

/**
 * Actor class
 */
export default class Actor {
  #config = {
    actorName : "Service Actor",
    env       : "local",
    mq        : {},
    uuidFn    : v4,
    // In Seconds ( 4 minutes )
    requestTTL: 240,
    // In Seconds ( 30 minutes )
    ttlCheck  : 30 * 60
  }
  #link = null
  #instanceId = ""
  #responseTopic = ""
  #requestTTLCheck = null
  #responders = {}
  #respondersExpires = {}

  /**
   * Sends to console
   * @param { Object | String } entry - Object or string entry for logging
   * @param { String} severity - Log level [debug|info|error...]
   */
  #log( entry, severity ) {
    const body = {
      entry    : typeof entry === "string" ? { message: entry } : entry,
      service  : this.#config.actorName,
      timestamp: new Date().getTime()
    }
    if ( entry.stack ) { body.stack = entry.stack }
    console[!severity || entry.error ? "error" : severity]( body )
  }
  /**
   * Connection intilizer
   * @param { Object<RabbitMQConnection> } conn - Connection to Rabbit MQ
   */
  async #initilizeConnection(){
    const detach = () => {
      this.#link?.close()
      this.#link = null
    }
    const attach = async connection => {
      connection.on( "MQ:reconnected", attach )
      connection.on( "error", detach )
      connection.on( "close", detach )
      try {
        this.#link = await connection.createConfirmChannel()
        this.#link.assertQueue( this.#responseTopic, { durable: true })
        this.#link.consume( this.#responseTopic, this.#handleResponse.bind( this ), { noAck: true })
      } catch ( error ) {
        this.#log( { error } )
      }
    }
    attach( await mqConnection( this.#config.mq ) )
  }
  /**
   * Set's the request TTL timeout checker to run for N seconds
   * @param { Number } seconds - The number of seconds between requests TTL
   */
  #setRequestsTTL( seconds ) {
    if ( this.#requestTTLCheck > 0 ) {
      this.#requestTTLCheck = setInterval(() => {
        const epochTime = new Date().getTime()
        Object.keys( this.#responders ).forEach( key => {
          if ( this.#respondersExpires[ key ] >= epochTime ) {
            delete this.#responders[ key ]
            delete this.#respondersExpires[ key ]
          }
        })
      }, seconds * 1000 )
    }
  }
  /**
   * Abstract response handler. Binds to responder in the response list
   * @param { Object{content,properties{type,correlationId}}} messageBuffer - From the service
   */
  #handleResponse({ content, properties: { correlationId } }) {
    if ( this.#responders[ correlationId ]) {
      this.#responders[ correlationId ]({ content })
    } else {
      this.#log({ xRequestId: correlationId, message: `--- No Responder for xRequestId: ${correlationId} ---` })
    }
    if ( this.#responders[ correlationId ]) {
      delete this.#responders[ correlationId ]
    }
    if ( this.#respondersExpires[ correlationId ]) {
      delete this.#respondersExpires[ correlationId ]
    }
  }
  /**
   * Abstract response functionality
   * @param { String } correlationId - xRequestId
   * @param { Function } resolve - Accept respose function
   * @param { Function } reject - Reject response function
   */
  #buildResponder( correlationId, resolve, reject, responseAVRO ) {
    this.#responders[ correlationId ] = ({ content, error: responderError }) => {
      const { response, error } = fromAVRO( content, responseAVRO, true )
      if ( error ) {
        this.#log({ xRequestId: correlationId, ...responderError }, "error" )
        reject({ xRequestId: correlationId, ...error })
      } else {
        if ( responderError ) {
          this.#log({ xRequestId: correlationId, ...responderError }, "error" )
          reject({ xRequestId: correlationId, ...responderError })
        } else {
          resolve({ data: response, xRequestId: correlationId })
        }
      }
    }
    this.#respondersExpires[ correlationId ] =
      new Date().getTime() + ( 1000 * this.#config.requestTTL )
  }

  /**
   * Actor constructor
   * @param { Object<RabbitMQConnection> } conn - Connection to Rabbit MQ
   * @param { Object } config -
   */
  constructor( config ) {
    if ( !config.topic ) {
      throw { message: `Topic name required. example: { topic: "" }` }
    }
    this.#config = { ...this.#config, ...config }
    this.#instanceId = `${this.#config.actorName}_${performance.now()}`
    this.#responseTopic = `${this.#config.topic}-res-${this.#instanceId}-${process.pid}`

    this.#initilizeConnection()
    this.#setRequestsTTL( this.#config.ttlCheck )
  }
  /**
   * Request initilizer, response handler initilizer
   * @param { Object{action,data} } request - request object
   */
  createRequest( request, { requestAVRO, responseAVRO } ) {
    /**
     * Repopulate the request on top of the stack when
     * there is no link. Let the gateway timeout handle
     * closing connection requests that never make it to
     * the message queue
     */
    if ( !this.#link ) {
      return new Promise( ( resolve ) =>
        setTimeout(() =>
          process.nextTick( () =>
            resolve( this.createRequest( request, { requestAVRO, responseAVRO } ) )
          ), 500 ) )
    }
    const correlationId = this.#config.uuidFn()
    return new Promise( async ( resolve, reject ) => {
      try {
        this.#buildResponder( correlationId, resolve, reject, responseAVRO )
        try {
          this.#link.sendToQueue(
            this.#config.topic,
            await toAVRO( request, requestAVRO ),
            {
              persistent: true,
              type: request.action,
              replyTo: this.#responseTopic,
              correlationId
            },
            error => {
              if ( error ) {
                reject({
                  error     : "Could not satisfy request for unknown reason",
                  xRequestId: correlationId
                })
              }
            }
          )
        } catch ( error ) {
          reject({
            ...error,
            name     : "Actor::createRequest:sendToQueue[]",
            status   : 401,
            userError: true
          })
        }
      } catch ( error ) {
        reject({ error: `Not connected to ${this.config.actorName}` })
      }
    })
  }
}
