"use strict"

import createApplication from "./createApplication"
import configuration from "./config"

let config = { ...configuration }

export default class {
  static configure( updates ) {
    config = { ...config, ...updates }
  }
  constructor( actions ){
    const app = createApplication({
      ...config,
      verbose: config.env === "local",
      actions
    })
    return app.listen( config.port, () => console.info( "App listening on:", config.port ) )
  }
}