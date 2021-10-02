'use strict'

const { Connector } = require('./connector')
const { Exception } = require('./exception')

class Transmission extends Connector {
  #bindings

  constructor (bindings) {
    super()

    this.#bindings = bindings
    this.depends(bindings)
  }

  async request (request) {
    let reply = false
    let i = 0

    while (reply === false && i < this.#bindings.length) {
      reply = await this.#bindings[i].request(request)
      i++
    }

    if (reply === false) {
      throw new Exception(Exception.TRANSMISSION,
        `Transmission failed. All (${this.#bindings.length}) bindings rejected.`)
    }

    return reply
  }
}

exports.Transmission = Transmission
