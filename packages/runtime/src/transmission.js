'use strict'

const { Connector } = require('./connector')

class Transmission extends Connector {
  #endpoint
  #bindings

  constructor (endpoint, bindings) {
    super()

    this.#endpoint = endpoint
    this.#bindings = bindings

    this.depends(bindings)
  }

  async request (input, query) {
    const binding = this.#pick()

    return binding.request(this.#endpoint.name, input, query)
  }

  #pick () {
    // TODO: implement strategies
    return this.#bindings[0]
  }
}

exports.Transmission = Transmission
