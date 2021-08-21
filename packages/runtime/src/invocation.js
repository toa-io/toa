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

  async invoke (input = null, q = null) {
    // TODO: try/catch?
    const { ok, oh, io } = this.#io.create(input)

    if (!ok) {
      io.error = oh

      return io
    }

    let query

    try { query = this.#query.parse(q) } catch (oh) { io.error = oh }

    if (query !== undefined) {
      await this.#operation.invoke(io, query)
    }

    io.fit()

    return io
  }
}

exports.Invocation = Invocation
