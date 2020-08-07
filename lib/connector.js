"use strict"

import AMQP from "amqplib"

/**
 * Instantiates RabbitMQ connection
 */
const connectionCheckDelay = 1000
let conn
const start = async function( { hostname, password, port, username } ) {
  try {
    const connection = await AMQP.connect( {
      heartbeat: 20,
      hostname,
      password,
      port,
      protocol : "amqp",
      username
    } )
    connection.on( "error", err => {
      if ( err.message !== "Connection closing" ) {
        console.error( `AMQP::Connection: ${ JSON.stringify( err ) }` )
      }
    } )
    connection.on( "close", () => {
      console.info( "AMQP::Reconnecting" )
      setTimeout( () => process.nextTick( async () => await start() ), connectionCheckDelay )
    } )
    if ( conn ){
      conn.emit( "AMQP:reconnected", connection )
    }
    conn = connection
    return conn
  } catch ( error ){
    console.error( "CONNECTION ERROR" )
    setTimeout( () => process.nextTick( async () => await start() ), connectionCheckDelay )
  }
}
export default async ( ...args ) => conn ? conn : await start( ...args )