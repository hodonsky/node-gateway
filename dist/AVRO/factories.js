"use strict";
/**
 * A standard action contract factory
 */

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.errorContractFactory = exports.responseContractFactory = exports.actionEmptyContractFactory = exports.actionContractFactory = void 0;

var actionContractFactory = (name, fields) => ({
  name,
  type: "record",
  fields: [{
    name: "action",
    type: "string"
  }, {
    name: "data",
    type: {
      type: "record",
      fields
    }
  }]
});
/**
 * An action contract factory for empty parameters
 */


exports.actionContractFactory = actionContractFactory;

var actionEmptyContractFactory = name => ({
  name,
  type: "record",
  fields: [{
    name: "action",
    type: "string"
  }]
});
/**
 * A standard response contract factory
 */


exports.actionEmptyContractFactory = actionEmptyContractFactory;

var responseContractFactory = (name, fields) => ({
  name,
  type: "record",
  fields: [{
    name: "response",
    type: {
      type: "record",
      fields
    }
  }]
});

exports.responseContractFactory = responseContractFactory;

var errorContractFactory = (name, fields) => ({
  name,
  type: "record",
  fields: [{
    name: "error",
    type: {
      type: "record",
      fields
    }
  }]
});

exports.errorContractFactory = errorContractFactory;