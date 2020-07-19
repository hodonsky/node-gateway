"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.isContentValidType = void 0;

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var isContentValidType = (type, obj) => new Promise((resolve, reject) => {
  if (type.isValid(obj, {
    noUndeclaredFields: true,

    /**
     * Handles errors in avro schema checking
     * @param { Array<string> } location - location of the error
     * @param { Object } errorBlock - The actual error block
     * @param { String } recordType - Expected AVRO type
     * @param { Object } record - The record
     */
    errorHook: function errorHook(location, errorBlock, recordType) {
      //console.log( arguments )
      // console.log( "=====Location====" )
      // console.log( location )
      // console.log( "=====ErrorBlock====" )
      // console.log( errorBlock )
      // console.log( "=====RecordType====" )
      // console.log( recordType, JSON.stringify( recordType.toJSON()))
      // console.log( "=====Record=====" )
      // console.log( record )
      var typeJSON = recordType.toJSON();
      var errBlock = {
        name: "Transformer::isValid:avroErrorHook",
        status: 500,
        userError: false
      };

      if (typeJSON.fields) {
        if (typeof errorBlock === "object") {
          Object.keys(errorBlock).every(fieldName => {
            if (!typeJSON.fields.some(field => field.name === fieldName)) {
              reject(_objectSpread(_objectSpread({}, errBlock), {}, {
                message: location.length > 0 ? "[".concat(location.join("."), "] - Field [").concat(fieldName, "] is not allowed") : "Field [".concat(fieldName, "] is not allowed")
              }));
              return false;
            }

            return true;
          });
          typeJSON.fields.every(field => {
            if (typeof errorBlock[field.name] !== field.type) {
              reject(_objectSpread(_objectSpread({}, errBlock), {}, {
                message: "For ".concat(location[location.length - 1], ".").concat(field.name, ", expected :").concat(field.type, ", got: ").concat(typeof errorBlock[field.name])
              }));
              return false;
            }

            return true;
          });
        } else {
          reject(_objectSpread(_objectSpread({}, errBlock), {}, {
            message: "Failed lookup. Likely does not exist or is undefined in response: [".concat(location.join("."), "]")
          }));
        }
      } else {
        reject(_objectSpread(_objectSpread({}, errBlock), {}, {
          message: "For ".concat(location.join("."), ", expected: ").concat(typeJSON, ", got: ").concat(typeof errorBlock)
        }));
      }
    }
  })) {
    resolve(true);
  }
});

exports.isContentValidType = isContentValidType;