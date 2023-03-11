'use strict'

const { LOOP } = require('./constants')
const { factory } = require('./factory')

const produce = (component, operations) => group(operations, (factory, endpoints) =>
  factory.producer(component.locator, endpoints, component))

const group = (operations, callback) => {
  const map = {}

  for (const [endpoint, operation] of Object.entries(operations)) {
    // noinspection JSUnresolvedVariable
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
