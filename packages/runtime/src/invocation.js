'use strict'

class Invocation {
  #operation
  #io
  #query

  constructor (operation, io, query) {
    this.#operation = operation
    this.#io = io
    this.#query = query
  }

  async invoke (input = null, query = null) {
    const io = this.#io.create()

    try {
      io.input = input

      if (query) { query = this.#query.parse(query) }

      await this.#operation.invoke(io, query)
    } catch (e) {
      if (e instanceof Error) { throw e }

      io.error = e
    }

    return io
  }
}

exports.Invocation = Invocation
