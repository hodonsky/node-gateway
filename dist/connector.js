"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _amqplib = _interopRequireDefault(require("amqplib"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

/**
 * Instantiates RabbitMQ connection
 */
var connectionCheckDelay = 1000;

var _conn;

function start(_x) {
  return _start.apply(this, arguments);
}

function _start() {
  _start = _asyncToGenerator(function* (_ref) {
    var {
      username,
      password,
      hostname,
      port
    } = _ref;

    try {
      var connection = yield _amqplib.default.connect({
        protocol: "amqp",
        hostname,
        port,
        username,
        password,
        heartbeat: 20
      });
      connection.on("error", err => {
        if (err.message !== "Connection closing") {
          console.error("AMQP::Connection: " + JSON.stringify(err));
        }
      });
      connection.on("close", () => {
        console.info("AMQP::Reconnecting");
        setTimeout(() => process.nextTick( /*#__PURE__*/_asyncToGenerator(function* () {
          return yield start();
        })), connectionCheckDelay);
      });

      if (_conn) {
        _conn.emit("AMQP:reconnected", connection);
      }

      _conn = connection;
      return _conn;
    } catch (error) {
      console.error("CONNECTION ERROR");
      setTimeout(() => process.nextTick( /*#__PURE__*/_asyncToGenerator(function* () {
        return yield start();
      })), connectionCheckDelay);
    }
  });
  return _start.apply(this, arguments);
}

var _default = /*#__PURE__*/_asyncToGenerator(function* () {
  return _conn ? _conn : yield start(...arguments);
});

exports.default = _default;
//# sourceMappingURL=connector.js.map