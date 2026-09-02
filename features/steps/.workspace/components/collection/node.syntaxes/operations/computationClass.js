/**
 * @implements {toa.core.bridges.Algorithm}
 */
class Computation {
  #foo

  async mount (context) {
    this.#foo = context.configuration.foo
  }

  async execute (input) {
    return this.#foo
  }
}

export { Computation }
