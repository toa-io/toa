/**
 * @implements {toa.core.bridges.Algorithm}
 */
export class Assignment {
  #foo

  async mount (context) {
    this.#foo = context.configuration.foo
  }

  async execute (input, changeset) {
    const foo = this.#foo

    return foo
  }
}
