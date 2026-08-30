'use strict'

const { empty } = require('@toa.io/generic')
const parse = { ...require('./query/criteria'), ...require('./query/options') }

class Query {
  #properties
  #system

  /** @type {Map<string, object>} parsed criteria by their expression */
  #asts = new Map()

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
    const { id, ids, version, criteria, search, ...rest } = query

    const options = this.#options(rest)

    if (id !== undefined) result.id = id
    if (ids !== undefined) result.ids = ids
    if (version !== undefined) result.version = version
    if (criteria !== undefined) result.criteria = this.#criteria(criteria)
    if (search !== undefined) result.search = search
    if (options !== undefined) result.options = options

    return result
  }

  #options (options) {
    if (empty(options)) return

    return parse.options(options, this.#properties, this.#system)
  }

  /**
   * Lexing an RSQL expression is the most expensive thing this class does, and the same
   * expression arrives over and over: a route builds it from its own declaration and the
   * request parameters. The tree is only read downstream — a storage builds a fresh query
   * from it — so it is kept rather than parsed again.
   *
   * Expressions come from the client, hence the bound. An invalid one throws before it
   * reaches the cache.
   */
  #criteria (criteria) {
    const known = this.#asts.get(criteria)

    if (known !== undefined) return known

    const ast = parse.criteria(criteria, this.#properties)

    if (this.#asts.size >= LIMIT) this.#asts.clear()

    this.#asts.set(criteria, ast)

    return ast
  }
}

const LIMIT = 1024

exports.Query = Query
