/**
 * Algorithm execution
 */
export default class Operation {
  #algorithm

  /**
   * @param algorithm {function}
   */
  constructor (algorithm) {
    this.#algorithm = algorithm
  }

  /**
   * Execute algorithm
   * - retrieve current state
   * - execute algorithm with (io, state, runtime)
   * - persist updated state
   * @param io {IO}
   * @returns {Promise<void>}
   */
  async execute (io) {
    await this.#algorithm(io)
  }
}
