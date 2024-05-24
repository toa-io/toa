'use strict'

const schemas = require('./schemas')
const { Contract } = require('./contract')
const { ResponseContractException } = require('../exceptions')

class Reply extends Contract {
  static Exception = ResponseContractException

  static schema (output, errors) {
    const schema = { type: 'object', properties: {}, additionalProperties: false }

    if (output !== undefined) {
      output.additionalProperties = true
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
