"use strict"

/**
 * A standard action contract factory
 */
export const actionContractFactory = ( name, fields ) => ({
  name ,
  type  : "record",
  fields: [
    { name: "action", type: "string" },
    { name: "data", type: { type: "record", fields } }
  ]
})

/**
 * An action contract factory for empty parameters
 */
export const actionEmptyContractFactory = name => ({
  name,
  type  : "record",
  fields: [
    { name: "action", type: "string" }
  ]
})

/**
 * A standard response contract factory
 */
export const responseContractFactory = ( name, fields ) => ({
  name,
  type  : "record",
  fields: [
    { name: "response", type: { type: "record", fields } }
  ]
})

export const errorContractFactory = ( name, fields ) => ({
  name,
  type  : "record",
  fields: [
    { name: "error", type: { type: "record", fields } }
  ]
})
