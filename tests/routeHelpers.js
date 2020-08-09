"use strict"

const chai = require( "chai" )
const cap = require("chai-as-promised")
chai.use(cap)
const { expect } = chai
const { actionHandler } = require( "../lib/routeHelpers" )

process.on( "unhandledRejection", () => void 0 )

describe( "Action Handler", () => {
  it( "is defined as a function", () =>{
    expect( actionHandler ).to.not.equal( undefined )
    expect( actionHandler ).to.be.a( "function" )
  })
  const goodAction = {
    actor: {
      createRequest: async () => ({ data: {} , xRequestId: "0"})
    },
    topic: 'topic'
  }
  it( "requires an object as the only argument", () => {
    expect( () => actionHandler( goodAction ) ).to.not.throw()
    expect( () => actionHandler() ).to.throw()
  })
  describe( "that:", () => {
    const ctxHandler = actionHandler( goodAction )
    const goodCtx = { response: { set: () => void 0 } }
    it( "returns a function", () => {
      expect( ctxHandler ).to.be.a( "function" )
    })
    it( "requires an object as the only argument", () => {
      expect( ctxHandler( goodCtx ) ).to.eventually.not.throw()
      expect( ctxHandler( "" ) ).to.eventually.throw()
      expect( ctxHandler( 0 ) ).to.eventually.throw()
      expect( ctxHandler() ).to.eventually.throw()
    })
    it( "returns a promise", () => {
      expect( ctxHandler( goodCtx ) ).to.be.a( "promise" )
    })
    it( "returned promise resolves undefined", () => {
      expect( ctxHandler( goodCtx ) ).to.eventually.equal( void 0 )
    })
  })
})