'use strict'

class Observation {
  #foo

  async mount (context) {
    this.#foo = context.configuration.foo
  }

  async execute (input, object) {
    return this.#foo
  }
}

exports.Observation = Observation
