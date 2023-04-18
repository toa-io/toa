'use strict'

/**
 * @param {string} value
 * @returns {object}
 */
function reference (value) {
  if (typeof value !== 'string') return null

  const match = value.match(RX)

  if (match === null) return null
  else return { $ref: match.groups.ref }
}

const RX = /^ref:(?<ref>.+)/

exports.reference = reference
