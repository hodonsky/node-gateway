"use strict"
import { performance } from "perf_hooks"

import AWS from "aws-sdk"
import { v4 } from "uuid"

import Connection from "./Connector"
import { fromAVRO, toAVRO } from "./AVRO"
import Logger from "./Logger"

/**
 * Actor class
 */
export default class Actor {
  #config = {
    actorName : "Service Actor",
    env       : "local",
    logger    : {},
    mq        : {},
    uuidFn    : v4,
    // In Seconds ( 4 minutes )
    requestTTL: 240,
    // In Seconds ( 30 minutes )
    ttlCheck  : 30 * 60
  }
  #link = null
  #logger = null
  #instanceId = ""
  #responseTopic = ""
  #requestTTLCheck = null
  #responders = {}
  #respondersExpires = {}

  /**
   * Sends log to logger transport
   * @param { Object | String } entry - Object or string entry for logging
   * @param { String} severity - Log level [debug|info|error...]
   */
  #log( entry, severity ) {
    if ( this.#logger && this.#logger.submit ) {
      if ( typeof entry === "string" ) {
        entry = { message: entry }
      }
      const body = {
        ...entry,
        service  : this.#config.actorName,
        timestamp: new Date().getTime()
      }

      if ( entry.stack ) {
        body.stack = entry.stack
      }
      if ( !severity || entry.error ) {
        severity = "error"
      }
      this.#logger.submit( body, severity )
    } else {
      if ( severity in ["error", "info", "debug", "log" ] ) {
        console[ severity in ["error", "info", "debug", "log" ] ? severity : "log" ]( entry )
      }
    }
  }
  /**
   * Connection intilizer
   * @param { Object<RabbitMQConnection> } conn - Connection to Rabbit MQ
   */
  async #initilizeConnection(){
    let instanceId
    if ( this.#config.env !== "local" ) {
      try{
        instanceId = await new AWS.MetadataService().request( "/latest/meta-data/instance-id" ).promise()
       } catch ( error ){
        if ( error ) {
          this.#log({ error })
        }
      } 
    }
    this.#instanceId = instanceId ? instanceId : `${this.#config.actorName}_${performance.now()}`
    this.#responseTopic = `${this.#config.topic}-res-${this.#instanceId}-${process.pid}`

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
        this.#link.assertQueue( this.#responseTopic, { durable: true })
        this.#link.consume( this.#responseTopic, this.#handleResponse.bind( this ), { noAck: true })
      } catch ( error ) {
        this.#log( { error } )
      }
    }
    attach( await Connection( this.#config.mq ) )
  }
  /**
   * Set's the request TTL timeout checker to run for N seconds
   * @param { Number } seconds - The number of seconds between requests TTL
   */
  #setRequestsTTL( seconds ) {
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
  /**
   * Abstract response handler. Binds to responder in the response list
   * @param { Object{content,properties{type,correlationId}}} messageBuffer - From the service
   */
  #handleResponse({ content, properties: { correlationId } }) {
    if ( this.#responders[ correlationId ]) {
      this.#responders[ correlationId ]({ content })
    } else {
      this.#log({ xRequestId: correlationId, text: `--- No Responder for xRequestId: ${correlationId} ---` })
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
  #buildResponder( correlationId, resolve, reject, avroResponse ) {
    this.#responders[ correlationId ] = ({ content, error: responderError }) => {
      const { response, error } = fromAVRO( content, avroResponse )
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
      throw { message: `Topic name required { topic: "" }` }
    }
    this.#config = { ...this.#config, ...config }
    this.#logger = new Logger( this.#config.logger )
    this.#initilizeConnection()
    this.#setRequestsTTL( this.#config.ttlCheck )
  }
  /**
   * Request initilizer, response handler initilizer
   * @param { Object{action,data} } request - request object
   */
  createRequest( request, { requestAVRO, responseAVRO } ) {
    if ( !this.#link ) {
      return new Promise( ( resolve ) =>
        setTimeout(() =>
          process.nextTick( () =>
            resolve( this.createRequest( request, { requestAVRO, responseAVRO } ) )
          ), 250 ) )
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
            ( error, ok ) => {
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
            message  : error.message,
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
