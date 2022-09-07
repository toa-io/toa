'use strict'

const { empty, remap } = require('@toa.io/libraries/generic')
const { valid } = require('../valid')
const { array } = require('./array')
const { patterns } = require('./patterns')
const { required } = require('./required')

/**
 * @param {toa.schema.JSON} schema
 * @param {Function} expand
 * @returns {toa.schema.JSON}
 */
const object = (schema, expand) => {
  if (schema === null) return {}
  if (schema.type !== undefined && valid(schema)) return schema
  if (Array.isArray(schema)) return array(/** @type {any[]} */ schema, expand)

  if (schema.type === 'array') {
    schema.items = expand(schema.items)

    return schema
  }

  // object type
  if (schema.properties === undefined) schema = { properties: schema }

  schema.type = 'object'

  const patternProperties = patterns(schema.properties)

  schema.patternProperties = remap(patternProperties, (value) => expand(value))
  schema.properties = remap(schema.properties, (value) => expand(value))
  schema.additionalProperties = false

  required(schema)

  if (empty(schema.properties)) delete schema.properties
  if (empty(schema.patternProperties)) delete schema.patternProperties

  return schema
}

exports.object = object
