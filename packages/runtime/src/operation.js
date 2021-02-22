export default class Operation {
  #algorithm

  /**
   * @param algorithm {function}
   */
  constructor (algorithm) {
    this.#algorithm = algorithm
  }

  /**
   * @param io {IO}
   * @returns {Promise<void>}
   */
  async execute (io) {
    await this.#algorithm(io)
  }
}
