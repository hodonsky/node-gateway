"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.toAVRO = void 0;

var _avsc = _interopRequireDefault(require("avsc"));

var _typeCheck = require("./typeCheck");

var _factories = require("./factories");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

var toAVRO = /*#__PURE__*/function () {
  var _ref = _asyncToGenerator(function* (obj, AVRORule, isResponse) {
    try {
      var Type = !isResponse ? _avsc.default.Type.forSchema([(0, _factories.actionContractFactory)("RequestContract", AVRORule)]) : _avsc.default.Type.forSchema([(0, _factories.responseContractFactory)("ResponseContract", AVRORule)]);

      try {
        if (yield (0, _typeCheck.isContentValidType)(Type, obj)) {
          return Type.toBuffer(obj);
        }
      } catch (error) {
        throw {
          message: error.message,
          name: "Transformer::toAVRO:Types[isContentValidType]",
          stack: (error === null || error === void 0 ? void 0 : error.stack) || "",
          status: 500
        };
      }
    } catch (error) {
      throw {
        name: (error === null || error === void 0 ? void 0 : error.name) || "Transformer::toAVRO:failed[type:".concat(type, "]"),
        message: (error === null || error === void 0 ? void 0 : error.message) || "Something went wrong in buffering...",
        stack: (error === null || error === void 0 ? void 0 : error.stack) || "",
        status: (error === null || error === void 0 ? void 0 : error.status) || 500,
        userError: (error === null || error === void 0 ? void 0 : error.userError) || false
      };
    }
  });

  return function toAVRO(_x, _x2, _x3) {
    return _ref.apply(this, arguments);
  };
}();

exports.toAVRO = toAVRO;