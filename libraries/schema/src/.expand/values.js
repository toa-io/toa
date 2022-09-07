'use strict'

const { EXPRESSION } = require('./constants')

/**
 * @param {string} value
 * @returns {toa.schema.JSON | undefined}
 */
const values = (value) => {
  if (typeof value !== 'string') return

  const match = value.match(EXPRESSION)

  if (match === null) return

  return {
    type: 'string',
    pattern: match.groups.expression
  }
}

exports.values = values
