"use strict"

import { EventEmitter, once } from "events"

const emitter = new EventEmitter( { captureRejections: true } )

export default class {
  emit( ...args ){
    emitter.emit( ...args )
    return this
  }

  on( ...args ){
    emitter.on( ...args )
    return this
  }

  once = ( ...args ) => once( emitter, ...args )
}