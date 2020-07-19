"use strict"

import AppServerFactory from "./AppServerFactory"
import configuration from "./config"

let config = { ...configuration }

export default class {
  static configure( updates ) {
    config = { ...config, ...updates }
  }
  constructor( actions ){
    const appServer = new AppServerFactory({
       ...config,
       verbose: config.env === "local",
       actions
      })
    return appServer.instance()
  }
}