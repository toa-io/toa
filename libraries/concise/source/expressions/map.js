'use strict'

const { PRIMITIVES } = require('./constants')

/**
 * @param {string} value
 * @returns {object}
 */
function map (value) {
  if (typeof value !== 'string') return null

  const match = value.match(RX)

  if (match === null) return null
  else {
    return {
      type: 'object',
      patternProperties: {
        '^.+$': {
          type: match.groups.type
        }
      }
    }
  }
}

const types = PRIMITIVES.join('|')
const RX = new RegExp(`^<(?<type>${types})>$`)

exports.map = map
