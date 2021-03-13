'use strict'

const { criteria } = require('./query/criteria')

class Query {
  #criteria

  constructor (query) {
    this.#criteria = query.criteria
  }

  parse (query) {
    if (query === null) { return { ok: true, query: null } }

    query.criteria = criteria(query.criteria, this.#criteria)

    return query
  }
}

exports.Query = Query
