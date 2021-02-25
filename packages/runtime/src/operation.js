'use strict'

class Operation {
  #algorithm

  constructor (algorithm) {
    this.#algorithm = algorithm
  }

  async execute (io) {
    await this.#algorithm.func(io)
  }
}

exports.Operation = Operation
