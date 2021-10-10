'use strict'

const { concat, empty } = require('@kookaburra/gears')
const parse = { ...require('./query/criteria'), ...require('./query/options') }

class Query {
  #properties
  #system

  constructor (properties) {
    this.#properties = properties
    this.#system = Object.keys(properties).filter((key) => properties[key].system === true)
  }

  // TODO: constraints
  parse (query) {
    const result = {}
    let { id, criteria, ...rest } = query
    const options = this.#options(rest)

    if (id) {
      criteria = 'id==' + id + concat(';', criteria)
      result.id = id
    }

    if (criteria) result.criteria = parse.criteria(criteria, this.#properties)
    if (options) result.options = options

    return result
  }

  #options (options) {
    if (empty(options)) return

    return parse.options(options, this.#properties, this.#system)
  }
}

exports.Query = Query
