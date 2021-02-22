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
   * @param io {IO}
   * @param args {any}
   * @returns {Promise<void>}
   */
  async invoke (io, ...args) {
    const valid = this.#schema.fit(io.input)

    if (!valid) {
      io.error = new Error('Invalid operation input')
      return
    }

    io.close()
    await this.#operation.execute(io, ...args)
  }
}
