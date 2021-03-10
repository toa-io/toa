'use strict'

const { criteria } = require('./query/criteria')

class Query {
  #schema

  constructor (schema) {
    this.#schema = schema
  }

  parse (query) {
    query.criteria = criteria(query.criteria, this.#schema)

    return query
  }
}

exports.Query = Query
