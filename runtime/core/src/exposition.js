'use strict'

const { Connector } = require('./connector')

class Exposition extends Connector {
  locator

  #runtime

  constructor (runtime) {
    super()

    this.locator = runtime.locator
    this.#runtime = runtime
  }

  discover () {
    return this.#runtime.locator.export()
  }

  async invoke (name, input) {
    return { output: this[name](input) }
  }

  static endpoints () {
    return Object.getOwnPropertyNames(this.prototype)
      .filter((name) => name !== 'constructor' && name !== 'invoke')
  }
}

exports.Exposition = Exposition
