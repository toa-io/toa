'use strict'

/**
 * @param {Object} properties
 * @returns {Object}
 */
const patterns = (properties) => {
  const patterns = {}

  for (const [key, value] of Object.entries(properties)) {
    const match = key.match(RX)

    if (match === null) continue

    patterns[match.groups.expression] = value

    delete properties[key]
  }

  return patterns
}

const RX = /^\/(?<expression>.+)\/$/

exports.patterns = patterns
