import { concat } from '@toa.io/generic'

/**
 * @param {import('@toa.io/core').Locator} locator
 * @param {string} endpoint
 * @returns {string}
 */
export const name = (locator, endpoint) =>
  locator.namespace + '.' + concat(locator.name, '.') + endpoint

/**
 * where every task a component is given arrives, whichever of its operations it names: the
 * message says which, so the queue holds one per component rather than one per operation
 */
export const tasks = (locator) => locator.namespace + '.' + locator.name + '..tasks'

/** the exchange the processes serving a stateful endpoint are bound to, each under its name */
export const instances = (locator, endpoint) => name(locator, endpoint) + '..instances'

/** where a channel is published to */
export const outbound = (channel) => channel + '.' + OUT

/** where a channel arrives from elsewhere; federated from the `out` of the others */
export const inbound = (channel) => channel + '.' + IN

/** the queue one label of a channel is consumed from */
export const bound = (channel, label) => channel + '.' + label

const OUT = 'out'
const IN = 'in'
