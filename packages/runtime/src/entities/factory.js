'use strict'

const { Entity } = require('./entity')

class Factory {
  #schema
  #storage

  constructor (schema, storage) {
    this.#schema = schema
    this.#storage = storage
  }

  blank () {
    return new Entity(this.#schema, this.#storage.id())
  }

  create (object) {
    const entity = new Entity(this.#schema)

    entity.state = object

    return entity
  }
}

exports.Factory = Factory
