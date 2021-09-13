'use strict'

const { Connector } = require('./connector')

class Transmission extends Connector {
  #operation
  #bindings

  constructor (operation, bindings) {
    super()

    this.#operation = operation
    this.#bindings = bindings

    this.depends(bindings)
  }

  async request (input, query) {
    return this.#pick().request(this.#operation.name, input, query)
  }

  #pick () {
    // TODO: implement strategies
    return this.#bindings[0]
  }
}

exports.Transmission = Transmission
