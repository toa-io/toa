/**
 * Operation invocation
 */
export default class Invocation {
  #operation
  #schema

  /**
   * @param operation {Operation | Call}
   * @param schema {Schema}
   */
  constructor (operation, schema) {
    this.#operation = operation
    this.#schema = schema
  }

  /**
   * Validate input then invoke operation
   * @param io {IO}
   * @param args
   * @returns {Promise<void>}
   */
  async invoke (io, ...args) {
    const valid = this.#schema.fit(io.input)

    if (!valid) {
      io.error = new Error('Invalid operation input')
      return
    }

    io.close()
    await this.#operation.invoke(io, ...args)
  }
}
