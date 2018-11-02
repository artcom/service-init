# Service Init

Wraps the initialization tasks of a backend service.

## Features

* A [bunyan](https://www.npmjs.com/package/bunyan) logger
* MQTT client connection via [mqtt-topping](https://www.npmjs.com/package/mqtt-topping)
* A config query method which 
* Bootstrap parameter returned by a query of a given uri with retries

## Usage

```javascript
var init = require("service-init");

var serviceId = "myService";
var bootstrapUri = "http://bootstrap-server.com/myService"; // process.env is used for bootstrapping if null

init(serviceId, bootstrapUri, (log, mqttClient, queryConfig, bootstrapData) => {
  // application logic goes here
});
```
