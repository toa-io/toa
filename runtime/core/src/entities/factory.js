'use strict'

const { Entity } = require('./entity')
const { List } = require('./list')
const { Changeset } = require('./changeset')

class Factory {
  #schema

  constructor (schema) {
    this.#schema = schema
  }

  init (id) {
    return new Entity(this.#schema, id)
  }

  entry (entry) {
    return new Entity(this.#schema, entry)
  }

  list (entries) {
    entries = entries.map((entry) => this.entry(entry))

    return new List(entries)
  }

  changeset (query) {
    return new Changeset(this.#schema, query)
  }
}

exports.Factory = Factory
