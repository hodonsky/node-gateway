"use strict"

const chai = require( "chai" )
const cap = require("chai-as-promised")
chai.use(cap)
const { expect } = chai
const { default: config } = require( "../lib/config" )

describe( "config", () => {
  it( "is a plain object", () => {
    expect( config ).to.be.an( "object" )
  })
  it( "has default properties: ['koaMiddleware', 'mq', 'port']", () => {
    expect( config ).to.have.own.property( "koaMiddleware" )
    expect( config ).to.have.own.property( "mq" )
    expect( config ).to.have.own.property( "port" )
  })
  it( "has default values for mq property<Object>: ['hostname','password','port','protocol','username']", () => {
    expect( config.mq ).to.have.own.property( "hostname" )
    expect( config.mq ).to.have.own.property( "password" )
    expect( config.mq ).to.have.own.property( "port" )
    expect( config.mq ).to.have.own.property( "protocol" )
    expect( config.mq ).to.have.own.property( "username" )
  })
})