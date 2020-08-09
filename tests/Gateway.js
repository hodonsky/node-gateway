"use strict"
const { expect } = require( "chai" )

const _Gateway = require( "../bin" ).default
const Gateway = require( "../lib/Gateway").default

describe( "ESNext Gateway", () => {
  it( "has static properties", () => {
    expect( Gateway ).to.have.property( "configure" )
  })
  const gateway = new Gateway()
  it( "instantiates properly", () => {
    expect( gateway ).to.be.an.instanceof( Gateway )
    expect( gateway ).to.be.an.instanceof( Object )
  })
  it( "private properties aren't available", () => {
    expect( gateway ).to.not.have.own.property( "emit" )
  })
  it( "public properties are available", () => {
    expect( gateway ).to.have.own.property( "on" )
  })
})

describe("Built Gateway", () => {
  it( "has static properties", () => {
    expect( _Gateway ).to.have.property( "configure" )
  })
  _Gateway.configure({port:9999})
  const gateway = new _Gateway()
  it( "instantiates properly", () => {
    expect( gateway ).to.be.an.instanceof( _Gateway )
    expect( gateway ).to.be.an.instanceof( Object )
  })
  it( "private properties aren't available", () => {
    expect( gateway ).to.not.have.own.property( "emit" )
  })
  it( "public properties are available", () => {
    expect( gateway ).to.have.own.property( "on" )
  })
})