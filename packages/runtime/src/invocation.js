'use strict'

class Invocation {
  #operation
  #schema

  constructor (operation, schema) {
    this.#operation = operation
    this.#schema = schema
  }

  async invoke (io, ...args) {
    const valid = this.#schema?.fit(io.input) ?? true

    io.close()

    if (valid) {
      await this.#operation.execute(io, ...args)
    } else {
      io.error.message = 'Invalid input'
      io.error.errors = this.#schema.errors
    }

    io.freeze()
  }
}

exports.Invocation = Invocation
