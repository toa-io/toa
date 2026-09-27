export class Transition {
  #foo

  async mount(context) {
    this.#foo = context.configuration.foo
  }

  async execute(input, entry) {
    return this.#foo
  }
}
