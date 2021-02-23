'use strict'

class Operation {
  #algorithm

  name

  constructor (algorithm) {
    this.name = algorithm.name
    this.#algorithm = algorithm
  }

  async execute (io) {
    await this.#algorithm.func(io)
  }
}

exports.Operation = Operation
