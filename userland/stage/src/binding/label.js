'use strict'

/**
 * @param {toa.core.Locator} locator
 * @param {string} endpoint
 * @returns {string}
 */
const label = (locator, endpoint) => {
  return locator.id + '.' + endpoint
}

exports.label = label
