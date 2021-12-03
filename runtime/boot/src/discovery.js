'use strict'

const { Discovery, Exposition } = require('@toa.io/core')

const boot = require('./index')

const discovery = async () => {
  if (discovery.instance === undefined) {
    discovery.instance = new Discovery(lookup)

    await discovery.instance.connect()
  }

  return discovery.instance
}

const lookup = async (locator) => {
  const call = boot.call(locator, ENDPOINT, { bindings: BINDINGS })
  await call.connect()

  return call
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
