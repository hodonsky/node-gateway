# Node-SOA-Gateway

This is just the gateway side of the SOA so far, however it expects a message queue.
> Note: without any 'actions' the server should start, but it won't do much.

## Initialize Your Gateway Server

```
import Gateway from "@donsky/node-gateway"

const actions = [ ...action ] //see below for action schema
new Gateway(actions)
```

> Note: This works well with PM2 

## Config
All of the following configurations must be handled in the env vars, or in config. Examples below:

#### ENV VARS

Add the following to your bashrc, or bash profile depending on environment.
I use docker-compose so I just attach them to the container environment.
These will be picked up automatically by the default config file.
```
export PORT=80
export MQ_PROTOCOL=amqp
export MQ_HOSTNAME=rabbitmq // this is the hostname of my docker container, it should be env specific
export MQ_PORT=5672
export MQ_USERNAME=admin
export MQ_PASSWORD=Abcd1234
export MQ_QUEUE=gateway
```
> NOTE: Port "80" is not allowed to be exposed on a mac, so the default is actually 8080
> This can be found in (./lib/config.js).port

#### Code
```
import Gateway from "@donsky/node-gateway"

Gateway.configure({
  mq:{
    username: "admin",
    password: "Abcd1234"
    hostname: "rabbitmq"
    port    : 5672
  },
  port: 80
})
new Gateway()
```


## Action Shape:

```
// action.js

export default {
  auth                : true|false|{requirement:PERMISSION_*,context:""}
  actor               : null// autoPopulated
  topic               : "consumerTopic"
  method              : "get"|"post"|"put"|"put"|"update"|"delete"
  route               : "/route-path"
  name                : "CONSUMER_ACTION_NAME"
  requestTransformers : [
    ( ctx ) => ctx.request.body.firstName,
    ( firstName )=> requestAVRO
  ]
  responseTransformers: [
    ( responseAVRO ) => ( responseAVRO.response ),
    ( response ) => ( { lastName: response } )
  ]
  requestAVRO         : [
    { name: "firstName", type: "string" }
  ]
  responseAVRO        : [
    { name: "response", type: "string" }
  ]
}
```

##### Example:

```
import Gateway from "@donsky/node-gateway"
import action from "./action"

Gateway.configure({port:80})
new Gateway([action])
```
