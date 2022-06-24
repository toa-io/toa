'use strict'

const { merge } = require('@toa.io/libraries/generic')

/**
 * @implements {toa.extensions.exposition.Query}
 */
class Query {
  #constraints

  constructor (constraints) {
    this.#constraints = Object.entries(constraints)
  }

  /** @hot */
  parse (query, operation) {
    for (const [key, constraint] of this.#constraints) {
      const value = constraint.parse(query?.[key], operation)

      if (value !== undefined) {
        if (query === undefined) query = {}

        query[key] = value
      }
    }

    return query
  }

  /**
   * @param {toa.extensions.exposition.declarations.Node} node
   * @returns {toa.extensions.exposition.declarations.Query}
   */
  static merge (node) {
    const query = {}
    let current = node

    do {
      if (current.query !== undefined) merge(query, current.query, { ignore: true })

      current = current.parent
    } while (current !== undefined)

    merge(query, DEFAULTS, { ignore: true })

    return query
  }
}

const DEFAULTS = {
  omit: {
    range: [0, 1000]
  },
  limit: {
    value: 100,
    range: [1, 100]
  }
}

exports.Query = Query
