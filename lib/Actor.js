"use strict"

import mqConnection from "./connector"
import { performance } from "perf_hooks"
import { fromAVRO, toAVRO } from "@donsky/node-avro"

/**
 * Actor class
 */
export default class {
  #config = {
    mq   : {},
    topic: undefined
  }

  #link = null
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
      entry : typeof entry === "string" ? { message: entry } : entry,
      timestamp: new Date().getTime()
    }
    if ( entry.stack ) { body.stack = entry.stack }
    console[!severity || entry.error ? "error" : severity]( body )
  }

  /**
   * Connection intilizer
   */
  async #initilizeConnection(){
    const detach = () => {
      this.#link?.close()
      this.#link = null
    }
    const attach = async connection => {
      connection.on( "AMQP:reconnected", attach )
      connection.on( "error", detach )
      connection.on( "close", detach )
      try {
        this.#link = await connection.createConfirmChannel()
        this.#link.assertQueue( this.#responseTopic, { durable: true } )
        this.#link.consume(
          this.#responseTopic,
          this.#handleResponse.bind( this ),
          { noAck: true }
        )
      } catch ( error ) {
        this.#log( { error } )
      }
    }
    attach( await mqConnection( this.#config.mq ) )
  }

  /**
   * Set's the request TTL timeout checker to run for N seconds
   */
  #setRequestsTTL() {
    if ( this.#requestTTLCheck > 0 ) {
      this.#requestTTLCheck = setInterval( () => {
        const epochTime = new Date().getTime()
        Object.keys( this.#responders ).forEach( key => {
          if ( this.#respondersExpires[ key ] >= epochTime ) {
            delete this.#responders[ key ]
            delete this.#respondersExpires[ key ]
          }
        } )
      // 30 Minutes
      }, 30 * 60 * 1000 )
    }
  }

  /**
   * Abstract response handler. Binds to responder in the response list
   * @param { Object{content,properties{correlationId}}} messageBuffer - From the service
   */
  #handleResponse( { content, properties: { correlationId } } ) {
    if ( this.#responders[ correlationId ] ) {
      this.#responders[ correlationId ]( { content } )
    } else {
      this.#log( {
        xRequestId: correlationId,
        message: `No Responder for: ${correlationId}`
      } )
    }
    if ( this.#responders[ correlationId ] ) {
      delete this.#responders[ correlationId ]
    }
    if ( this.#respondersExpires[ correlationId ] ) {
      delete this.#respondersExpires[ correlationId ]
    }
  }

  /**
   * Abstract response functionality
   * @param { String } correlationId - xRequestId
   * @param { Function } resolve - Accept respose function
   * @param { Function } reject - Reject response function
   * @param { Object } responseAVRO - response AVRO expected schema
   */
  #buildResponder( correlationId, resolve, reject, responseAVRO ) {
    this.#responders[ correlationId ] = async ( { content, error: responderError } ) => {
      let response, error
      try {
        response = await fromAVRO( content, responseAVRO, { response: true } )
      } catch ( err ) {
        error = await fromAVRO( content, {}, { error: true } )
      }
      if ( error ) {
        this.#log( { xRequestId: correlationId, ...responderError }, "error" )
        reject( { xRequestId: correlationId, ...error } )
      } else {
        if ( responderError ) {
          this.#log( { xRequestId: correlationId, ...responderError }, "error" )
          reject( { xRequestId: correlationId, ...responderError } )
        } else {
          resolve( { data: response, xRequestId: correlationId } )
        }
      }
    }
    // 2 Minutes
    this.#respondersExpires[ correlationId ] = new Date().getTime() + 120000
  }

  /**
   * Actor constructor
   * @param { Object } config - main config requires 'topic'
   */
  constructor( config ) {
    if ( !config.topic ) {
      throw new Error( "config missing 'topic'" )
    }
    this.#config = { ...config }
    this.#responseTopic = `${ this.#config.topic }-res-${ performance.now() }-${ process.pid }`

    this.#initilizeConnection()
    this.#setRequestsTTL()
  }

  /**
   * Request initilizer, response handler initilizer
   * @param { Object{action,requestAVRO,responseAVRO} } request - request object
   * @param { Object } data - data to send along
   */
  createRequest( { action, requestAVRO, responseAVRO }, data ) {
    /**
     * Repopulate the request on top of the stack when
     * there is no link. Let the gateway timeout handle
     * closing connection requests that never make it to
     * the message queue
     */
    if ( !this.#link ) {
      return new Promise( resolve =>
        setTimeout( () =>
          process.nextTick( () =>
            resolve( this.createRequest( { action, requestAVRO, responseAVRO }, data ) )
          ), 500 ) )
    }
    const correlationId = `${ this.#responseTopic }_${ performance.now() }_${ Math.random() }`
    return new Promise( async ( resolve, reject ) => {
      try {
        this.#buildResponder( correlationId, resolve, reject, responseAVRO )
        try {
          this.#link.sendToQueue(
            this.#config.topic,
            await toAVRO( data, requestAVRO ),
            {
              correlationId,
              persistent: true,
              replyTo   : this.#responseTopic,
              type      : action
            },
            error => {
              if ( error ) {
                reject( { error, xRequestId: correlationId } )
              }
            }
          )
        } catch ( error ) {
          reject( {
            ...error,
            status   : 401,
            userError: true
          } )
        }
      } catch ( error ) {
        reject( { error } )
      }
    } )
  }
}
