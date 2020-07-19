"use strict"

import winston from "winston"
import { Loggly } from "winston-loggly-bulk"

/**
 * Logger class with multiple transports:
 *  - Console
 *  - Loggly
 */
export default class {
  #config = {}
  #logger

  /**
   * Constructor method for logger instances
   * @param { Object } config - application configuration options
   */
  constructor( config = {} ){
    this.#config = { ...config }
    this.#logger = winston.createLogger({
      exitOnError: false,
      format          : winston.format.combine(
        winston.format.splat(),
        winston.format( info => {
          if (info.meta && info.meta instanceof Error) {
              info.message = `${info.message} \n ${info.meta.stack}`;
          }
          return info;
        })(),
        winston.format.prettyPrint(),
      ),
      transports : [ do {
        switch( this.#config.env ) {
          case "local":
            new winston.transports.Console({
              handleExceptions: true,
              json            : false,
              colorize        : true,
              timestamp       : true,
              prettyPrint     : true
            })
            break
          case "development":
            new Loggly({
              inputToken: this.#config.token,
              subdomain : this.#config.domain,
              tags      : this.#config.tags,
              json      : true,
              level     : "debug"
            })
            break
          default:
            new Loggly({
              inputToken: this.#config.token,
              subdomain : this.#config.domain,
              tags      : this.#config.tags,
              json      : true,
              level     : "error"
            })
            break
        }
      }]
    })

    process.on( "beforeExit", this.submit )
    process.on( "exit", this.submit )
    process.on( "disconnect", this.submit )
    process.on( "warning", this.submit )

    const unhandledRejections = new Map()
    process.on( "unhandledRejection", ( reason, promise ) => {
      this.submit({ error: reason.toString() })
      unhandledRejections.set( promise, reason )
    })
    process.on( "rejectionHandled", promise => {
      unhandledRejections.delete( promise )
    })
    process.on( "uncaughtException", exception => {
      this.submit({ error: exception })
    })
  }
  /**
   * This submit function standardizes how the severity and output will look in any transport
   * @param { Object|String } body - Message Body
   * @param { String } severity - String value of severity [ 'error', 'info', 'debug'... ]
   */
  submit( body = {}, severity = "debug" ){
    try {
      severity = body.error ? "error" : severity
      if ( typeof body === "string" ) {
        this.#logger.log( severity, { message: body })
      } else {
        this.#logger.log( severity, { ...body })
      }
    } catch ( error ) {
      console.log( severity, JSON.stringify( body ))
      console.trace( error )
    }
  }
}