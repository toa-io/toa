'use strict'

const { PRIMITIVES, SHORTCUTS } = require('./constants')
const { values } = require('./values')

/**
 * @param {string} value
 * @returns {toa.schema.JSON}
 */
const primitive = (value) => {
  const type = /** @type {toa.schema.Type} */ typeof value
  const schema = values(value)

  if (schema !== undefined) return schema

  if (value in SHORTCUTS) return SHORTCUTS[value]
  if (PRIMITIVES.includes(value)) return /** @type {toa.schema.JSON} */ { type: value }
  if (PRIMITIVES.includes(type)) return /** @type {toa.schema.JSON} */ { type, default: value }
}

exports.primitive = primitive
