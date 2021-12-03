'use strict'

const { LOOP } = require('./constants')
const { factory } = require('./factory')

const produce = (runtime, operations) => group(operations, (factory, endpoints) =>
  factory.producer(runtime.locator, endpoints, runtime))

const group = (operations, callback) => {
  const map = {}

  for (const [endpoint, operation] of Object.entries(operations)) {
    const bindings = global.TOA_INTEGRATION_BINDINGS_LOOP_DISABLED
      ? operation.bindings
      : [LOOP].concat(operation.bindings)

    for (const binding of bindings) {
      if (!map[binding]) map[binding] = []

      map[binding].push(endpoint)
    }
  }

  return Object.entries(map).map(([binding, endpoints]) => callback(factory(binding), endpoints))
}

exports.produce = produce
