'use strict'

/**
 * @implements {toa.core.bridges.Algorithm}
 */
class Transition {
  #context

  constructor (context) {
    this.#context = context
  }

  async run (input, object) {
    return { output: { input, state: object, context: this.#context !== undefined } }
  }
}

exports.Transition = Transition
