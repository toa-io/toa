'use strict'

const { Discovery, Exposition, Locator } = require('@toa.io/core')

const boot = require('./index')

const discovery = async (reconnect) => {
  if (discovery.instance !== undefined) {
    const instance = await discovery.instance

    if (reconnect) await instance.connect()

    return instance
  }

  const create = async (id) => {
    const locator = new Locator(id)
    const call = boot.call(locator, ENDPOINT, { bindings: BINDINGS })

    await call.connect()

    return call
  }

  const instance = new Discovery(create)

  discovery.instance = (async () => {
    await instance.connect()
    return instance
  })()

  return discovery.instance
}

const expose = async (manifest) => {
  const exposition = new Exposition(manifest.locator, manifest)
  const operations = { [ENDPOINT]: { bindings: BINDINGS } }
  const producers = boot.bindings.produce(exposition, operations)

  await Promise.all(producers.map((producer) => producer.connect()))

  return producers
}

const BINDINGS = ['@toa.io/bindings.amqp']
const ENDPOINT = '.lookup'

exports.discovery = discovery
exports.expose = expose
