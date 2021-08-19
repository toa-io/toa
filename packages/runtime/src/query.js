'use strict'

const { criteria } = require('./query/criteria')

class Query {
  #criteria

  constructor (query) {
    this.#criteria = query?.criteria
  }

  parse (q) {
    if (q === null) { return { ok: true, query: null } }

    // TODO: query schema
    const query = {}

    query.criteria = criteria(q.criteria, this.#criteria)

    return { query }
  }
}

exports.Query = Query
