"use strict"

const chai = require( "chai" )
const cap = require("chai-as-promised")
chai.use(cap)
const { expect } = chai
const { default: Actor } = require( "../lib/Actor" )

describe( "Actor", () => {
  it( "is a function constructor", () => {
    expect( Actor ).to.be.a( "function" )
    expect( Actor.constructor ).to.be.a( "function" )
  })
  describe( "Instance:", () => {
    const goodArgs = { topic: "topic" }
    const actor = new Actor( goodArgs )
    it( "is an Actor<Object>", () => {
      expect( actor ).to.be.an.instanceof( Actor )
      expect( actor ).to.be.an.instanceof( Object )
    })
    it( "has inaccessible properties: [config, link, instanceId, responseTopic, requestTTLCheck, responders, respondersExpire]", () => {
      expect( actor ).to.not.have.property( "config" )
      expect( actor ).to.not.have.property( "link" )
      expect( actor ).to.not.have.property( "instanceId" )
      expect( actor ).to.not.have.property( "responseTopic" )
      expect( actor ).to.not.have.property( "requestTTLCheck" )
      expect( actor ).to.not.have.property( "responders" )
      expect( actor ).to.not.have.property( "respondersExpires" )
    })
    it( "has inaccessible methods: [log, initilizeConnection, setRequestsTTL, handleResponse, buildResponder]", () => {
      expect( actor ).to.not.have.property( "log" )
      expect( actor ).to.not.have.property( "initilizeConnection" )
      expect( actor ).to.not.have.property( "setRequestsTTL" )
      expect( actor ).to.not.have.property( "handleResponse" )
      expect( actor ).to.not.have.property( "buildResponder" )
    })
    it( "has accessible method: [constructor, createRequest] ", () => {
      expect( actor.constructor ).to.be.a( "function" )
      expect( actor.createRequest ).to.be.a( "function" )
    })
  })
})