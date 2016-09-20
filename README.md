# Service Init

Wraps the initialization tasks of a backend service.

## Features

* A [bunyan](https://www.npmjs.com/package/bunyan) logger
* Bootstrap parameter returned by a query of a given uri with retries
* MQTT client connection via [mqtt-topping](https://www.npmjs.com/package/mqtt-topping)

## Usage

```javascript
var init = require("service-init");

var serviceId = "myService";
var bootstrapUri = "http://bootstrap-server.com/myService"; // process.env is used for bootstrapping if null

init(serviceId, bootstrapUri, (log, mqttClient, bootstrapData) => {
  // application logic goes here
});
```
