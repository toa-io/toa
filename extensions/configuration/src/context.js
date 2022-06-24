'use strict'

const { Connector } = require('@toa.io/core')
const { traverse } = require('@toa.io/libraries/generic')

/**
 * @implements {toa.extensions.configuration.Context}
 */
class Context extends Connector {
  /** @readonly */
  name = 'configuration'

  #values

  constructor (schema) {
    super()

    this.#values = this.#define(schema.schema)
  }

  invoke (path) {
    let cursor = this.#values

    if (path !== undefined) {
      for (const segment of path) cursor = cursor[segment]
    }

    return cursor
  }

  #define (schema) {
    const defaults = (node) => {
      if (node.properties !== undefined) return { ...node.properties }
      if (node.default !== undefined) return node.default

      return null
    }

    return traverse(schema, defaults)
  }
}

exports.Context = Context
