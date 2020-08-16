"use strict"

import Base from "./Base"
import mqConnection from "./connector"
import { performance } from "perf_hooks"
import { fromAVRO, toAVRO } from "@donsky/node-avro"

/**
 * Actor class
 */
export default class extends Base {
  #config = { mq: {}, topic: undefined }

  #link = null
  #responseTopic = ""

  /**
   * Connection intilizer
   */
  async #initilizeConnection(){
    const detach = () => {
      this.#link?.close()
      this.#link = null
    }
    const attach = async connection => {
      connection.on( "AMQP:reconnected", () => ( attach(), this.emit( "AMQP:reconnected" ) ) )
      connection.on( "error", error => ( detach(), this.emit( "AMQP:error", error ) ) )
      connection.on( "close", close => ( detach(), this.emit( "AMQP:close", close ) ) )

      this.#link = await connection.createConfirmChannel()
      this.#link.assertQueue( this.#responseTopic, { durable: true } )
      this.#link.consume(
        this.#responseTopic,
        ( { properties: { correlationId }, ...rest } ) => this.emit( correlationId, rest ),
        { noAck: true }
      )
    }
    attach( await mqConnection( this.#config.mq ) )
  }

  /**
   * Actor constructor
   * @param { Object } config - main config requires 'topic'
   */
  constructor( config ) {
    if ( !config.topic ) {
      throw new Error( "config missing 'topic'" )
    }
    super()
    this.#config = {
      mq: {
        ...this.#config.mq,
        ...( config.mq ? config.mq : {} )
      },
      topic: config.topic
    }
    this.#responseTopic = `${ this.#config.topic }-res-${ performance.now() }-${ process.pid }`

    this.#initilizeConnection()
  }

  /**
   * Request initilizer, response handler initilizer
   * @param { Object{action,requestAVRO,responseAVRO} } request - request object
   * @param { Object } data - data to send along
   */
  async createRequest( { action, requestAVRO, responseAVRO }, data ) {
    if ( !this.#link ) {
      const linkTimeoutEvent = `${ this.#responseTopic }_${ performance.now() }_${ Math.random() }`
      const tick = () =>
        setTimeout( () =>
          process.nextTick( () => this.#link ? this.emit( linkTimeoutEvent ) : tick() )
        , 500 )
      tick()
      await this.once( linkTimeoutEvent )
    }

    const xRequestId = `${ this.#responseTopic }_${ performance.now() }_${ Math.random() }`
    await this.#link.sendToQueue(
      this.#config.topic,
      await toAVRO( data, requestAVRO ),
      {
        correlationId: xRequestId,
        persistent   : true,
        replyTo      : this.#responseTopic,
        type         : action
      } )
    const [ { content, error: responderError } ] = await this.once( xRequestId )
    if ( responderError ) {
      this.emit( "error", { responderError, xRequestId } )
      throw { xRequestId, ...responderError }
    }
    try {
      return {
        data: await fromAVRO( content, responseAVRO, { response: true } ),
        xRequestId
      }
    } catch ( err ) {
      const contentErr = await fromAVRO( content, {}, { error: true } )
      this.emit( "error", { avroErr: err, contentErr, xRequestId } )
      throw { xRequestId, ...contentErr }
    }
  }
}
