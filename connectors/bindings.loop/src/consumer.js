'use strict'

const { Connector } = require('@kookaburra/runtime')

class Consumer extends Connector {
  #bindings
  #locator

  constructor (bindings, locator) {
    super()

    this.#bindings = bindings
    this.#locator = locator
  }

  async request (endpoint, input, query) {
    const invoke = this.#endpoint(endpoint)

    if (!invoke) return false

    return invoke(input, query)
  }

  #endpoint(endpoint) {
    return this.#bindings[this.#locator.fqn]?.[endpoint]
  }
}

exports.Consumer = Consumer
