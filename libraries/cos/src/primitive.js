'use strict'

const { PRIMITIVES } = require('./constants')
const { expression } = require('./expression')

/**
 * @param {string} value
 * @returns {Object}
 */
const primitive = (value) => {
  const regex = expression(value)

  if (regex !== undefined) return regex

  const type = typeof value

  if (PRIMITIVES.includes(value)) return { type: value }
  if (PRIMITIVES.includes(type)) return { type, default: value }
}

exports.primitive = primitive
