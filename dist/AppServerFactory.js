"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _cluster = _interopRequireDefault(require("cluster"));

var _createApplication = _interopRequireDefault(require("./createApplication"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classPrivateMethodGet(receiver, privateSet, fn) { if (!privateSet.has(receiver)) { throw new TypeError("attempted to get private field on non-instance"); } return fn; }

function _classPrivateFieldSet(receiver, privateMap, value) { var descriptor = privateMap.get(receiver); if (!descriptor) { throw new TypeError("attempted to set private field on non-instance"); } if (descriptor.set) { descriptor.set.call(receiver, value); } else { if (!descriptor.writable) { throw new TypeError("attempted to set read only private field"); } descriptor.value = value; } return value; }

function _classPrivateFieldGet(receiver, privateMap) { var descriptor = privateMap.get(receiver); if (!descriptor) { throw new TypeError("attempted to get private field on non-instance"); } if (descriptor.get) { return descriptor.get.call(receiver); } return descriptor.value; }

var _config = new WeakMap();

var _app = new WeakMap();

var _startApp = new WeakSet();

var _createWorker = new WeakSet();

/**
 * App Server Factory
 */
class AppServerFactory {
  constructor() {
    var config = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    _createWorker.add(this);

    _startApp.add(this);

    _config.set(this, {
      writable: true,
      value: {}
    });

    _app.set(this, {
      writable: true,
      value: null
    });

    _classPrivateFieldSet(this, _config, config);
  }

  instance() {
    return _classPrivateFieldGet(this, _app) || _classPrivateMethodGet(this, _startApp, _startApp2).call(this);
  }

}

exports.default = AppServerFactory;

var _startApp2 = function _startApp2() {
  if (_classPrivateFieldGet(this, _config).cluster) {
    if (_cluster.default.isMaster) {
      var _ref, _ref2, _ref3;

      _classPrivateFieldGet(this, _config).cpus.forEach(() => _cluster.default.fork());

      console.info((_ref = (_ref2 = (_ref3 = "Workers: " + _cluster.default.workers, Object.keys(_ref3)), _ref2.map(id => "- ".concat(_cluster.default.workers[id].process.pid))), _ref.join(", ")));
    } else {
      _classPrivateFieldSet(this, _app, _classPrivateMethodGet(this, _createWorker, _createWorker2).call(this));
    }
  } else {
    console.info("Single CPU app started");

    _classPrivateFieldSet(this, _app, _classPrivateMethodGet(this, _createWorker, _createWorker2).call(this));
  }

  return _classPrivateFieldGet(this, _app);
};

var _createWorker2 = function _createWorker2() {
  var app = (0, _createApplication.default)(_objectSpread({}, _classPrivateFieldGet(this, _config))),
      server = app.listen(_classPrivateFieldGet(this, _config).port, () => {
    // GATEWAY TIMEOUT - 504
    server.setTimeout(120000);
    console.info("App listening on:".concat(server.address().address, ":").concat(_classPrivateFieldGet(this, _config).port));
  });
  return app;
};