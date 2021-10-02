'use strict'

const { Producer } = require('./producer')
const { Consumer } = require('./consumer')

class Factory {
  #bindings = {}

  producer (locator, endpoints, producer) {
    return new Producer(this.#bindings, locator, endpoints, producer)
  }

  consumer (locator, endpoint) {
    return new Consumer(this.#bindings, locator, endpoint)
  }
}

exports.Factory = Factory
