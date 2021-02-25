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
    const { ok, errors } = this.#schema?.fit(io.input) ?? { ok: true }

    io.close()

    if (ok) {
      await this.#operation.execute(io, ...args)
    } else {
      io.error.name = 'validation'
      io.error.errors = errors
    }

    io.freeze()
  }
}

exports.Invocation = Invocation
