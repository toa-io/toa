'use strict'

const { criteria } = require('./query/criteria')

class Query {
  #properties
  #criteria

  constructor (query, properties) {
    this.#criteria = query?.criteria
    this.#properties = properties
  }

  parse (q) {
    if (q === null) { return null }

    // TODO: query schema
    const query = {}

    // TODO: attach #criteria
    query.criteria = criteria(q.criteria, this.#properties)

    return query
  }
}

exports.Query = Query
