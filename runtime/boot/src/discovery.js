'use strict'

const { discovery, Locator, Transmission } = require('@kookaburra/core')

const boot = require('./index')

const explore = async (id) => {
  const locator = new Locator()
  const transmitters = {}

  for (const method of discovery.interface.methods) {
    const endpoint = discovery.interface.endpoint(id, method)
    const consumers = boot.bindings.consume(locator, endpoint)

    transmitters[method] = new Transmission(consumers)
  }

  const explorer = new discovery.Explorer(transmitters)
  await explorer.connect()

  return explorer
}

const expose = async (manifest) => {
  const locator = new Locator()
  const exposition = new discovery.Exposition(locator, manifest)
  const producers = boot.bindings.expose(exposition)

  await Promise.all(producers.map((producer) => producer.connect()))

  return producers
}

exports.explore = explore
exports.expose = expose
