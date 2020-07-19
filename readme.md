# Node-Gateway

This is the gateway side of the SOA, it requires a message queue, and associated consumers ( coming soon: @donsky/node-consumer ).

## Initialize Your Gateway Server

```javascript
import Gateway from "@donsky/node-gateway"
new Gateway(/*[action1[,action2]]*/)
```

## Configure
All of the following configurations must be handled in the env vars, or in config in the code. Examples below:

### ENV VARS

Add the following to your bashrc, or bash profile depending on environment.
I use docker-compose so I just attach them to the container environment.
These will be picked up automatically by the default config file.

```bash
export PORT=80
export MQ_PROTOCOL=amqp
export MQ_HOSTNAME=rabbitmq
export MQ_PORT=5672
export MQ_USERNAME=admin
export MQ_PASSWORD=Abcd1234
export MQ_QUEUE=gateway
```
###### The hostname can be a URI or a local hostname, in this example, _'rabbitmq'_ is my docker container hostname. During deploy this would change and be environment specific.

### Code
```javascript
Gateway.configure({
  mq:{
    username: "admin",
    password: "Abcd1234"
    hostname: "rabbitmq"
    port    : 5672
  },
  port: 80
})
```


## Action Shape:

```javascript
// action.js

/** 
 * Required Attributes
 */
const required = {
  topic       : "consumerTopic",
  method      : "get"|"post"|"put"|"put"|"update"|"delete",
  route       : "/route-path",
  name        : "CONSUMER_ACTION_NAME",
  requestAVRO : [
    { name: "firstName", type: "string" }
  ],
  responseAVRO: [
    { name: "response", type: "string" }
  ],
}
/**
 * Optional Attributes
 */
const optional = {
  /**
   * Defaults to (ctx)=>ctx
   * One transformer is fine this is
   * just an example of chaining.
   */
  requestTransformers : [
    ( ctx ) => ctx.request.body.firstName,
    ( firstName )=> requestAVRO
  ],
  /**
   * Defaults to (responseAVRO)=>responseAVRO
   * One transformer is fine this is
   * just an example of chaining.
   */
  responseTransformers: [ // Optional
    ( responseAVRO ) => ( responseAVRO.response ),
    ( response ) => ( { lastName: response } )
  ]
}
export default { ...required, ...optional }
```

#### Example:

```javascript
import action from "./action"

Gateway.configure({port:80})
new Gateway([action])
```
<br/>

---
---

<br/>

> Notes:
> - Without any 'actions' the server should start, but it won't do much
> - Port "80" is not allowed to be exposed on a mac, so the default is actually 8080: This can be found in (./lib/config.js).port
> - This works well with PM2 