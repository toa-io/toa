'use strict'

const { console: output } = require('openspan')
const { Connector } = require('@toa.io/core')
const boot = require('@toa.io/boot')
const { component } = require('@toa.io/norm')
const { version } = require('@toa.io/runtime')

const { graceful } = require('./lib/graceful')
const { components: find } = require('../util/find')

/**
 * @param {Record<string, string | boolean | string[]>} argv
 * @return {Promise<void>}
 */
async function mono (argv) {
  console.log('Runtime', version)

  const paths = find(argv.paths)
  const services = await createServices(paths)
  const composition = await boot.composition(paths, argv)
  const connector = new Connector()

  connector.depends([composition, ...services])

  const start = async () => {
    graceful(connector)

    await connector.connect()
  }

  if (process.env.TOA_BOOT_TRACE === '1') await output.span('toa mono', start)
  else await start()

  if (argv.kill === true) await connector.disconnect()
}

/**
 * @param {string[]} paths
 * @return {Promise<toa.core.Connector[]>}
 */
async function createServices (paths) {
  const references = new Set()

  for (const path of paths) {
    const manifest = await component(path)

    for (const reference of Object.keys(manifest.extensions ?? {}))
      references.add(reference)
  }

  const services = []

  for (const reference of references) {
    const { Factory } = require(reference)

    if (typeof Factory?.prototype.service !== 'function') continue

    const service = new Factory(boot).service()

    if (service !== null) services.push(service)
  }

  return services
}

exports.mono = mono
