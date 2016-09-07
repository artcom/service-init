import axios from "axios"
import topping from "mqtt-topping"
import bunyan from "bunyan"

export default async function init(serviceId, bootstrapUrl) {
  const log = createLogger(serviceId)

  let bootstrapData = null
  if (bootstrapUrl) {
    log.info({ bootstrapUrl }, "Retrieving bootstrap data")
    bootstrapData = await queryBootstrapData(bootstrapUrl)
    log.info({ bootstrapData }, "Bootstrap data retrieved")
  } else {
    bootstrapData = Object.assign({}, process.env)
    log.info({ bootstrapData }, "Using environment bootstrap data")
  }

  const { device, tcpBrokerUri, httpBrokerUri } = bootstrapData

  const clientId = createClientId(serviceId, device)
  log.info({ tcpBrokerUri, httpBrokerUri, clientId }, "Connecting to Broker")
  const mqttClient = topping.connect(tcpBrokerUri, httpBrokerUri, { clientId })

  mqttClient.on("connect", () => { log.info("Connected to Broker") })
  mqttClient.on("close", () => { log.error("Disconnected from Broker") })
  mqttClient.on("error", () => { log.error("Error Connecting to Broker") })

  return { log, mqttClient, bootstrapData }
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

function createClientId(serviceId, device) {
  const uuid = Math.random().toString(16).substr(2, 8)
  if (device) {
    return `${serviceId}-${device}-${uuid}`
  } else {
    return `${serviceId}-${uuid}`
  }
}
