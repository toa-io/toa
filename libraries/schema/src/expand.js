'use strict'

const { remap } = require('@toa.io/libraries/generic')

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
  schema.properties = remap(schema.properties, (value) => expand(value))
  schema.additionalProperties = schema.properties['...'] !== undefined

  delete schema.properties['...']

  required(schema)

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
  if (array.length === 1 && PRIMITIVES.includes(array[0])) {
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

const PRIMITIVES = ['string', 'number', 'integer', 'boolean', 'object', 'array']

const SHORTCUTS = {
  id: {
    $ref: 'https://schemas.toa.io/0.0.0/definitions#/definitions/id'
  }
}

exports.expand = expand
