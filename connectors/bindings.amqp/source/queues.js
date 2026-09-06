import { concat } from '@toa.io/generic'

/**
 * @param {import('@toa.io/core').Locator} locator
 * @param {string} endpoint
 * @returns {string}
 */
export const name = (locator, endpoint) =>
  locator.namespace + '.' + concat(locator.name, '.') + endpoint
