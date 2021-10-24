'use strict'

const { Entity } = require('./entity')
const { Entries } = require('./entries')
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

  entries (entries) {
    entries = entries.map((entry) => this.entry(entry))

    return new Entries(entries)
  }

  changeset (query) {
    return new Changeset(this.#schema, query)
  }
}

exports.Factory = Factory
