'use strict'

const schemas = require('./schemas')
const { Contract } = require('./contract')
const { ResponseContractException } = require('../exceptions')

class Reply extends Contract {
  static Exception = ResponseContractException

  static schema (output, errors) {
    const schema = { type: 'object', properties: {}, additionalProperties: false }

    if (output !== undefined) {
      /*
       * A reply carries more than the operation declares — `_version` and the rest of the
       * record's own fields — so what it is validated against is the declaration relaxed.
       * On a copy: the declaration itself is what a component publishes when asked to
       * explain, and relaxing that would publish a contract nobody wrote.
       */
      output = structuredClone(output)

      if (output.type === 'object')
        output.additionalProperties = true
      else if (output.type === 'array' && output.items?.type === 'object')
        output.items.additionalProperties = true

      schema.properties.output = output
    }

    if (errors !== undefined)
      schema.properties.error = {
        type: 'object',
        properties: {
          code: {
            enum: errors
          },
          message: {
            type: 'string'
          }
        },
        required: ['code']
      }
    else
      schema.properties.error = schemas.error

    return schema
  }
}

exports.Reply = Reply
