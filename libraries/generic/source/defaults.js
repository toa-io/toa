'use strict'

const { traverse } = require('./traverse')
const { clear } = require('./clear')

/**
 * @param {toa.schema.JSON | Object} schema
 * @return {Object}
 */
const defaults = (schema) => {
  const parse = (node) => {
    if (node.type === 'object' && node.properties !== undefined) return { ...node.properties }
    if (node.default !== undefined) return node.default

    return null
  }

  const values = traverse(schema, parse)
  return clear(values)
}

exports.defaults = defaults
