/**
 * @implements {toa.core.bridges.Algorithm}
 */
export class Transition {
  #foo

  async mount (context) {
    this.#foo = context.configuration.foo
  }

  async execute (input, object) {
    return this.#foo
  }
}
