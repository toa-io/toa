'use strict'

const { Exposition } = require('@kookaburra/runtime')

const produce = (runtime) => each(runtime.locator, (factory, endpoints) => factory.producer(runtime, endpoints))
const consume = (locator) => each(locator, (factory, endpoints) => factory.consumer(locator, endpoints))

const expose = (exposition) => SYSTEM_BINDINGS.map((binding) =>
  factory(binding).exposition(exposition, Exposition.endpoints()))

const discover = (locator) => SYSTEM_BINDINGS.map((binding) =>
  factory(binding).discovery(locator))

const each = (locator, callback) => {
  const map = {}

  for (const operation of locator.operations) {
    operation.bindings.unshift(LOOP)

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

// TODO: loop
const LOOP = '@kookaburra/bindings.loop'
const SYSTEM_BINDINGS = [LOOP, '@kookaburra/bindings.amqp']

exports.produce = produce
exports.consume = consume
exports.expose = expose
exports.discover = discover
