'use strict'

const { freeze } = require('@kookaburra/gears')

class IO {
  #schemas
  #values = { input: null, output: null, error: null }

  constructor (schemas) {
    this.#schemas = schemas
  }

  get input () {
    return this.#values.input
  }

  get output () {
    return this.#values.output
  }

  get error () {
    return this.#values.error
  }

  set input (value) {
    this.#set('input', value)
  }

  set output (value) {
    this.#set('output', value)
  }

  #set (channel, value) {
    const error = this.#schemas[channel].fit(value)

    if (error) this.error = error
    else this.#values[channel] = freeze(value)
  }

  set error (value) {
    const error = this.#schemas.error.fit(value)

    if (error) throw error
    else this.#values.error = freeze(value)
  }
}

exports.IO = IO
