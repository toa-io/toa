'use strict'

class Computation {
  #context

  async mount (context) {
    this.#context = context
  }

  async execute () {
    return this.#context.configuration.signal
  }
}

exports.Computation = Computation
