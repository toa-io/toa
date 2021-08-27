'use strict'

const { criteria } = require('./query/criteria')
const { options } = require('./query/options')

class Query {
  #properties
  #criteria

  constructor (query, properties) {
    this.#criteria = query?.criteria
    this.#properties = properties
  }

  parse (query) {
    // TODO: query schema
    const result = { options: Query.#options(query) }

    // TODO: constraints
    if (query.criteria) { result.criteria = criteria(query.criteria, this.#properties) } else { query.criteria = null }

    return result
  }

  static #options ({ omit, limit, sort, projection }) {
    if (omit || limit || sort || projection) { return options({ omit, limit, sort, projection }) } else { return null }
  }
}

exports.Query = Query
