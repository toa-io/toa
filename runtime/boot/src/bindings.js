'use strict'

const clone = require('clone-deep')

const { Exposition } = require('@kookaburra/core')

const produce = (runtime, bindings) => each(runtime.locator, bindings, (factory, endpoints) => {
  const producer = factory.producer(runtime, endpoints)

  producer.depends(runtime)

  return producer
})

const consume = (locator, bindings) =>
  each(locator, bindings, (factory, endpoints) => factory.consumer(locator, endpoints))

const expose = (exposition, bindings) => [LOOP].concat(bindings || SYSTEM_BINDINGS).map((binding) => {
  const producer = factory(binding).exposition(exposition, exposition.endpoints)

  producer.depends(exposition)

  return producer
})

const discover = (locator, bindings) => [LOOP].concat(bindings || SYSTEM_BINDINGS).map((binding) =>
  factory(binding).discovery(locator))

const transmit = (locator, bindings) => {
  // first transmitting binding
  for (const binding of bindings || locator.bindings()) {
    if (factory(binding).transmitter !== undefined) {
      return factory(binding).transmitter(locator)
    }
  }
}

const receive = () => {

}

const each = (locator, bindings, callback) => {
  const map = {}

  for (const endpoint of Object.keys(locator.operations)) {
    const binds = clone(bindings ? [...bindings] : locator.bindings(endpoint))

    binds.unshift(LOOP)

    for (const binding of binds) {
      if (!map[binding]) map[binding] = []

      map[binding].push(endpoint)
    }
  }

  return Object.entries(map).map(([binding, endpoints]) => callback(factory(binding), endpoints))
}

const factory = (binding) => {
  if (!factory.memo[binding]) factory.memo[binding] = new (require(binding).Factory)()

  return factory.memo[binding]
}

factory.memo = {}

const LOOP = '@kookaburra/bindings.loop'
const SYSTEM_BINDINGS = ['@kookaburra/bindings.amqp']

exports.produce = produce
exports.consume = consume
exports.expose = expose
exports.discover = discover
exports.transmit = transmit
exports.receive = receive
