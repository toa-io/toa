'use strict'

const { Connector } = require('./connector')
const { Exception } = require('./exception')

class Transmission extends Connector {
  #endpoint
  #bindings

  constructor (endpoint, bindings) {
    super()

    this.#endpoint = endpoint
    this.#bindings = bindings

    this.depends(bindings)
  }

  async request (request) {
    let reply = false
    let i = 0

    while (reply === false && i < this.#bindings.length) {
      reply = await this.#bindings[i].request(this.#endpoint, request)
      i++
    }

    if (reply === false) {
      throw new Exception(Exception.TRANSMISSION,
      `Transmission '${this.#endpoint}' failed. All (${this.#bindings.length}) bindings rejected.`)
    }

    return reply
  }
}

exports.Transmission = Transmission
