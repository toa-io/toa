import { definition } from '@toa.io/norm'
import { LOOP } from './constants.js'
import { factory } from './factory.js'

export const produce = async (component, operations) => {
  const local = []
  const other = []
  const stateful = addressed(operations)

  for (const [binding, endpoints] of group(operations)) {
    const made = await factory(binding)
    const carried = stateful.filter((endpoint) => endpoints.includes(endpoint))
    const producer = made.producer(component.locator, endpoints, component, carried)
    const { properties } = (await definition(binding)).module

    if (properties.local === true) local.push(producer)
    else other.push(producer)
  }

  return { local, other }
}

/** The endpoints that take addressed calls only. */
const addressed = (operations) =>
  operations === undefined
    ? []
    : Object.entries(operations)
        .filter(([, operation]) => operation.stateful === true)
        .map(([endpoint]) => endpoint)

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
