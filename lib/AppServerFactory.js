"use strict"

import cluster from "cluster"
import CreateApplication from "./CreateApplication"

/**
 * App Server Factory
 */
export default class AppServerFactory {
  #config = {}
  #app = null
  #startApp() {
    if ( this.#config.cluster ) {
      if ( cluster.isMaster ) {
        this.#config.cpus.forEach( () => cluster.fork() )
        console.info(
          "Workers: " +
            cluster.workers
              |> Object.keys
              |> ( _ => _.map( id => `- ${cluster.workers[ id ].process.pid}` ) )
              |> ( _ => _.join(", ") )
        )
      } else {
        this.#app = this.#createWorker()
      }
    } else {
      console.info( "Single CPU app started" )
      this.#app = this.#createWorker()
    }
    return this.#app
  }
  #createWorker() {
    const
      app = CreateApplication( { ...this.#config,  } ),
      server = app.listen( this.#config.port, () => {
        // GATEWAY TIMEOUT - 504
        server.setTimeout( 120000 )
        console.info( `App listening on:${server.address().address}:${this.#config.port}` )
      })

    return app
  }
  constructor( config = {} ) {
    this.#config = config
  }
  instance() {
    return this.#app || this.#startApp()
  }
}
