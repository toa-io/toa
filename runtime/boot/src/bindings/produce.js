'use strict'

const { LOOP } = require('./constants')
const { factory } = require('./factory')

const produce = (component, operations) => {
  const local = []
  const other = []

  group(operations, (binding, endpoints) => {
    const producer = factory(binding).producer(component.locator, endpoints, component)

    if (require(binding).properties.local === true)
      local.push(producer)
    else
      other.push(producer)
  })

  return { local, other }
}

const group = (operations, callback) => {
  const map = {}

  if (operations !== undefined)
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

  for (const [binding, endpoints] of Object.entries(map))
    callback(binding, endpoints)
}

exports.produce = produce
