"use strict"

import AMQP from "amqplib"
import * as rabbit from "rabbitmq-stream-js-client"
import Base from "./Base"


const connectionCheckDelay = 1000
const sharedConnectionOptions = {
  hostname: null,
  password: null,
  port: null,
  username: null,
  protocol : "amqp",
  heartbeat: 20
}
const queueConnectionOptions = { ...sharedConnectionOptions }
const streamConnectionOptions = {
  ...sharedConnectionOptions,
  listeners: {
    connection_closed: async () => {
      logger.info(`In connection closed event...`)
      try {
        await streamMQConn.restart()
        console.log( "restarted stream connection to rabbit" )
      } catch ( reason ) {
        console.error(`Could not reconnect to Rabbit! ${reason}`)
      }
    }
  }
}

const merge = ( config, updates ) => ( {
  ...updates,
  ...config,
  ...Object.entries( updates )
    .reduce( ( mix, [ key, val ] ) =>
      ( {
        ...mix,
        [ key ]: config[ key ]
          ? config[ key ] instanceof Object && !( config[ key ] instanceof Array )
            ? { ...config[ key ], ...val }
            : val
          : val
      } ), {} )
} )

export default class Connector extends Base {
  static configure( updates ){
    merge( connectionOptions, updates )
  }
  async #reconnect(){
    queueMQConn = await AMQP.connect( queueConnectionOptions )
    streamMQConn = await rabbit.connect( streamConnectionOptions )
    [ queueMQConn, streamMQConn ].forEach( conn => {
      conn.on( "error", err =>
        ( err.message !== "Connection closing" )
        ? conn.emit( "AMQP:error", err )
        : null
      )
      conn.on( "close", () =>
        setTimeout( () => 
          process.nextTick( async () => await this.#reconnect() ), connectionCheckDelay
        )
      )
      if ( conn ){
        conn.emit( "AMQP:reconnected", conn )
      }
    })
  }
  constructor(){
    super()
    this.#reconnect()
  }
  queueConnection(){
    return queueMQConn
  }
  streamConnection(){
    return streamMQConn
  }
}