'use strict'

const { Connector } = require('./connector')
const { Exception } = require('./exception')

class Dynamic extends Connector {
  #bindings

  constructor (bindings) {
    super()

    this.#bindings = bindings
    this.depends(bindings)
  }

  async request (endpoint, request) {
    let reply = false
    let i = 0

    while (reply === false && i < this.#bindings.length) {
      reply = await this.#bindings[i].request(endpoint, request)
      i++
    }

    if (reply === false) {
      throw new Exception(Exception.TRANSMISSION,
        `Transmission '${endpoint}' failed. All (${this.#bindings.length}) bindings rejected.`)
    }

    return reply
  }
}

class Transmission extends Dynamic {
  #endpoint

  constructor (bindings, endpoint) {
    super(bindings)

    this.#endpoint = endpoint
  }

  async request (request) {
    return super.request(this.#endpoint, request)
  }
}

Transmission.Dynamic = Dynamic

exports.Transmission = Transmission
