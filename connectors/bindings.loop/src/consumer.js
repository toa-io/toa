'use strict'

const { Connector } = require('@kookaburra/runtime')

class Consumer extends Connector {
  #binding
  #locator

  constructor (bindings, locator) {
    super()

    this.#binding = bindings[locator.fqn]
    this.#locator = locator
  }

  async request (endpoint, input, query) {
    if (!this.#binding?.[endpoint]) return false

    return this.#binding[endpoint](input, query)
  }
}

exports.Consumer = Consumer
