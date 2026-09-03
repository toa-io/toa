import { Factory } from '@toa.io/atomicity'

/**
 * What the replicas of one group decide together. Every component has one, whether or not there
 * is anything to coordinate through: without a Redis nothing is owned and nothing is metered —
 * see the connector's readme.
 *
 * @param {string} group
 * @returns {toa.core.atomicity.Atom}
 */
export const atomicity = (group) => new Factory().atom(group)
