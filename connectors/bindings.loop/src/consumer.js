'use strict'

const { Connector } = require('@kookaburra/core')

class Consumer extends Connector {
  #bindings
  #locator
  #endpoint

  constructor (bindings, locator, endpoint) {
    super()

    this.#bindings = bindings
    this.#locator = locator
    this.#endpoint = endpoint
  }

  async request (request) {
    const invoke = this.#bindings[this.#locator.id]?.[this.#endpoint]

    if (invoke === undefined) return false
    else return invoke(request)
  }
}

exports.Consumer = Consumer
