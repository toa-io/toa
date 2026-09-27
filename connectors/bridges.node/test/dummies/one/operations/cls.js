/**
 * @implements {toa.node.Algorithm}
 */
export class Transition {
  #context

  async mount(context) {
    this.#context = context
  }

  async execute(input, entry) {
    return { input, state: entry, context: this.#context !== undefined }
  }
}
