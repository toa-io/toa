'use strict'

const { remap } = require('@toa.io/libraries/generic')

/**
 * @param {any} schema
 * @returns {toa.schema.JSON}
 */
const expand = (schema) => {
  if (typeof schema !== 'object') schema = primitive(schema)
  if (schema === null) schema = { type: 'null' }
  if (schema.type === undefined) schema = object(schema)

  return schema
}

/**
 * @param value
 * @returns {toa.schema.JSON}
 */
const primitive = (value) => {
  if (TYPES.includes(value)) return { type: value }

  const type = /** @type {toa.schema.Type} */ typeof value

  if (TYPES.includes(type)) return { type, default: value }
}

/**
 * @param {toa.schema.JSON} schema
 * @returns {toa.schema.JSON}
 */
const object = (schema) => {
  if ('$ref' in schema) return schema
  if (Array.isArray(schema)) return array(schema)

  if (schema.properties === undefined) {
    const properties = remap(schema, (value) => expand(value))

    schema = { properties }
  }

  required(schema)

  schema.type = 'object'

  return schema
}

/**
 * @param {toa.schema.JSON} schema
 */
function required (schema) {
  const required = []

  for (const key of Object.keys(schema.properties)) {
    const last = key.slice(-1)

    if (last === '*') {
      const name = key.slice(0, -1)

      schema.properties[name] = schema.properties[key]
      required.push(name)

      delete schema.properties[key]
    }
  }

  if (required.length > 0) schema.required = required
}

/**
 * @param {any[]} array
 * @returns {toa.schema.JSON}
 */
const array = (array) => {
  if (array.length === 0) throw new Error('Array property declaration must be non-empty')

  const type = /** @type {toa.schema.Type} */ typeof array[0]

  // array of a given type
  if (TYPES.includes(type) && array.length === 1) {
    const type = /** @type {toa.schema.Type} */ array[0]

    return {
      type: 'array',
      items: { type }
    }
  }

  // one of given constants
  const oneOf = []

  for (const value of array) {
    if (typeof value !== type) { // eslint-disable-line
      throw new Error('Array property items must be of the same type')
    }

    const option = { const: value }

    oneOf.push(option)
  }

  return { type, oneOf }
}

const TYPES = ['string', 'number', 'integer', 'boolean', 'object', 'array']

exports.expand = expand
