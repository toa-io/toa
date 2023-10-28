'use strict'

/**
 * @implements {toa.core.bridges.Algorithm}
 */
class Computation {
  #context

  async mount (context) {
    this.#context = context
  }

  async execute (input) {
    return { input, context: this.#context !== undefined }
  }
}

exports.Computation = Computation
