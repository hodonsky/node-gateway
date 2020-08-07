"use strict"

import configuration from "./config"
import createApplication from "./createApplication"
import EventEmitter from "events"

let config = { ...configuration }
const emitter = new EventEmitter( { captureRejections: true } )


export default class {
  on = emitter.on.bind( emitter )

  #emit = emitter.emit.bind( emitter )

  static configure( updates ) {
    config = {
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
    }
  }

  constructor( actions ){
    try {
      createApplication( { ...config, actions } )
        .listen( config.port, () =>
          this.#emit( "ready", `App listening on: ${ config.port }` )
        )
    } catch ( error ){
      this.#emit( "error", error )
    }
  }
}