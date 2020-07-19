"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _perf_hooks = require("perf_hooks");

var _uuid = require("uuid");

var _connector = _interopRequireDefault(require("./connector"));

var _avro = require("./avro");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classPrivateMethodGet(receiver, privateSet, fn) { if (!privateSet.has(receiver)) { throw new TypeError("attempted to get private field on non-instance"); } return fn; }

function _classPrivateFieldSet(receiver, privateMap, value) { var descriptor = privateMap.get(receiver); if (!descriptor) { throw new TypeError("attempted to set private field on non-instance"); } if (descriptor.set) { descriptor.set.call(receiver, value); } else { if (!descriptor.writable) { throw new TypeError("attempted to set read only private field"); } descriptor.value = value; } return value; }

function _classPrivateFieldGet(receiver, privateMap) { var descriptor = privateMap.get(receiver); if (!descriptor) { throw new TypeError("attempted to get private field on non-instance"); } if (descriptor.get) { return descriptor.get.call(receiver); } return descriptor.value; }

var _config = new WeakMap();

var _link = new WeakMap();

var _instanceId = new WeakMap();

var _responseTopic = new WeakMap();

var _requestTTLCheck = new WeakMap();

var _responders = new WeakMap();

var _respondersExpires = new WeakMap();

var _log = new WeakSet();

var _initilizeConnection = new WeakSet();

var _setRequestsTTL = new WeakSet();

var _handleResponse = new WeakSet();

var _buildResponder = new WeakSet();

/**
 * Actor class
 */
class Actor {
  /**
   * Sends to console
   * @param { Object | String } entry - Object or string entry for logging
   * @param { String} severity - Log level [debug|info|error...]
   */

  /**
   * Connection intilizer
   * @param { Object<RabbitMQConnection> } conn - Connection to Rabbit MQ
   */

  /**
   * Set's the request TTL timeout checker to run for N seconds
   * @param { Number } seconds - The number of seconds between requests TTL
   */

  /**
   * Abstract response handler. Binds to responder in the response list
   * @param { Object{content,properties{type,correlationId}}} messageBuffer - From the service
   */

  /**
   * Abstract response functionality
   * @param { String } correlationId - xRequestId
   * @param { Function } resolve - Accept respose function
   * @param { Function } reject - Reject response function
   */

  /**
   * Actor constructor
   * @param { Object<RabbitMQConnection> } conn - Connection to Rabbit MQ
   * @param { Object } config -
   */
  constructor(config) {
    _buildResponder.add(this);

    _handleResponse.add(this);

    _setRequestsTTL.add(this);

    _initilizeConnection.add(this);

    _log.add(this);

    _config.set(this, {
      writable: true,
      value: {
        actorName: "Service Actor",
        env: "local",
        mq: {},
        uuidFn: _uuid.v4,
        // In Seconds ( 4 minutes )
        requestTTL: 240,
        // In Seconds ( 30 minutes )
        ttlCheck: 30 * 60
      }
    });

    _link.set(this, {
      writable: true,
      value: null
    });

    _instanceId.set(this, {
      writable: true,
      value: ""
    });

    _responseTopic.set(this, {
      writable: true,
      value: ""
    });

    _requestTTLCheck.set(this, {
      writable: true,
      value: null
    });

    _responders.set(this, {
      writable: true,
      value: {}
    });

    _respondersExpires.set(this, {
      writable: true,
      value: {}
    });

    if (!config.topic) {
      throw {
        message: "Topic name required. example: { topic: \"\" }"
      };
    }

    _classPrivateFieldSet(this, _config, _objectSpread(_objectSpread({}, _classPrivateFieldGet(this, _config)), config));

    _classPrivateFieldSet(this, _instanceId, "".concat(_classPrivateFieldGet(this, _config).actorName, "_").concat(_perf_hooks.performance.now()));

    _classPrivateFieldSet(this, _responseTopic, "".concat(_classPrivateFieldGet(this, _config).topic, "-res-").concat(_classPrivateFieldGet(this, _instanceId), "-").concat(process.pid));

    _classPrivateMethodGet(this, _initilizeConnection, _initilizeConnection2).call(this);

    _classPrivateMethodGet(this, _setRequestsTTL, _setRequestsTTL2).call(this, _classPrivateFieldGet(this, _config).ttlCheck);
  }
  /**
   * Request initilizer, response handler initilizer
   * @param { Object{action,data} } request - request object
   */


  createRequest(request, _ref) {
    var _this = this;

    var {
      requestAVRO,
      responseAVRO
    } = _ref;

    /**
     * Repopulate the request on top of the stack when
     * there is no link. Let the gateway timeout handle
     * closing connection requests that never make it to
     * the message queue
     */
    if (!_classPrivateFieldGet(this, _link)) {
      return new Promise(resolve => setTimeout(() => process.nextTick(() => resolve(this.createRequest(request, {
        requestAVRO,
        responseAVRO
      }))), 500));
    }

    var correlationId = _classPrivateFieldGet(this, _config).uuidFn();

    return new Promise( /*#__PURE__*/function () {
      var _ref2 = _asyncToGenerator(function* (resolve, reject) {
        try {
          _classPrivateMethodGet(_this, _buildResponder, _buildResponder2).call(_this, correlationId, resolve, reject, responseAVRO);

          try {
            _classPrivateFieldGet(_this, _link).sendToQueue(_classPrivateFieldGet(_this, _config).topic, yield (0, _avro.toAVRO)(request, requestAVRO), {
              persistent: true,
              type: request.action,
              replyTo: _classPrivateFieldGet(_this, _responseTopic),
              correlationId
            }, error => {
              if (error) {
                reject({
                  error: "Could not satisfy request for unknown reason",
                  xRequestId: correlationId
                });
              }
            });
          } catch (error) {
            reject(_objectSpread(_objectSpread({}, error), {}, {
              name: "Actor::createRequest:sendToQueue[]",
              status: 401,
              userError: true
            }));
          }
        } catch (error) {
          reject({
            error: "Not connected to ".concat(_this.config.actorName)
          });
        }
      });

      return function (_x, _x2) {
        return _ref2.apply(this, arguments);
      };
    }());
  }

}

exports.default = Actor;

var _log2 = function _log2(entry, severity) {
  var body = {
    entry: typeof entry === "string" ? {
      message: entry
    } : entry,
    service: _classPrivateFieldGet(this, _config).actorName,
    timestamp: new Date().getTime()
  };

  if (entry.stack) {
    body.stack = entry.stack;
  }

  console[!severity || entry.error ? "error" : severity](body);
};

var _initilizeConnection2 = /*#__PURE__*/function () {
  var _initilizeConnection3 = _asyncToGenerator(function* () {
    var _this2 = this;

    var detach = () => {
      var _classPrivateFieldGet2;

      (_classPrivateFieldGet2 = _classPrivateFieldGet(this, _link)) === null || _classPrivateFieldGet2 === void 0 ? void 0 : _classPrivateFieldGet2.close();

      _classPrivateFieldSet(this, _link, null);
    };

    var attach = /*#__PURE__*/function () {
      var _ref3 = _asyncToGenerator(function* (connection) {
        connection.on("MQ:reconnected", attach);
        connection.on("error", detach);
        connection.on("close", detach);

        try {
          _classPrivateFieldSet(_this2, _link, yield connection.createConfirmChannel());

          _classPrivateFieldGet(_this2, _link).assertQueue(_classPrivateFieldGet(_this2, _responseTopic), {
            durable: true
          });

          _classPrivateFieldGet(_this2, _link).consume(_classPrivateFieldGet(_this2, _responseTopic), _classPrivateMethodGet(_this2, _handleResponse, _handleResponse2).bind(_this2), {
            noAck: true
          });
        } catch (error) {
          _classPrivateMethodGet(_this2, _log, _log2).call(_this2, {
            error
          });
        }
      });

      return function attach(_x3) {
        return _ref3.apply(this, arguments);
      };
    }();

    attach(yield (0, _connector.default)(_classPrivateFieldGet(this, _config).mq));
  });

  function _initilizeConnection2() {
    return _initilizeConnection3.apply(this, arguments);
  }

  return _initilizeConnection2;
}();

var _setRequestsTTL2 = function _setRequestsTTL2(seconds) {
  if (_classPrivateFieldGet(this, _requestTTLCheck) > 0) {
    _classPrivateFieldSet(this, _requestTTLCheck, setInterval(() => {
      var epochTime = new Date().getTime();
      Object.keys(_classPrivateFieldGet(this, _responders)).forEach(key => {
        if (_classPrivateFieldGet(this, _respondersExpires)[key] >= epochTime) {
          delete _classPrivateFieldGet(this, _responders)[key];
          delete _classPrivateFieldGet(this, _respondersExpires)[key];
        }
      });
    }, seconds * 1000));
  }
};

var _handleResponse2 = function _handleResponse2(_ref4) {
  var {
    content,
    properties: {
      correlationId
    }
  } = _ref4;

  if (_classPrivateFieldGet(this, _responders)[correlationId]) {
    _classPrivateFieldGet(this, _responders)[correlationId]({
      content
    });
  } else {
    _classPrivateMethodGet(this, _log, _log2).call(this, {
      xRequestId: correlationId,
      message: "--- No Responder for xRequestId: ".concat(correlationId, " ---")
    });
  }

  if (_classPrivateFieldGet(this, _responders)[correlationId]) {
    delete _classPrivateFieldGet(this, _responders)[correlationId];
  }

  if (_classPrivateFieldGet(this, _respondersExpires)[correlationId]) {
    delete _classPrivateFieldGet(this, _respondersExpires)[correlationId];
  }
};

var _buildResponder2 = function _buildResponder2(correlationId, resolve, reject, avroResponse) {
  _classPrivateFieldGet(this, _responders)[correlationId] = (_ref5) => {
    var {
      content,
      error: responderError
    } = _ref5;
    var {
      response,
      error
    } = (0, _avro.fromAVRO)(content, avroResponse);

    if (error) {
      _classPrivateMethodGet(this, _log, _log2).call(this, _objectSpread({
        xRequestId: correlationId
      }, responderError), "error");

      reject(_objectSpread({
        xRequestId: correlationId
      }, error));
    } else {
      if (responderError) {
        _classPrivateMethodGet(this, _log, _log2).call(this, _objectSpread({
          xRequestId: correlationId
        }, responderError), "error");

        reject(_objectSpread({
          xRequestId: correlationId
        }, responderError));
      } else {
        resolve({
          data: response,
          xRequestId: correlationId
        });
      }
    }
  };

  _classPrivateFieldGet(this, _respondersExpires)[correlationId] = new Date().getTime() + 1000 * _classPrivateFieldGet(this, _config).requestTTL;
};