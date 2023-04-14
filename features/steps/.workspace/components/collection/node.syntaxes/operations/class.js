'use strict'

/**
 * @implements {toa.core.bridges.Algorithm}
 */
class Transition {
  #foo

  constructor (context) {
    this.#foo = context.configuration.foo
  }

  async execute (input, object) {
    const foo = this.#foo

    return { output: { foo } }
  }
}

exports.Transition = Transition
