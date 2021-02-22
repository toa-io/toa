import IO from './io'

export default class Runtime {
  #operations = {}

  /**
   * @param operations {Array.<Invocation | Call>}
   */
  constructor (operations) {
    for (const operation of operations) {
      this.#operations[operation.name] = operation
    }
  }

  /**
   * @param name {string} - Operation name
   * @returns {Promise<IO>}
   */
  async invoke (name) {
    if (!(name in this.#operations)) { throw new Error(`Operation '${name}' not found`) }

    const io = new IO()

    await this.#operations[name].invoke(io)

    return io
  }
}
