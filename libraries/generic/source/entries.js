'use strict'

/**
 * @param {object} object
 * @returns {[string | Symbol, any][]}
 */
const entries = (object) => {
  /** @type {[string | Symbol, any][]} */
  const entries = Object.entries(object)

  for (const sym of Object.getOwnPropertySymbols(object)) entries.push([sym, object[sym]])

  return entries
}

exports.entries = entries
