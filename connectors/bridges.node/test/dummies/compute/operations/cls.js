/**
 * @implements {import('@toa.io/core/types').bridges.Algorithm}
 */
export class Computation {
  #context

  async mount (context) {
    this.#context = context
  }

  async execute (input) {
    return { input, context: this.#context !== undefined }
  }
}
