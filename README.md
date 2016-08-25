# Service Init

Wraps the initialization tasks of a backend service.

## Features

* A [bunyan](https://www.npmjs.com/package/bunyan) logger
* Bootstrap parameter returned by a query of a given uri with retries
* MQTT client connection via [mqtt-topping](https://www.npmjs.com/package/mqtt-topping)

### Usage

#### Using Promises

```javascript
var init = require("service-init");

var serviceId = "myService";
var bootstrapUri = "http://bootstrap-server.com/myService";

init(serviceId, bootstrapUri).then(({ log, mqtt, bootstrapParam1, bootstrapParam2 }) => {
  // application logic goes here
});
```

#### Using Babel & Async Functions

```javascript
import init from "service-init";

var serviceId = "myService";
var bootstrapUri = "http://bootstrap-server.com/myService";

async function main() {
  const { log, mqtt, bootstrapParam1, bootstrapParam2 } = await init(serviceId, bootstrapUri);
  // application logic goes here
}()
```
