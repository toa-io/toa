'use strict'

const { merge } = require('@toa.io/gears')

class Query {
  #constraints

  constructor (constraints) {
    this.#constraints = Object.entries(constraints)
  }

  /** @hot */
  parse (query, method) {
    for (const [key, constraint] of this.#constraints) {
      const value = constraint.parse(query[key], method)

      if (value !== undefined) query[key] = value
    }

    return query
  }

  static merge (node) {
    const query = {}
    let current = node

    do {
      if (current.query !== undefined) merge(query, current.query, { ignore: true })

      current = current.parent
    } while (current !== undefined)

    merge(query, DEFAULT, { ignore: true })

    return query
  }
}

const DEFAULT = {
  omit: {
    range: [0, 1000]
  },
  limit: {
    value: 100,
    range: [1, 100]
  }
}

exports.Query = Query
