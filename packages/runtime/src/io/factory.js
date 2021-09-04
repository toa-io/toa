'use strict'

const { IO } = require('./io')

class Factory {
  #schemas

  constructor (schemas) {
    this.#schemas = schemas
  }

  create () {
    return new IO(this.#schemas)
  }
}

exports.Factory = Factory
