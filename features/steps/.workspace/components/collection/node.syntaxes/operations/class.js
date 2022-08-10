'use strict'

class Transition {
  #foo

  constructor (context) {
    this.#foo = context.configuration.foo
  }

  async run (input, object) {
    const foo = this.#foo

    return { foo }
  }
}

exports.Transition = Transition
