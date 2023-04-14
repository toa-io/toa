'use strict'

/**
 * @implements {toa.node.Algorithm}
 */
class Transition {
  #context

  async mount (context) {
    this.#context = context
  }

  async execute (input, object) {
    return { output: { input, state: object, context: this.#context !== undefined } }
  }
}

exports.Transition = Transition
