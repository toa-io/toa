'use strict'

class Invocation {
  name

  #operation
  #schema

  constructor (operation, schema) {
    this.name = operation.name
    this.#operation = operation
    this.#schema = schema
  }

  async invoke (io, ...args) {
    const valid = this.#schema?.fit(io.input) ?? true

    if (!valid) {
      io.error = new Error('Invalid operation input')
      return
    }

    io.close()
    await this.#operation.execute(io, ...args)
  }
}

exports.Invocation = Invocation
