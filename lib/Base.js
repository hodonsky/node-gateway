"use strict"

import { EventEmitter, once } from "events"

const emitter = new EventEmitter( { captureRejections: true } )
const processEmitter = new EventEmitter( { captureRejections: true } )

const signals = [ "SIGINT", "SIGTERM", "SIGUSR2", "exit" ]
signals.forEach( signal => processEmitter.once( signal, () => emitter.emit( "processKill", signal ) ) )

export default class Base{
  constructor(){}
  emit( ...args ){
    emitter.emit( ...args )
    return this
  }

  on( ...args ){
    emitter.on( ...args )
    return this
  }

  off( ...args ){
    emitter.off( ...args )
    return this
  }
  
  once = ( ...args ) => once( emitter, ...args )
}