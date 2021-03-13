'use strict'

const { freeze } = require('@kookaburra/gears')

class IO {
  input
  output
  error

  #schemas

  constructor (input, schemas) {
    this.#schemas = schemas

    this.input = input
    this.output = this.#schemas.output.defaults()
    this.error = this.#schemas.error.defaults()

    freeze(this.input)
    Object.seal(this)
  }

  fit () {
    this.#fitOutput()
    this.#fitError()
  }

  #fitOutput () {
    const { ok, oh } = this.#schemas.output.fit(this.output)

    if (!ok) { throw new Error(oh.message) }

    this.output = IO.#nullify(this.output)
    freeze(this.output)
  }

  #fitError () {
    this.error = IO.#nullify(this.error)

    if (this.error === null) return

    this.output = null

    const { ok, oh } = this.#schemas.error.fit(this.error)

    if (!ok) throw new Error(oh.message)

    freeze(this.error)
  }

  static #nullify = (value) => value && (Object.keys(value).length === 0 ? null : value)
}

exports.IO = IO
