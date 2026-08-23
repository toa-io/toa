'use strict'

const { console: output } = require('openspan')
const boot = require('@toa.io/boot')
const { context: load } = require('@toa.io/norm')
const { version } = require('@toa.io/runtime')

const { graceful } = require('./lib/graceful')
const { context: find } = require('../util/find')

/**
 * @param {Record<string, string | boolean>} argv
 * @return {Promise<void>}
 */
async function mono (argv) {
  console.log('Runtime', version)

  const root = find(argv.path)
  const context = await load(root)
  const paths = context.components.map((component) => component.path)
  const services = createServices(context.dependencies)

  let composition

  const start = async () => {
    composition = await boot.composition(paths, argv)

    const connectors = [composition, ...services]

    graceful({ disconnect: () => disconnectAll(connectors) })

    await connectAll(connectors)
  }

  if (process.env.TOA_BOOT_TRACE === '1') await output.span('toa mono', start)
  else await start()

  if (argv.kill === true) await disconnectAll([composition, ...services])
}

/**
 * @param {Record<string, unknown>} [dependencies]
 * @return {toa.core.Connector[]}
 */
function createServices (dependencies) {
  const services = []

  for (const reference of Object.keys(dependencies ?? {})) {
    const { Factory } = require(reference)

    if (typeof Factory?.prototype.service !== 'function') continue

    const service = new Factory(boot).service()

    if (service !== null) services.push(service)
  }

  return services
}

/**
 * @param {toa.core.Connector[]} connectors
 * @return {Promise<void>}
 */
function connectAll (connectors) {
  return Promise.all(connectors.map((connector) => connector.connect()))
}

/**
 * @param {toa.core.Connector[]} connectors
 * @return {Promise<void>}
 */
function disconnectAll (connectors) {
  return Promise.all(connectors.map((connector) => connector.disconnect()))
}

exports.mono = mono
