import { LOOP } from './constants.js'
import { factory } from './factory.js'

export const produce = async (component, operations) => {
  const local = []
  const other = []

  for (const [binding, endpoints] of group(operations)) {
    const made = await factory(binding)
    const producer = made.producer(component.locator, endpoints, component)
    const { properties } = await import(binding)

    if (properties.local === true)
      local.push(producer)
    else
      other.push(producer)
  }

  return { local, other }
}

/** The endpoints each binding carries, as entries. */
const group = (operations) => {
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

  return Object.entries(map)
}
