"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.requestServicesActions = exports.handleRequest = exports.responseTransformer = exports.requestTransformer = exports.handleError = void 0;

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

var invalidRequestXRequestId = "000-00-00-00-000";
var nonServiceXRequestId = "000-000-00-000-000";
/**
 * Builds a service request action
 * @param { String } action - Service Action
 * @param { Object } data - data blob ( usually JSON ) to be sent to the service action
 * @return { Object<String,Object>} - Object with action and data AS an object.
 */

var buildAction = (action, data) => data ? {
  action,
  data
} : {
  action
};
/**
 * An error handler
 * @param { Object } response - response handling setters
 * @param { Error<xRequestId,status,userError,message> } error - error block
 */


var handleError = (response, error) => {
  var {
    xRequestId,
    status = 500,
    userError,
    message
  } = error;
  console.error(error);
  response.set("x-request-id", xRequestId);
  response.status = status;
  response.body = {
    error: userError && message ? message : "System Error!! If you do not understand why you are getting this error " + "please email administrator and reference the [ 'x-request-id' ] " + "header in this response."
  };
};
/**
 * Processes requestTransformers on an action related to the root context
 * @param { Array<Function> } requestPipe - Array of functions
 * @param { Object } ctx 
 */


exports.handleError = handleError;

var requestTransformer = /*#__PURE__*/function () {
  var _ref = _asyncToGenerator(function* () {
    var requestPipe = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];
    var ctx = arguments.length > 1 ? arguments[1] : undefined;
    return requestPipe && requestPipe.length > 0 ? yield requestPipe.reduce( /*#__PURE__*/function () {
      var _ref2 = _asyncToGenerator(function* (result, fn) {
        return yield fn(result ? result : ctx);
      });

      return function (_x, _x2) {
        return _ref2.apply(this, arguments);
      };
    }(), null) : ((_ref3) => {
      var {
        request: {
          body,
          query
        },
        params = {}
      } = _ref3;
      return body ? _objectSpread(_objectSpread({}, body), params) : query ? _objectSpread(_objectSpread({}, query), params) : {};
    })(ctx);
  });

  return function requestTransformer() {
    return _ref.apply(this, arguments);
  };
}();
/**
 * Processes requestTransformers on an action related to the root context
 * @param { Array<Function> } responsePipe - Array of functions
 * @param { Object } data - Initial responseAVRO Object from queue
 * @param { Object } ctx - Original CTX from request
 */


exports.requestTransformer = requestTransformer;

var responseTransformer = /*#__PURE__*/function () {
  var _ref4 = _asyncToGenerator(function* () {
    var responsePipe = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];
    var data = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    var ctx = arguments.length > 2 ? arguments[2] : undefined;
    return responsePipe && responsePipe.length > 0 ? yield responsePipe.reduce( /*#__PURE__*/function () {
      var _ref5 = _asyncToGenerator(function* (result, fn) {
        return yield fn(result ? result : data, ctx);
      });

      return function (_x3, _x4) {
        return _ref5.apply(this, arguments);
      };
    }(), null) : data;
  });

  return function responseTransformer() {
    return _ref4.apply(this, arguments);
  };
}();
/**
 * Service request handler
 * @param { String } action - action name in the service to pass the request to
 */


exports.responseTransformer = responseTransformer;

var handleRequest = action => /*#__PURE__*/function () {
  var _ref6 = _asyncToGenerator(function* (ctx) {
    var {
      response
    } = ctx;

    try {
      if (!action || !(action === null || action === void 0 ? void 0 : action.topic)) {
        throw {
          xRequestId: invalidRequestXRequestId,
          message: "Invalid request: Missing, argument[0], or argument[0].topic",
          userError: true,
          status: 404
        };
      }
    } catch (error) {
      return handleError(response, error);
    }

    var {
      actor,
      name,
      requestAVRO,
      responseAVRO,
      requestTransformers = [],
      responseTransformers = []
    } = action;

    try {
      var {
        data,
        xRequestId
      } = yield actor.createRequest(buildAction(name, yield requestTransformer(requestTransformers, ctx)), {
        requestAVRO,
        responseAVRO
      });
      response.set("x-request-id", xRequestId);
      response.status = 200;
      response.body = responseTransformer(responseTransformers, data, ctx);
    } catch (error) {
      handleError(response, error);
    }
  });

  return function (_x5) {
    return _ref6.apply(this, arguments);
  };
}();
/**
 * Request service actions
 */


exports.handleRequest = handleRequest;

var requestServicesActions = () => /*#__PURE__*/function () {
  var _ref8 = _asyncToGenerator(function* (_ref7) {
    var {
      response
    } = _ref7;

    try {
      response.set("x-request-id", nonServiceXRequestId);
      response.status = 200;
      var actionsArr = Object.keys(Actions).filter(action => action !== "default");
      response.body = actionsArr.reduce((str, action) => str + (actionsArr.indexOf(action) === actionsArr.length - 1 ? "<li style='margin: 5px 0;'>".concat(action, "</li></ul>") : "<li style='margin: 5px 0;'>".concat(action, "</li>")), "<ul style='list-style-type:none;'>");
    } catch (error) {
      handleError(response, error);
    }
  });

  return function (_x6) {
    return _ref8.apply(this, arguments);
  };
}();

exports.requestServicesActions = requestServicesActions;