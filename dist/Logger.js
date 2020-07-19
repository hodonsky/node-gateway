"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _winston = _interopRequireDefault(require("winston"));

var _winstonLogglyBulk = require("winston-loggly-bulk");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classPrivateFieldGet(receiver, privateMap) { var descriptor = privateMap.get(receiver); if (!descriptor) { throw new TypeError("attempted to get private field on non-instance"); } if (descriptor.get) { return descriptor.get.call(receiver); } return descriptor.value; }

function _classPrivateFieldSet(receiver, privateMap, value) { var descriptor = privateMap.get(receiver); if (!descriptor) { throw new TypeError("attempted to set private field on non-instance"); } if (descriptor.set) { descriptor.set.call(receiver, value); } else { if (!descriptor.writable) { throw new TypeError("attempted to set read only private field"); } descriptor.value = value; } return value; }

var _config = new WeakMap();

var _logger = new WeakMap();

/**
 * Logger class with multiple transports:
 *  - Console
 *  - Loggly
 */
class _default {
  /**
   * Constructor method for logger instances
   * @param { Object } config - application configuration options
   */
  constructor() {
    var _this = this;

    var config = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    _config.set(this, {
      writable: true,
      value: {}
    });

    _logger.set(this, {
      writable: true,
      value: void 0
    });

    _classPrivateFieldSet(this, _config, _objectSpread({}, config));

    _classPrivateFieldSet(this, _logger, _winston.default.createLogger({
      exitOnError: false,
      format: _winston.default.format.combine(_winston.default.format.splat(), _winston.default.format(info => {
        if (info.meta && info.meta instanceof Error) {
          info.message = "".concat(info.message, " \n ").concat(info.meta.stack);
        }

        return info;
      })(), _winston.default.format.prettyPrint()),
      transports: [function () {
        switch (_classPrivateFieldGet(_this, _config).env) {
          case "local":
            return new _winston.default.transports.Console({
              handleExceptions: true,
              json: false,
              colorize: true,
              timestamp: true,
              prettyPrint: true
            });

          case "development":
            return new _winstonLogglyBulk.Loggly({
              inputToken: _classPrivateFieldGet(_this, _config).token,
              subdomain: _classPrivateFieldGet(_this, _config).domain,
              tags: _classPrivateFieldGet(_this, _config).tags,
              json: true,
              level: "debug"
            });

          default:
            return new _winstonLogglyBulk.Loggly({
              inputToken: _classPrivateFieldGet(_this, _config).token,
              subdomain: _classPrivateFieldGet(_this, _config).domain,
              tags: _classPrivateFieldGet(_this, _config).tags,
              json: true,
              level: "error"
            });
        }
      }()]
    }));

    process.on("beforeExit", this.submit);
    process.on("exit", this.submit);
    process.on("disconnect", this.submit);
    process.on("warning", this.submit);
    var unhandledRejections = new Map();
    process.on("unhandledRejection", (reason, promise) => {
      this.submit({
        error: reason.toString()
      });
      unhandledRejections.set(promise, reason);
    });
    process.on("rejectionHandled", promise => {
      unhandledRejections.delete(promise);
    });
    process.on("uncaughtException", exception => {
      this.submit({
        error: exception
      });
    });
  }
  /**
   * This submit function standardizes how the severity and output will look in any transport
   * @param { Object|String } body - Message Body
   * @param { String } severity - String value of severity [ 'error', 'info', 'debug'... ]
   */


  submit() {
    var body = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    var severity = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : "debug";

    try {
      severity = body.error ? "error" : severity;

      if (typeof body === "string") {
        _classPrivateFieldGet(this, _logger).log(severity, {
          message: body
        });
      } else {
        _classPrivateFieldGet(this, _logger).log(severity, _objectSpread({}, body));
      }
    } catch (error) {
      console.log(severity, JSON.stringify(body));
      console.trace(error);
    }
  }

}

exports.default = _default;