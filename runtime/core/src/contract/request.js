'use strict'

const clone = require('clone-deep')

const schemas = require('./schemas')
const { Exception } = require('../exception')
const { Conditions } = require('./conditions')

class Request extends Conditions {
  static schema (declaration) {
    const schema = clone(schemas.request)
    const required = []

    if (declaration?.input) {
      schema.properties.input = declaration.input
      required.push('input')
    }

    if (declaration?.query === false) delete schema.properties.query
    if (declaration?.query === true) required.push('query')

    if (required.length > 0) schema.required = required

    // TODO: operation type's specific. not sure if it's schema's responsibility
    //  - no projection for transitions

    return schema
  }

  static EXCEPTION = Exception.PRECONDITION
}

exports.Request = Request
