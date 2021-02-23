'use strict'

const IO = require('./io')

module.exports = class Runtime {
  #operations = {}

  constructor (operations) {
    for (const operation of operations) {
      this.#operations[operation.name] = operation
    }
  }

  async invoke (name) {
    if (!(name in this.#operations)) { throw new Error(`Operation '${name}' not found`) }

    const io = new IO()

    await this.#operations[name].invoke(io)

    return io
  }
}
