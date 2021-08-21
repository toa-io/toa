'use strict'

const { IO } = require('./io')
const { codes } = require('./error')

class Factory {
  #schemas

  constructor (schemas) {
    this.#schemas = schemas
  }

  create (input = null) {
    const { ok, oh } = this.#schemas.input.fit(input)
    const io = new IO(input, this.#schemas)

    // TODO: create io.error
    // TODO: remove codes?
    if (!ok) oh.code = codes.INVALID_INPUT

    return { ok, oh, io }
  }
}

exports.Factory = Factory
