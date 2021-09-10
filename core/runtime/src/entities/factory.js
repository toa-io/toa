'use strict'

const { Entity } = require('./entity')
const { Set } = require('./set')

class Factory {
  #schema

  constructor (schema) {
    this.#schema = schema
  }

  blank () {
    return new Entity(this.#schema)
  }

  entry (entry) {
    return new Entity(this.#schema, entry)
  }

  set (entries) {
    const set = entries.map((entry) => this.entry(entry))

    return new Set(set)
  }
}

exports.Factory = Factory
