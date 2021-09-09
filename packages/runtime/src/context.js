'use strict'

const { Connector } = require('./connector')

class Context extends Connector {
  #remotes

  constructor (remotes) {
    super()

    this.#remotes = remotes
  }

  async connection () {
    // circular dependencies are being resolved via promises
    if (this.#remotes) this.#remotes = await Promise.all(this.#remotes)
  }

  get remotes () {
    return this.#remotes
  }
}

exports.Context = Context
