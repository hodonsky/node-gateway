"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.fromAVRO = void 0;

var _avsc = _interopRequireDefault(require("avsc"));

var _factories = require("./factories");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var fromAVRO = function fromAVRO(content, AVRORule) {
  var isResponse = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;

  try {
    var Type = !isResponse ? _avsc.default.Type.forSchema([(0, _factories.actionContractFactory)("RequestContract", AVRORule)]) : _avsc.default.Type.forSchema([(0, _factories.responseContractFactory)("ResponseContract", AVRORule)]);
    return Type.fromBuffer(content);
  } catch (error) {
    throw {
      name: (error === null || error === void 0 ? void 0 : error.name) || "Transformer::fromAVRO:failed[type:".concat(type, "]"),
      message: (error === null || error === void 0 ? void 0 : error.message) || "Something went wrong in unbuffering...",
      stack: (error === null || error === void 0 ? void 0 : error.stack) || "",
      status: (error === null || error === void 0 ? void 0 : error.status) || 500,
      userError: (error === null || error === void 0 ? void 0 : error.userError) || false
    };
  }
};

exports.fromAVRO = fromAVRO;