'use strict'

const { Conditions } = require('./conditions')
const { Query } = require('./query')
const { Exception } = require('./exception')

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

  static schema (input) {
    return Conditions.schema({ input, query: Query.schema })
  }

  static EXCEPTION = Exception.PRECONDITION
}

exports.Request = Request
