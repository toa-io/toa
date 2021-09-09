'use strict'

const { Connector } = require('../connector')

class Exposition extends Connector {
  locator

  #runtime

  constructor (locator, runtime) {
    super()

    this.locator = locator
    this.#runtime = runtime
  }

  discover () {
    return this.#runtime.locator.export()
  }

  async invoke (name, input) {
    return [this[name](input)]
  }

  static endpoints () {
    return Object.getOwnPropertyNames(this.prototype)
      .filter((name) => name !== 'constructor' && name !== 'invoke')
      .map((name) => ({ name }))
  }
}

exports.Exposition = Exposition
