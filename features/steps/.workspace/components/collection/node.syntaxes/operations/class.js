'use strict'

class Transition {
  #context

  constructor (context) {
    this.#context = context
  }

  async run (input, object) {
    const foo = this.#context.configuration.foo

    return { foo }
  }
}

exports.Transition = Transition
