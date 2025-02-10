"use strict"

import rabbit from "rabbitmq-stream-js-client"

const connectionCheckDelay = 1000
let conn
/**
 * MQ Conntector for AMQP 0-9-1 - Instantiates RabbitMQ connection
 * @param { Object{hostname,password,port username} } config - configuration for amqp connection
 */
const mqConnect = async function( { hostname, password, port, username } ) {
  try {
    const connection = await rabbit.connect( {
      heartbeat: 20,
      hostname,
      password,
      port,
      protocol : "amqp",
      username,
      listeners: { connection_closed: async () => {
        logger.info(`In connection closed event...`)
        try {
          await conn.restart()
          console.log( "restarted stream connection to rabbit" )
        } catch ( reason ) {
          console.error(`Could not reconnect to Rabbit! ${reason}`)
        }
      } }
    } )
    connection.on( "error", err => {
      if ( err.message !== "Connection closing" ) {
        conn.emit( "AMQP:error", err )
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
    if ( conn ) {
      conn.emit( "AMQP:error", error )
    }
    setTimeout( () => process.nextTick( async () => await mqConnect() ), connectionCheckDelay )
  }
}
export default async ( ...args ) => conn ? conn : await mqConnect( ...args )