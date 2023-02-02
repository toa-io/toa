'use strict'

const { empty, remap } = require('@toa.io/libraries/generic')

const { array } = require('./array')
const { oom } = require('./oom')
const { patterns } = require('./patterns')
const { required } = require('./required')

/**
 * @param {object} schema
 * @param {toa.cos.validate} validate
 * @returns {object}
 */
const object = (schema, validate) => {
  // circular dependency
  const { expand } = require('./expand')

  if (schema === null) return {}
  if (skip(schema, validate)) return schema
  if (Array.isArray(schema)) return array(/** @type {any[]} */ schema, validate)

  if (schema.type === 'array') {
    schema.items = expand(schema.items, validate)

    return schema
  }

  // object type
  if (schema.properties === undefined) {
    const properties = Object.assign({}, schema)

    schema = { properties }
  }

  if ('$id' in schema.properties) {
    schema.$id = schema.properties.$id
    delete schema.properties.$id
  }

  schema.type = 'object'
  schema.additionalProperties = false

  schema.properties = remap(schema.properties, (value) => expand(value, validate))

  oom(schema.properties)

  const patternProperties = patterns(schema.properties)

  schema.patternProperties = remap(patternProperties, (value) => expand(value, validate))

  required(schema)

  // cleanup
  if (empty(schema.properties)) delete schema.properties
  if (empty(schema.patternProperties)) delete schema.patternProperties

  return schema
}

/**
 * @param {object} schema
 * @param {toa.cos.validate} validate
 * @returns {boolean}
 */
const skip = (schema, validate) => {
  const found = KEYWORDS.find((key) => schema[key] !== undefined)

  return found && validate(schema)
}

// ?
const KEYWORDS = ['type', 'oneOf', '$ref']

exports.object = object
