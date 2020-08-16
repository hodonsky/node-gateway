"use strict"

import Base from "./Base"
import configuration from "./config"
import createApplication from "./createApplication"

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
export default class extends Base {
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

  #verb( method, route, ...actions ){
    this.#actions.push( {method, route, actions } )
    return this
  }

  get( route, ...actions ){ return this.#verb( "get", route, ...actions ) }
  post( route, ...actions ){ return this.#verb( "post", route, ...actions ) }
  put( route, ...actions ){ return this.#verb( "put", route, ...actions ) }
  patch( route, ...actions ){ return this.#verb( "patch", route, ...actions ) }
  update( route, ...actions ){ return this.#verb( "update", route, ...actions ) }
  delete( route, ...actions ){ return this.#verb( "delete", route, ...actions ) }
  listen(){
    try {
      createApplication( { ...this.#config, actions: this.#actions } )
        .listen( this.#config.port, () =>
          this.emit( "ready", `Listening on: ${ this.#config.port }` )
        )
        .on( "error", error => this.emit( "error", error ) )
    } catch ( error ){
      this.emit( "error", error )
    }
  }
}