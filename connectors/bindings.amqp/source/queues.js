import { concat } from '@toa.io/generic'

/**
 * @param {toa.core.Locator} locator
 * @param {string} endpoint
 * @returns {string}
 */
const name = (locator, endpoint) =>
  locator.namespace + '.' + concat(locator.name, '.') + endpoint

export { name }
