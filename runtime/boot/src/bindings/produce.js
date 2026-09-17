import { definition } from '@toa.io/norm'
import { LOOP } from './constants.js'
import { factory } from './factory.js'

export const produce = async (component, operations) => {
  const local = []
  const other = []
  const stateful = addressed(operations)
  const streams = streamed(operations)

  for (const [binding, endpoints] of await group(operations)) {
    const made = await factory(binding)
    const carried = stateful.filter((endpoint) => endpoints.includes(endpoint))
    const carries = streams.filter((endpoint) => endpoints.includes(endpoint))
    const producer = made.producer(component.locator, endpoints, component, carried, carries)
    const { properties } = (await definition(binding)).module

    if (properties.local === true) local.push(producer)
    else other.push(producer)
  }

  return { local, other }
}

/** The endpoints that take one of their input properties as a stream. */
const streamed = (operations) =>
  operations === undefined
    ? []
    : Object.entries(operations)
        .filter(([, operation]) => operation.stream !== undefined)
        .map(([endpoint]) => endpoint)

/** The endpoints that take addressed calls only. */
const addressed = (operations) =>
  operations === undefined
    ? []
    : Object.entries(operations)
        .filter(([, operation]) => operation.stateful === true)
        .map(([endpoint]) => endpoint)

/** The endpoints each binding carries, as entries. */
const group = async (operations) => {
  const map = {}

  if (operations !== undefined)
    for (const [endpoint, operation] of Object.entries(operations)) {
      // noinspection JSUnresolvedVariable
      const bindings = global.TOA_INTEGRATION_BINDINGS_LOOP_DISABLED
        ? operation.bindings
        : [LOOP].concat(operation.bindings)

      for (const binding of bindings) {
        // an endpoint that takes a stream is served by the bindings that carry one, and by no other
        if (operation.stream !== undefined && !(await carries(binding))) continue

        if (!map[binding]) map[binding] = []

        map[binding].push(endpoint)
      }
    }

  return Object.entries(map)
}

/** Whether a binding carries a call whose input holds a stream, which only its module says. */
export const carries = async (binding) =>
  (await definition(binding)).module.properties.streams === true
