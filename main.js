import axios from "axios"
import topping from "mqtt-topping"
import bunyan from "bunyan"

export default async function Init(serviceId, bootstrapUrl) {
  const log = createLogger(serviceId)

  log.info({ bootstrapUrl }, "Retrieving bootstrap data")
  const data = await queryBootstrapData(bootstrapUrl)
  log.info({ data }, "Bootstrap data retrieved")

  const mqttClient = connectToServer(
    serviceId,
    log,
    data.device,
    data.tcpBrokerUri,
    data.httpBrokerUri
  )

  return Object.assign({ log, mqttClient }, data)
}

function createLogger(serviceId) {
  return bunyan.createLogger({
    name: serviceId,
    level: "debug",
    serializers: { error: bunyan.stdSerializers.err }
  })
}

function queryBootstrapData(url) {
  return axios.get(url, { timeout: 2000 })
    .then((response) => response.data)
    .catch(() => delay(1000).then(() => queryBootstrapData(url)))
}

function delay(time) {
  return new Promise((resolve) => {
    setTimeout(resolve, time)
  })
}

function connectToServer(serviceId, log, device, tcpBrokerUri, httpBrokerUri) {
  const mqttClient = topping.connect(
    tcpBrokerUri,
    httpBrokerUri,
    `${serviceId}-${device}-${Math.random().toString(16).substr(2, 8)}`
  )

  mqttClient.on("connect", () => { log.info("Connected to Broker") })
  mqttClient.on("close", () => { log.error("Disconnected from Broker") })
  mqttClient.on("error", () => { log.error("Error Connecting to Broker") })

  return mqttClient
}
