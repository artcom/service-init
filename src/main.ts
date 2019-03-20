import axios from "axios"
import topping from "mqtt-topping"
import * as Logger from "bunyan"

interface BootstrapData {
  tcpBrokerUri: string,
  httpBrokerUri: string,
  configServerUri: string,
  device: string
}

module.exports = async function init(serviceId: string, bootstrapUrl: string, callback: Function) {
  const logger = createLogger(serviceId)
  const bootstrapData = await getBootstrapData(bootstrapUrl, logger)

  const {
    device,
    tcpBrokerUri,
    httpBrokerUri,
    configServerUri
  } = bootstrapData

  const clientId = createClientId(serviceId, device)
  logger.info({ tcpBrokerUri, httpBrokerUri, clientId }, "Connecting to Broker")
  const mqttClient = topping.connect(tcpBrokerUri, httpBrokerUri, { clientId })

  mqttClient.on("connect", () => { logger.info("Connected to Broker") })
  mqttClient.on("close", () => { logger.error("Disconnected from Broker") })
  mqttClient.on("error", () => { logger.error("Error Connecting to Broker") })

  const queryConfig = createConfigQuery(configServerUri)

  try {
    await callback(logger, mqttClient, queryConfig, bootstrapData)
  } catch (error) {
    logger.error(error)
  }
}

function createLogger(serviceId: string) : Logger {
  return Logger.createLogger({
    name: serviceId,
    level: "debug",
    serializers: { error: Logger.stdSerializers.err }
  })
}

async function getBootstrapData(bootstrapUrl: string, logger: Logger) : Promise<BootstrapData> {
  if (bootstrapUrl) {
    logger.info({ bootstrapUrl }, "Retrieving bootstrap data from server")
    const bootstrapData = await queryBootstrapData(bootstrapUrl)
    logger.info(bootstrapData, "Bootstrap data retrieved from server")

    return bootstrapData
  } else {
    const bootstrapData = {
      tcpBrokerUri: process.env.TCP_BROKER_URI,
      httpBrokerUri: process.env.HTTP_BROKER_URI,
      configServerUri: process.env.CONFIG_SERVER_URI,
      device: process.env.DEVICE
    }

    logger.info(bootstrapData, "Using bootstrap data from environment")
    return bootstrapData
  }
}

function queryBootstrapData(url: string) : Promise<BootstrapData> {
  return axios.get(url, { timeout: 2000 })
    .then(response => response.data)
    .catch(() => delay(1000).then(() => queryBootstrapData(url)))
}

function delay(time: number) {
  return new Promise(resolve => {
    setTimeout(resolve, time)
  })
}

function createClientId(serviceId: string, device: string) {
  const uuid = Math.random().toString(16).substr(2, 8)
  if (device) {
    return `${serviceId}-${device}-${uuid}`
  } else {
    return `${serviceId}-${uuid}`
  }
}

function createConfigQuery(configServerUri: string) : (config : string) => any {
  return configServerUri
    ? config => axios(`${configServerUri}/master/${config}`).then(({ data }) => data)
    : null
}
