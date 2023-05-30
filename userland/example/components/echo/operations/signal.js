'use strict'

class Effect {
  #context

  async mount (context) {
    this.#context = context
  }

  async execute () {
    return this.#context.configuration.signal
  }
}

exports.Effect = Effect
