'use strict'

/**
 * @implements {toa.core.bridges.Algorithm}
 */
class Observation {
  #foo

  async mount (context) {
    this.#foo = context.configuration.foo
  }

  async execute (input, object) {
    const foo = this.#foo

    return { output: { foo } }
  }
}

exports.Observation = Observation
