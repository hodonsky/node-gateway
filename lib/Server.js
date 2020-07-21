"use strict"

import createApplication from "./createApplication"
import configuration from "./config"

let config = { ...configuration }

export default class {
  static configure( updates ) {
    config = {
      ...updates,
      ...config,
      ...Object.entries(updates)
        .reduce( ( mix, [ key, val ] ) =>
          ({
            ...mix,
            [ key ]: config[ key ]
                      ? { ...config[ key ], ...val }
                      : val
          }), {})
    }
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