"use strict"
const { expect } = require( "chai" )

const _Gateway = require( "../bin" ).default
const Gateway = require( "../lib/Gateway").default

describe( "ESNext Gateway", () => {
  const gateway = new Gateway()
  it( "instantiates properly", () => {
    expect( gateway ).to.be.an.instanceof( Gateway )
    expect( gateway ).to.be.an.instanceof( Object )
  })
  it( "public properties are available", () => {
    expect( gateway ).to.have.own.property( "once" )
  })
})

describe("Built Gateway", () => {
  const gateway = new _Gateway({port:9999})
  it( "instantiates properly", () => {
    expect( gateway ).to.be.an.instanceof( _Gateway )
    expect( gateway ).to.be.an.instanceof( Object )
  })
  it( "public properties are available", () => {
    expect( gateway ).to.have.own.property( "once" )
  })
})