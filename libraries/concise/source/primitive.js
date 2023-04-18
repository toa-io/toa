'use strict'

const { PRIMITIVES } = require('./constants')
const { expression } = require('./expression')
const { reference } = require('./reference')

/**
 * @param {string} value
 * @returns {Object}
 */
const primitive = (value) => {
  const regex = expression(value)

  if (regex !== null) return regex

  const ref = reference(value)

  if (ref !== null) return ref

  const type = typeof value

  if (PRIMITIVES.includes(value)) return { type: value }
  if (PRIMITIVES.includes(type)) return { type, default: value }
}

exports.primitive = primitive
