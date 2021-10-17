'use strict'

const schemas = require('./schemas')
const { RequestContractException } = require('../exceptions')
const { Conditions } = require('./conditions')

class Request extends Conditions {
  static Exception = RequestContractException

  static schema (definition) {
    const schema = { properties: {}, additionalProperties: false }
    const required = []

    if (definition?.input) {
      definition.input.additionalProperties = false
      schema.properties.input = definition.input
      required.push('input')
    }

    if (definition?.query !== false) schema.properties.query = schemas.query
    if (definition?.query === true) required.push('query')

    if (required.length > 0) schema.required = required

    // TODO: operation type's specific. not sure if it's schema's responsibility
    //  - no projection for transitions
    //  - no version for observations
    //  - no id and criteria at the same time ??

    return schema
  }
}

exports.Request = Request
