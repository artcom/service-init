const axios = require("axios")
const topping = require("mqtt-topping").default
const bunyan = require("bunyan")

module.exports = async function init(serviceId, bootstrapUrl, callback) {
  const log = createLogger(serviceId)
  const bootstrapData = await getBootstrapData(bootstrapUrl, log)

  const {
    device,
    tcpBrokerUri,
    httpBrokerUri,
    configServerUri
  } = bootstrapData

  const clientId = createClientId(serviceId, device)
  log.info({ tcpBrokerUri, httpBrokerUri, clientId }, "Connecting to Broker")
  const mqttClient = topping.connect(tcpBrokerUri, httpBrokerUri, { clientId })

  mqttClient.on("connect", () => { log.info("Connected to Broker") })
  mqttClient.on("close", () => { log.error("Disconnected from Broker") })
  mqttClient.on("error", () => { log.error("Error Connecting to Broker") })

  const queryConfig = createConfigQuery(configServerUri)

  try {
    await callback(log, mqttClient, queryConfig, bootstrapData)
  } catch (error) {
    log.error(error)
  }
}

function createLogger(serviceId) {
  return bunyan.createLogger({
    name: serviceId,
    level: "debug",
    serializers: { error: bunyan.stdSerializers.err }
  })
}

async function getBootstrapData(bootstrapUrl, log) {
  if (bootstrapUrl) {
    log.info({ bootstrapUrl }, "Retrieving bootstrap data from server")
    const bootstrapData = await queryBootstrapData(bootstrapUrl)
    log.info(bootstrapData, "Bootstrap data retrieved from server")

    return bootstrapData
  } else {
    const bootstrapData = {
      tcpBrokerUri: process.env.TCP_BROKER_URI,
      httpBrokerUri: process.env.HTTP_BROKER_URI,
      configServerUri: process.env.CONFIG_SERVER_URI,
      device: process.env.DEVICE
    }

    log.info(bootstrapData, "Using bootstrap data from environment")
    return bootstrapData
  }
}

function queryBootstrapData(url) {
  return axios.get(url, { timeout: 2000 })
    .then(response => response.data)
    .catch(() => delay(1000).then(() => queryBootstrapData(url)))
}

function delay(time) {
  return new Promise(resolve => {
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

function createConfigQuery(configServerUri) {
  return configServerUri
    ? config => axios(`${configServerUri}/master/${config}`).then(({ data }) => data)
    : null
}
