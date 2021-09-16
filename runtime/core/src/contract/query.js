'use strict'

const { resolve } = require('path')
const { yaml } = require('@kookaburra/gears')

const parse = { ...require('./query/criteria'), ...require('./query/options') }

class Query {
  #properties

  constructor (properties) {
    this.#properties = properties
  }

  // TODO: constraints
  parse (query) {
    const result = {}
    const { criteria, ...rest } = query
    const options = this.#options(rest)

    if (criteria) result.criteria = parse.criteria(criteria, this.#properties)
    if (options) result.options = options

    return result
  }

  #options (options) {
    const defined = Object.keys(options)
      .reduce((defined, option) => defined || options[option] !== undefined, false)

    if (!defined) { return }

    return parse.options(options, this.#properties)
  }

  static schema = yaml.sync(resolve(__dirname, './query.yaml'))
}

exports.Query = Query
