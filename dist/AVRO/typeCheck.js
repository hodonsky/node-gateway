"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.isContentValidType = void 0;

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

var errTemplate = {
  name: "Transformer::isValid:avroErrorHook",
  status: 500,
  userError: false
};

var isContentValidType = /*#__PURE__*/function () {
  var _ref = _asyncToGenerator(function* (type, obj) {
    var options = {
      // DO NOT CHANGE: This assures there is no unwanted data making it through the message queue
      noUndeclaredFields: true,

      /**
       * Handles errors in avro schema checking
       * @param { Array<string> } location - location of the error
       * @param { Object } errorBlock - The actual error block
       * @param { String } recordType - Expected AVRO type
       * @param { Object } record - The record
       */
      errorHook: (location, errorBlock, recordType) => {
        var typeJSON = recordType.toJSON();

        if (typeJSON.fields) {
          if (typeof errorBlock === "object") {
            Object.keys(errorBlock).every(fieldName => {
              if (!typeJSON.fields.some(field => field.name === fieldName)) {
                throw _objectSpread(_objectSpread({}, errTemplate), {}, {
                  message: location.length > 0 ? "[".concat(location.join("."), "] - Field [").concat(fieldName, "] is not allowed") : "Field [".concat(fieldName, "] is not allowed")
                });
              }

              return true;
            });
            typeJSON.fields.every(field => {
              if (typeof errorBlock[field.name] !== field.type) {
                throw _objectSpread(_objectSpread({}, errTemplate), {}, {
                  message: "For ".concat(location[location.length - 1], ".").concat(field.name, ", expected :").concat(field.type, ", got: ").concat(typeof errorBlock[field.name])
                });
              }

              return true;
            });
          } else {
            throw _objectSpread(_objectSpread({}, errTemplate), {}, {
              message: "Failed lookup. Likely does not exist or is undefined in response: [".concat(location.join("."), "]")
            });
          }
        } else {
          throw _objectSpread(_objectSpread({}, errTemplate), {}, {
            message: "For ".concat(location.join("."), ", expected: ").concat(typeJSON, ", got: ").concat(typeof errorBlock)
          });
        }

        return true;
      }
    };
    return yield type.isValid(obj, options);
  });

  return function isContentValidType(_x, _x2) {
    return _ref.apply(this, arguments);
  };
}();

exports.isContentValidType = isContentValidType;