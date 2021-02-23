'use strict'

module.exports = class Operation {
  #algorithm

  constructor (algorithm) {
    this.#algorithm = algorithm
  }

  async execute (io) {
    await this.#algorithm(io)
  }
}
