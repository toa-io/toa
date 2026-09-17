import { concat, environment } from '@toa.io/generic'

/**
 * A name as a process of this scope declares it: under a suffix, after the scope, so that
 * processes of one context with different suffixes share a virtual host without meeting on it.
 * First rather than last, because what is derived from a name is appended to it — `..tasks`,
 * `..instances`, and in comq `..<group>` and `.<instance>` — and all of it is then under one
 * prefix. The queue comq receives replies on is named by comq alone, at random, and is not.
 *
 * Without a suffix a name is what it has always been: a deployment is kept apart by its virtual
 * host, and renaming what is running would strand what its queues hold.
 *
 * @param {string} name
 * @returns {string}
 */
export const scoped = (name) =>
  environment.suffix() === undefined ? name : environment.scope() + '.' + name

/**
 * @param {import('@toa.io/core').Locator} locator
 * @param {string} endpoint
 * @returns {string}
 */
export const name = (locator, endpoint) =>
  scoped(locator.namespace + '.' + concat(locator.name, '.') + endpoint)

/**
 * where every task a component is given arrives, whichever of its operations it names: the
 * message says which, so the queue holds one per component rather than one per operation
 */
export const tasks = (locator) => scoped(locator.namespace + '.' + locator.name + '..tasks')

/** the exchange the processes serving a stateful endpoint are bound to, each under its name */
export const instances = (locator, endpoint) => name(locator, endpoint) + '..instances'

/** where a channel is published to */
export const outbound = (channel) => scoped(channel + '.' + OUT)

/** where a channel arrives from elsewhere; federated from the `out` of the others */
export const inbound = (channel) => scoped(channel + '.' + IN)

/** the queue one label of a channel is consumed from */
export const bound = (channel, label) => scoped(channel + '.' + label)

const OUT = 'out'
const IN = 'in'
