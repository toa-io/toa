'use strict'

/**
 * @implements {toa.core.bridges.Algorithm}
 */
class Assignment {
  #foo

  async mount (context) {
    this.#foo = context.configuration.foo
  }

  async execute (input, changeset) {
    const foo = this.#foo

    return foo
  }
}

exports.Assignment = Assignment
