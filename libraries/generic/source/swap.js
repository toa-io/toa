'use strict'

/**
 * @param {Object} object
 * @returns {Object} object
 */
const swap = (object) => {
  return Object.fromEntries(Object.entries(object).map(([key, value]) => ([value, key])))
}

exports.swap = swap
