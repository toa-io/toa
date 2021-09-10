'use strict'

const { Exposition } = require('@kookaburra/runtime')

const produce = (runtime) => each(runtime.locator, (factory, endpoints) => factory.producer(runtime, endpoints))
const consume = (locator) => each(locator, (factory, endpoints) => factory.consumer(locator, endpoints))
const expose = (exposition) => factory(SYSTEM_BINDING).exposition(exposition, Exposition.endpoints())
const discover = (locator) => factory(SYSTEM_BINDING).discovery(locator)

const each = (locator, callback) => {
  const map = {}

  for (const operation of locator.operations) {
    for (const binding of operation.bindings) {
      if (!map[binding]) map[binding] = []

      map[binding].push(operation.name)
    }
  }

  return Object.entries(map).map(([binding, endpoints]) => callback(factory(binding), endpoints))
}

const factories = {}

const factory = (binding) => {
  if (!factories[binding]) factories[binding] = new (require(binding).Factory)()

  return factories[binding]
}

const SYSTEM_BINDING = process.env.KOO_SYSTEM_BINDING || '@kookaburra/bindings.amqp'

exports.produce = produce
exports.consume = consume
exports.expose = expose
exports.discover = discover
