'use strict'

const schemas = require('./schemas')
const { RequestContractException } = require('../exceptions')
const { Contract } = require('./contract')

class Request extends Contract {
  /** @readonly */
  contracts = {}

  constructor (schema, definition) {
    super(schema)

    for (const key of ['input', 'output', 'errors'])
      if (definition[key] !== undefined)
        this.contracts[key] = definition[key]
  }

  static Exception = RequestContractException

  /**
   * @returns {toa.schema.JSON}
   */
  static schema (definition, entity) {
    const schema = {
      type: 'object',
      properties: { authentic: { type: 'boolean' } },
      additionalProperties: true
    }

    const required = []

    if (definition.input !== undefined) {
      schema.properties.input = definition.input
      required.push('input')
    }
    else
      schema.properties.input = { type: 'null' }

    if (entity === undefined)
      definition.query = false

    if (definition.query === true)
      required.push('query')

    if (definition.query === false)
      schema.properties.query = { type: 'null' }

    if (definition.query !== false) {
      const query = structuredClone(schemas.query)

      query.properties.id = entity.schema.properties.id

      if (definition.type === 'observation') {
        delete query.properties.version
      }
      else {
        delete query.properties.projection
      }

      if (definition.type !== 'observation' || definition.scope !== 'objects') {
        delete query.properties.omit
        delete query.properties.limit
      }
      else {
        if (query.required === undefined) query.required = ['limit']
        else query.required.push('limit')
      }

      schema.properties.query = query
    }

    if (required.length > 0)
      schema.required = required

    return schema
  }
}

exports.Request = Request
