'use strict'

const { Connector } = require('./connector')

class Context extends Connector {
  #promises
  #remotes

  constructor (promises) {
    super()

    this.#promises = promises
  }

  async connection () {
    // circular dependencies are being resolved via promises
    if (this.#promises) this.#remotes = await Promise.all(this.#promises)
  }

  get remotes () {
    return this.#remotes
  }
}

exports.Context = Context
