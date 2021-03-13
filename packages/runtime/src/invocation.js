'use strict'

const { error } = require('./io')

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
    } else {
      io.error = oh
    }

    io.fit()

    return io
  }

  #parse (input, query) {
    const result = this.#parseInput(input)

    if (result.ok) { Object.assign(result, this.#parseQuery(query)) }

    return result
  }

  #parseInput (value) {
    const result = this.#io.create(value)

    if (!result.ok) { result.oh.code = error.codes.INVALID_INPUT }

    return result
  }

  #parseQuery (value) {
    const result = this.#query.parse(value)

    if (!result.ok) { result.oh.code = error.codes.INVALID_QUERY }

    return result
  }
}

exports.Invocation = Invocation
