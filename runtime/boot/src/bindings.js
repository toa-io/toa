'use strict'

const { Exposition } = require('@kookaburra/core')

const produce = (runtime, bindings) => {
  // set of bindings is constant
  if (!produce.memo[runtime.locator.fqn]) {
    produce.memo[runtime.locator.fqn] = each(runtime.locator, bindings, (factory, endpoints) => {
      const producer = factory.producer(runtime, endpoints)

      producer.depends(runtime)

      return producer
    })
  }

  return produce.memo[runtime.locator.fqn]
}

produce.memo = {}

const consume = (locator, bindings) =>
  each(locator, bindings, (factory, endpoints) => factory.consumer(locator, endpoints))

const expose = (exposition, bindings) => [LOOP].concat(bindings || SYSTEM_BINDINGS).map((binding) => {
  const producer = factory(binding).exposition(exposition, Exposition.endpoints())

  producer.depends(exposition)

  return producer
})

const discover = (locator, bindings) => [LOOP].concat(bindings || SYSTEM_BINDINGS).map((binding) =>
  factory(binding).discovery(locator))

const each = (locator, bindings, callback) => {
  const map = {}

  for (const operation of locator.operations) {
    const binds = bindings ? [...bindings] : locator.bindings(operation.name)

    binds.unshift(LOOP)

    for (const binding of binds) {
      if (!map[binding]) map[binding] = []

      map[binding].push(operation.name)
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
