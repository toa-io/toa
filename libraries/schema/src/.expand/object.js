'use strict'

const { empty, defined, remap } = require('@toa.io/libraries/generic')
const { valid } = require('../valid')
const { array } = require('./array')
const { oom } = require('./oom')
const { patterns } = require('./patterns')
const { required } = require('./required')

/**
 * @param {toa.schema.JSON} schema
 * @param {Function} expand
 * @returns {toa.schema.JSON}
 */
const object = (schema, expand) => {
  if (schema === null) return {}
  if (skip(schema)) return schema
  if (Array.isArray(schema)) return array(/** @type {any[]} */ schema, expand)

  if (schema.type === 'array') {
    schema.items = expand(schema.items)

    return schema
  }

  // object type
  if (schema.properties === undefined) schema = { properties: schema }

  schema.type = 'object'
  schema.additionalProperties = false

  schema.properties = remap(schema.properties, (value) => expand(value))

  oom(schema.properties)

  const patternProperties = patterns(schema.properties)
  schema.patternProperties = remap(patternProperties, (value) => expand(value))

  required(schema)

  // cleanup
  if (empty(schema.properties)) delete schema.properties
  if (empty(schema.patternProperties)) delete schema.patternProperties

  return schema
}

/**
 * @param {toa.schema.JSON} schema
 * @returns {boolean}
 */
const skip = (schema) => {
  const found = KEYWORDS.find((key) => schema[key] !== undefined)

  return found && valid(schema)
}

const KEYWORDS = ['type', 'oneOf', '$ref']

exports.object = object
