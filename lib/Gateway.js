"use strict"

import Base from "./Base"
import configuration from "./config"
import Application from "./KoaApplication"

/**
 * Local object update method
 * @param {Object} config - original object
 * @param {Object} updates - overwrites to original
 */
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
/**
 * Gateway base class
 */
export default class Gateway extends Base {
  #actions = []
  #config = {}

  /**
   * Gateway initializer
   * @param { Array } actions - List of actions
   */
  constructor( updates = {} ){
    super()
    this.#config = merge( configuration, updates )
  }

  listen() {
    try {
      new Application({ ...this.#config, actions: this.#actions})
        .listen( this.#config.port, () =>
          this.emit( "ready", `Listening on: ${ this.#config.port }` )
        )
        .on( "error", error => this.emit( "error", error ) )
    } catch ( error ) {
      this.emit( "error", error )
    }
  }
}