'use strict'

const { empty } = require('@toa.io/generic')
const parse = { ...require('./query/criteria'), ...require('./query/options') }

class Query {
  #properties
  #system

  constructor (properties) {
    this.#properties = properties
    this.#system = Object.keys(properties).filter((key) => properties[key].system === true)
  }

  /**
   * @param {toa.core.request.Query} query
   * @returns {toa.core.storages.Query}
   */
  parse (query) {
    /** @type {toa.core.storages.Query} */
    const result = {}
    const { id, version, criteria, ...rest } = query

    const options = this.#options(rest)

    if (id !== undefined) result.id = id
    if (version !== undefined) result.version = version
    if (criteria !== undefined) result.criteria = parse.criteria(criteria, this.#properties)
    if (options !== undefined) result.options = options

    return result
  }

  #options (options) {
    if (empty(options)) return

    return parse.options(options, this.#properties, this.#system)
  }
}

exports.Query = Query
