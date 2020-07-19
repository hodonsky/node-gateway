"use strict";/**
 * A standard action contract factory
 */Object.defineProperty(exports,"__esModule",{value:!0}),exports.errorContractFactory=exports.responseContractFactory=exports.actionEmptyContractFactory=exports.actionContractFactory=void 0;var actionContractFactory=(a,b)=>({name:a,type:"record",fields:[{name:"action",type:"string"},{name:"data",type:{type:"record",fields:b}}]});/**
 * An action contract factory for empty parameters
 */exports.actionContractFactory=actionContractFactory;var actionEmptyContractFactory=a=>({name:a,type:"record",fields:[{name:"action",type:"string"}]});/**
 * A standard response contract factory
 */exports.actionEmptyContractFactory=actionEmptyContractFactory;var responseContractFactory=(a,b)=>({name:a,type:"record",fields:[{name:"response",type:{type:"record",fields:b}}]});exports.responseContractFactory=responseContractFactory;var errorContractFactory=(a,b)=>({name:a,type:"record",fields:[{name:"error",type:{type:"record",fields:b}}]});exports.errorContractFactory=errorContractFactory;
//# sourceMappingURL=factories.js.map