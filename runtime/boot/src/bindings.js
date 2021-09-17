'use strict'

const { Exposition } = require('@kookaburra/core')

const produce = (runtime, bindings) =>
  each(runtime.locator, bindings, (factory, endpoints) => factory.producer(runtime, endpoints))

const consume = (locator, bindings) =>
  each(locator, bindings, (factory, endpoints) => factory.consumer(locator, endpoints))

const expose = (exposition) => SYSTEM_BINDINGS.map((binding) =>
  factory(binding).exposition(exposition, Exposition.endpoints()))

const discover = (locator) => SYSTEM_BINDINGS.map((binding) => factory(binding).discovery(locator))

const each = (locator, bindings, callback) => {
  const map = {}

  for (const operation of locator.operations) {
    if (!bindings) {
      bindings = locator.bindings(operation.name)
      bindings.unshift(LOOP)
    }

    for (const binding of bindings) {
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

const LOOP = '@kookaburra/bindings.loop'
const SYSTEM_BINDINGS = [LOOP, '@kookaburra/bindings.amqp']

exports.produce = produce
exports.consume = consume
exports.expose = expose
exports.discover = discover
