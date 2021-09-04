'use strict'

class Invocation {
  #call
  #io
  #query

  constructor (call, io, query) {
    this.#call = call
    this.#io = io
    this.#query = query
  }

  async invoke (input = null, query = null) {
    const io = this.#io.create()

    io.input = input

    if (io.error) return [null, io.error]

    if (query) {
      const [parsed, error] = this.#query.parse(query)

      if (error) {
        io.error = error

        return [null, io.error]
      } else {
        query = parsed
      }
    }

    const [output, error] = await this.#call.invoke(io.input, query)

    if (error) io.error = error
    else if (output) {
      io.output = output

      if (io.error) throw io.error
    }

    return [io.output, io.error]
  }
}

exports.Invocation = Invocation
