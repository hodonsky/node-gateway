"use strict"

import AMQP from "amqplib"

const connectionCheckDelay = 1000
let conn
/**
 * MQ Conntector for AMQP 0-9-1 - Instantiates RabbitMQ connection
 * @param { Object{hostname,password,port username} } config - configuration for amqp connection
 */
const mqConnect = async function( { hostname, password, port, username } ) {
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
        throw err
      }
    } )
    connection.on( "close", () => {
      setTimeout( () => process.nextTick( async () => await mqConnect() ), connectionCheckDelay )
    } )
    if ( conn ){
      conn.emit( "AMQP:reconnected", connection )
    }
    conn = connection
    return conn
  } catch ( error ){
    conn.emit( "error", error )
    setTimeout( () => process.nextTick( async () => await mqConnect() ), connectionCheckDelay )
  }
}
export default async ( ...args ) => conn ? conn : await mqConnect( ...args )