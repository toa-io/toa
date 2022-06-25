'use strict'

const { traverse, merge } = require('@toa.io/libraries/generic')

/**
 * @param {toa.core.Locator} locator
 * @param {toa.libraries.schema.Schema} schema
 * @returns {toa.core.reflection.Source}
 */
const source = (locator, schema) => () => {
  const varname = PREFIX + locator.uppercase
  const string = process.env[varname]
  const value = string === undefined ? {} : JSON.parse(string)
  const form = structure(schema.schema)
  const object = merge(form, value, { override: true })

  schema.validate(object)

  return object
}

/**
 * @param {toa.libraries.schema.JSON} schema
 * @return {Object}
 */
const structure = (schema) => {
  const defaults = (node) => {
    if (node.properties !== undefined) return { ...node.properties }
    if (node.default !== undefined) return node.default

    return null
  }

  return traverse(schema, defaults)
}

const PREFIX = 'TOA_CONFIGURATION_'

exports.source = source
