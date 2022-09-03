'use strict'

const { empty, remap } = require('@toa.io/libraries/generic')

const { array, patterns, required, constants: { PRIMITIVES, SHORTCUTS } } = require('./.expand')
const { valid } = require('./valid')

/**
 * @param {any} schema
 * @returns {toa.schema.JSON}
 */
const expand = (schema) => {
  return typeof schema === 'object' ? object(schema) : primitive(schema)
}

/**
 * @param value
 * @returns {toa.schema.JSON}
 */
const primitive = (value) => {
  if (PRIMITIVES.includes(value)) return { type: value }
  if (value in SHORTCUTS) return SHORTCUTS[value]

  const type = /** @type {toa.schema.Type} */ typeof value

  if (PRIMITIVES.includes(type)) return { type, default: value }
}

/**
 * @param {toa.schema.JSON} schema
 * @returns {toa.schema.JSON}
 */
const object = (schema) => {
  if (schema === null) return {}
  if (schema.type !== undefined && valid(schema)) return schema
  if (Array.isArray(schema)) return array(/** @type {any[]} */ schema)

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
  schema.additionalProperties = schema.properties['...'] !== undefined

  delete schema.properties['...']

  required(schema)

  if (empty(schema.properties)) delete schema.properties
  if (empty(schema.patternProperties)) delete schema.patternProperties

  return schema
}

exports.expand = expand
