"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _koa = _interopRequireDefault(require("koa"));

var _koaBodyparser = _interopRequireDefault(require("koa-bodyparser"));

var _koaCors = _interopRequireDefault(require("koa-cors"));

var _koaHelmet = _interopRequireDefault(require("koa-helmet"));

var _koaSslify = _interopRequireDefault(require("koa-sslify"));

var _koaMorgan = _interopRequireDefault(require("koa-morgan"));

var _koaRouter = _interopRequireDefault(require("koa-router"));

var _Actor = _interopRequireDefault(require("./Actor"));

var _Logger = _interopRequireDefault(require("./Logger"));

var _routeHelpers = require("./routeHelpers");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var _default = config => {
  var {
    verbose,
    env = "local",
    actions = [],
    mq
  } = config;
  var app = new _koa.default();
  var router = new _koaRouter.default();
  app.proxy = true;
  app.on("error", (error, ctx) => {
    if (verbose) {
      console.error({
        error,
        ctx
      });
    }
  });

  if (env === "production") {
    app.use((0, _koaSslify.default)({
      trustProtoHeader: true,
      redirectMethods: ["HEAD", "OPTIONS", "GET", "POST"],
      specCompliantDisallow: true
    }));
  }

  var actors = {}; // build routes

  actions.forEach(val => {
    var args = [val.method, val.route]; // TODO: this concept needs to be abstracted,
    // 'doAuth' currently requires the auth module,
    // which won't exist upon library completion
    // if ( val.auth ) {
    //   args.push(  val.auth === true ? doAuth( 0 ) : doAuth( val.auth ) )
    // }

    if (!actors[val.topic]) {
      actors[val.topic] = new _Actor.default({
        topic: val.topic,
        mq
      });
    }

    val.actor = actors[val.topic];
    args.push((0, _routeHelpers.handleRequest)(val));
    router[val.method](...args);
  });
  app.use((0, _koaMorgan.default)("combined")) //TODO: set list of FROM domains per environment, probably should be and env var actually
  .use((0, _koaCors.default)()).use((0, _koaHelmet.default)()).use((0, _koaBodyparser.default)({
    enableTypes: ["json", "form"],
    formLimit: "5mb"
  })).use(router.routes()).use(router.allowedMethods());
  return app;
};

exports.default = _default;