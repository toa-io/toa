/**
 * @implements {toa.node.Algorithm}
 */
export class Transition {
  #context

  async mount (context) {
    this.#context = context
  }

  async execute (input, object) {
    return { input, state: object, context: this.#context !== undefined }
  }
}
