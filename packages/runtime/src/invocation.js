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

    if (!ok) {
      io.error.name = 'validation'
      io.error.errors = errors
      return
    }

    io.close()
    await this.#operation.execute(io, ...args)
    io.freeze()
  }
}

exports.Invocation = Invocation
