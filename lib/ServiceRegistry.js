"use strict"

import Base from "./Base"
import Connector from "./Connector"
import * as rabbit from "rabbitmq-stream-js-client"

const SN_SERVICE_ACTIVE_NAMES = Symbol( "Service-ActiveNames" )
const SN_SERVICE_NAMED_VERSIONS = Symbol( "Service-NamedVersions" )
const QN_SERVICE_NAME_TOGGLE = Symbol( "ServiceName-Toggle" )

export default class extends Base {
  #activeServices = new Set()
  #activeServiceVersions = new Set()
  #config = { mq: {}, topic: undefined }
  #connector
  #queueConnection 
  #streamConnection
  #actionsRegistry = {}

  /**
   * Connection intilizer
   */
  async #initilizeConnection(){
    Connector.configure( this.#config.mq )
    this.#connector = new Connector()
    this.#queueConnection = this.#connector.queueConnection()
    this.#streamConnection =this.#connector.streamConnection()
    
    this.#streamConnection.on( "error", error => {
      this.emit( "error", error )
    })

    await new Promise( ( resolve ) => {
      this.#streamConnection.declareConsumer({
        stream: SN_SERVICE_ACTIVE_NAMES.description,
        offset: rabbit.Offset.first()
      }, async ( msg ) => {
        (msg |> JSON.parse).content |> this.#activeServices.add
        msg.offset === rabbit.Offset.last() ? resolve() : null
      })
    })

    await new Promise( ( resolve ) => {
      this.#streamConnection.declareConsumer({
        stream: SN_SERVICE_NAMED_VERSIONS.description,
        offset: rabbit.Offset.first(),
        filter: {
          values: this.#activeServiceVersions,
          postFilterFunc: (msg) => msg.topic |> this.#activeServiceVersions.has,
          matchUnfiltered: true
        }
      }, async ( msg ) => {
        (msg |> JSON.parse).content |> this.#activeServiceVersions.add
        msg.offset === rabbit.Offset.last() ? resolve () : null
      })
    })

    await Promise.all(
      this.#activeServiceVersions.map( serviceVersion => {
        return new Promise( resolve => {
          this.#streamConnection.declareConsumer({
            stream: `Service-${serviceVersion}-Actions`,
            offset: rabbit.Offset.first()
          }, async ( msg ) => {
            const content =  (msg |> JSON.parse)
            content |> this.#updateRouting
            this.#actionsRegistry[ content.action ] = content
            msg.offset === rabbit.Offset.last() ? resolve () : null
          })
        })
      })
    )
    this.#closeStreamConnection()
  }

  /**
   * Actor constructor
   * @param { Object } config - main config requires 'topic'
   */
  constructor( config ) {
    if ( !config.mq.serviceRegistry ) {
      throw new Error( "config missing 'topic'" )
    }
    super()
    this.#config = { mq: config.mq }
    this.#initilizeConnection()
  }

  #updateRouting = (action) => {
    (this.#actionsRegistry[action.topic] ??= {})[action.action] ??= action
    this.emit("service-registry-updated", action )
  }
  #closeStreamConnection = async () => {
    await this.#streamConnection.close()
    this.#streamConnection = null
  }
  #closeQueueConnection = async () => {
    await this.#queueConnection.close()
    this.#queueConnection = null
  }

}