'use strict'

const { Entity } = require('./entity')
const { Set } = require('./set')

class Factory {
  #schema
  #id

  constructor (schema, id) {
    this.#schema = schema
    this.#id = id
  }

  blank () {
    return new Entity(this.#schema, this.#id())
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
