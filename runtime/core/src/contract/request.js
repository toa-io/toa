'use strict'

const clone = require('clone-deep')

const { Conditions } = require('./conditions')
const { Exception } = require('./exception')
const schemas = require('./schemas')

class Request extends Conditions {
  #query
  #operation

  constructor (schema, query, operation) {
    super(schema)

    this.#query = query
    this.#operation = operation
  }

  fit (request) {
    super.fit(request)

    if (request.query) request.query = this.#query.parse(request.query)

    // no projection for transitions
  }

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

    return schema
  }

  static EXCEPTION = Exception.PRECONDITION
}

exports.Request = Request
