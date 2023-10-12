'use strict'

/**
 * @param {string} value
 * @returns {object}
 */
function string (value) {
  if (typeof value !== 'string') return null

  const match = value.match(RX)

  if (match === null) return null

  return {
    type: 'string',
    maxLength: parseInt(match.groups.length)
  }
}

const RX = /^string\((?<length>\d{1,16})\)$/

exports.string = string
