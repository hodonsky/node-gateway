"use strict"

const chai = require( "chai" )
const cap = require("chai-as-promised")
chai.use(cap)
const { expect } = chai
const { default: createApplication } = require( "../lib/createApplication" )

describe( "Gateway Application Generator", () => {
  it( "is a function", () => {
    expect( createApplication ).to.be.a( "function" )
  })
  describe( "requires an object as the only argument", () => {
    it( "errors if missing property mq", () => {
      expect( () => createApplication({}) ).to.throw( TypeError, "destructured mq property is undefined" )
    })
    it( "returns a KoaJS app", () => {
      const Application = require( "koa" )
      const appInstance = createApplication({mq:{}})
      expect( appInstance ).to.be.an.instanceof( Application )
    })
  })
})