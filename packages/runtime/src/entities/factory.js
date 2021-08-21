'use strict'

const { Entity } = require('./entity')
const { Set } = require('./set')

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

  create (entry) {
    return new Entity(this.#schema, entry)
  }

  set (entries) {
    const set = entries.map((entry) => this.create(entry))

    return new Set(set)
  }
}

exports.Factory = Factory
