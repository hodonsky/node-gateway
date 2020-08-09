"use strict"

import configuration from "./config"
import createApplication from "./createApplication"
import EventEmitter from "events"

let config = { ...configuration }
const emitter = new EventEmitter( { captureRejections: true } )

/**
 * Gateway base class
 */
export default class {
  on = emitter.on.bind( emitter )
  #emit = emitter.emit.bind( emitter )

  /**
   * Static local config update method
   * @param {Object} updates - overwrites to default config
   */
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

  /**
   * Gateway initializer
   * @param { Array } actions - List of actions
   */
  constructor( actions ){
    try {
      createApplication( { ...config, actions } )
        .listen( config.port, () =>
          this.#emit( "ready", `Listening on: ${ config.port }` )
        )
        .on( "error", error => this.#emit( "error", error ) )
    } catch ( error ){
      this.#emit( "error", error )
    }
  }
}