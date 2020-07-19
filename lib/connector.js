"use strict"

import AMQP from "amqplib"

/**
 * Instantiates RabbitMQ connection
 */
let _conn
async function start( { username, password, hostname, port } ) {
  try {
    const connection = await AMQP.connect({ protocol: "amqp", hostname, port, username, password, heartbeat: 20 })
    connection.on( "error", err => {
      if ( err.message !== "Connection closing" ) {
        console.error( "AMQP::Connection: " + JSON.stringify( err ) )
      }
    })
    connection.on( "close", () => {
      console.info( "AMQP::Reconnecting" )
      setTimeout( () => process.nextTick( async () => await start() ), 1000 )
    })
    if ( _conn ){
      _conn.emit( "AMQP:reconnected", connection )
    }
    _conn = connection
    return _conn
  } catch ( error ){
  console.error( "CONNECTION ERROR" )
    setTimeout( () => process.nextTick( async () => await start() ), 1000 )
  }
}
export default async (...args) => _conn ? _conn : await start(...args)