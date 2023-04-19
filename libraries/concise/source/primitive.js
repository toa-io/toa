'use strict'

const { PRIMITIVES } = require('./expressions/constants')
const expressions = require('./expressions')

/**
 * @param {any} value
 * @returns {Object}
 */
const primitive = (value) => {
  const expression = parse(value)

  if (expression !== null) return expression

  const type = typeof value

  if (PRIMITIVES.includes(value)) return { type: value }
  if (PRIMITIVES.includes(type)) return { type, default: value }
}

/**
 * @param {any} value
 * @returns {Object}
 */
function parse (value) {
  if (typeof value !== 'string') return null

  for (const expression of expressions) {
    const result = expression(value)

    if (result !== null) return result
  }

  return null
}

exports.primitive = primitive
