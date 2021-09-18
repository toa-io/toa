'use strict'

const { Connector } = require('./connector')
const { Exception } = require('./exception')

class Transmission extends Connector {
  #declaration
  #bindings

  constructor (declaration, bindings) {
    super()

    this.#declaration = declaration
    this.#bindings = bindings

    this.depends(bindings)
  }

  async request (request) {
    let reply = false
    let i = 0

    while (reply === false && i < this.#bindings.length) {
      reply = await this.#bindings[i].request(this.#declaration.name, request)
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
