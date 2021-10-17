'use strict'

const schemas = require('./schemas')
const { Conditions } = require('./conditions')
const { ResponseContractException } = require('../exceptions')

class Reply extends Conditions {
  static Exception = ResponseContractException

  static schema (output, error) {
    const schema = { properties: {}, additionalProperties: false }

    if (output !== undefined) schema.properties.output = output

    if (error !== undefined) schema.properties.error = error
    else schema.properties.error = schemas.error

    return schema
  }
}

exports.Reply = Reply
