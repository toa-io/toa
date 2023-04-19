'use strict'

const { EXPRESSION } = require('./constants')

/**
 * @param {string} value
 * @returns {object}
 */
const regular = (value) => {
  if (typeof value !== 'string') return null

  const match = value.match(EXPRESSION)

  if (match === null) return null

  return {
    type: 'string',
    pattern: match.groups.expression
  }
}

exports.regular = regular
