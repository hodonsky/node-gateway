"use strict"

const chai = require( "chai" )
const cap = require("chai-as-promised")
chai.use(cap)
const { expect } = chai
const { default: connector } = require( "../lib/connector" )

describe( "AMQ connector", () => {
  it( "is a function", () => {
    expect( connector ).to.be.a( "function" )
  })
  it( "eventually returns a connection object", () => {
    const { mqConnect } = require( "amqplib" )
    expect( connector() ).to.eventually.be.an.instanceof( mqConnect )
  })
})