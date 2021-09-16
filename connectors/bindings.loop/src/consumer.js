'use strict'

const { Connector } = require('@kookaburra/core')

class Consumer extends Connector {
  #bindings
  #locator

  constructor (bindings, locator) {
    super()

    this.#bindings = bindings
    this.#locator = locator
  }

  async request (endpoint, request) {
    const invoke = this.#endpoint(endpoint)

    if (!invoke) return false

    return invoke(request)
  }

  #endpoint (endpoint) {
    return this.#bindings[this.#locator.fqn]?.[endpoint]
  }
}

exports.Consumer = Consumer
