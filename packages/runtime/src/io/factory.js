'use strict'

const { Typed } = require('./typed')

class Factory {
  #schemas

  constructor (schemas) {
    this.#schemas = schemas
  }

  create () {
    return new Typed(this.#schemas)
  }
}

exports.Factory = Factory
