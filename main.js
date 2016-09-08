import axios from "axios"
import topping from "mqtt-topping"
import bunyan from "bunyan"

export default async function init(serviceId, bootstrapUrl, callback) {
  const log = createLogger(serviceId)

  const {
    device,
    tcpBrokerUri,
    httpBrokerUri,
    bootstrapData
  } = await getBootstrapData(bootstrapUrl, log)

  const clientId = createClientId(serviceId, device)
  log.info({ tcpBrokerUri, httpBrokerUri, clientId }, "Connecting to Broker")
  const mqttClient = topping.connect(tcpBrokerUri, httpBrokerUri, { clientId })

  mqttClient.on("connect", () => { log.info("Connected to Broker") })
  mqttClient.on("close", () => { log.error("Disconnected from Broker") })
  mqttClient.on("error", () => { log.error("Error Connecting to Broker") })

  try {
    await callback(log, mqttClient, bootstrapData)
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
    log.info({ bootstrapUrl }, "Retrieving bootstrap data")
    const bootstrapData = await queryBootstrapData(bootstrapUrl)
    log.info({ bootstrapData }, "Bootstrap data retrieved")

    return {
      tcpBrokerUri: bootstrapData.tcpBrokerUri,
      httpBrokerUri: bootstrapData.httpBrokerUri,
      device: bootstrapData.device,
      bootstrapData
    }
  } else {
    log.info("Using environment bootstrap data")
    const bootstrapData = Object.assign({}, process.env)

    return {
      tcpBrokerUri: bootstrapData.TCP_BROKER_URI,
      httpBrokerUri: bootstrapData.HTTP_BROKER_URI,
      device: bootstrapData.DEVICE,
      bootstrapData
    }
  }
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
