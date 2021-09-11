'use strict'

const { Producer } = require('./producer')
const { Consumer } = require('./consumer')

class Factory {
  producer (runtime, endpoints) {
    return new Producer(Factory.#bindings, runtime, endpoints)
  }

  consumer (locator) {
    return new Consumer(Factory.#bindings, locator)
  }

  exposition (runtime, endpoints) {
    return new Producer(Factory.#system, runtime, endpoints)
  }

  discovery (locator) {
    return new Consumer(Factory.#system, locator)
  }

  static #bindings = {}
  static #system = {}
}

exports.Factory = Factory
