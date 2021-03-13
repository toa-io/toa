'use strict'

const { IO } = require('./io')

class Factory {
  #schemas

  constructor (schemas) {
    this.#schemas = schemas
  }

  create (input = null) {
    const { ok, oh } = this.#schemas.input.fit(input)
    const io = new IO(input, this.#schemas)

    return { ok, oh, io }
  }
}

exports.Factory = Factory
