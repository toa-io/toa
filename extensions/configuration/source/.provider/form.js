'use strict'

const { traverse, plain } = require('@toa.io/generic')

/**
 * @param {toa.schema.JSON | Object} schema
 * @return {Object}
 */
const form = (schema) => {
  const defaults = (node) => {
    if (node.properties !== undefined) return { ...node.properties }
    if (node.default !== undefined) return node.default

    return null
  }

  return traverse(schema, defaults)
}

exports.form = form
