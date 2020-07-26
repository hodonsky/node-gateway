# Node-Gateway

This is the gateway side of the SOA: [Working Example](https://github.com/hodonsky/node-soa-example)

### Prerequisites ( standard AMQP 0-9-1 ):
- AMQP Server/Cluster accepting connections with credentials. ( see  [`Local`](#Local) setup )
- Consumer Service(s)/Cluster(s) responding on responseTopic with CorrelationID. ([@donsky/node-service](https://www.npmjs.com/package/@donsky/node-service) )


### Impliments:
- NodeJS
- AVRO Message Standards & Schema ( dependancy: avsc )
- AMQP 0-9-1 Communication Standard ( dependancy: amqplib )
- Babel 7 & ESNext plugins ( dependancy: babel-* )
- KoaJS net server listening on `PORT` ( dependancy: koa & koa-* )

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
export MQ_USERNAME=defaultAdmin
export MQ_PASSWORD=SomePassword
```
###### The hostname can be a URI or a local hostname, in this example, _'rabbitmq'_ is my docker container hostname. During deploy this would change and be environment specific.

### Code
```javascript
Gateway.configure({
  mq:{
    username: "defaultAdmin",
    password: "SomePassword"
    hostname: "rabbitmq"
    port    : 5672
  },
  port: 80
})
```


## Action Object Options:

```javascript
// action.js

/** 
 * Required Attributes
 */
const required = {
  topic       : "consumerTopic",
  method      : "get"|"post"|"put"|"put"|"update"|"delete",
  route       : "/route-path",
  name        : "consumerActionName",
  requestAVRO : [
    { name: "firstName", type: "string" }
  ],
  responseAVRO: [
    { name: "response", type: "string" }
  ]
}
> I share a file with my service

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

> Notes:
> - Without any __actions__ the server should start, but it won't do much
> - Port __80__ is not allowed to be exposed on a mac, so the default is actually 8080: This can be found in __(./lib/config.js).port__
> - This works well with PM2 (Process Manager 2)
<br/>

## Local:

May I recommend spinning up a docker environment for those prerequisites, and getting all the services talking:
```Dockerfile
# Note: I use a docker container
version: "3.8"
services:
  rabbitmq:
    image: rabbitmq:management
    ports:
     - "5672:5672"
     - "15672:15672"
    environment:
      # ${ENV_VAR} work here for values as well
      RABBITMQ_DEFAULT_USER: defaultAdmin
      RABBITMQ_DEFAULT_PASS: SomePassword
    restart: on-failure   
  gateway:
    build:
      context: ./
    ports:
     - "80:80"
    environment:
     - NODE_ENV=local
     - HOSTNAME=gateway
     - PORT=80
     - MQ_PROTOCOL=amqp
     - MQ_HOSTNAME=rabbitmq
     - MQ_PORT=5672
     - MQ_USERNAME=defaultAdmin
     - MQ_PASSWORD=SomePassword
    depends_on:
     - rabbitmq
    restart: on-failure
```
