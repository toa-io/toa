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
    const { ok, oh, io, query } = this.#parse(input, q)

    if (ok) {
      await this.#operation.invoke(io, query)
      io.fit()
    } else io.error = oh

    return io
  }

  #parse (input, query) {
    const result = this.#io.create(input)

    if (result.ok) Object.assign(result, this.#query.parse(query))

    return result
  }
}

exports.Invocation = Invocation
