'use strict'

const { Entity } = require('./entity')
const { EntitySet } = require('./set')
const { Changeset } = require('./changeset')

class Factory {
  #schema

  constructor (schema) {
    this.#schema = schema
  }

  init (id) {
    return new Entity(this.#schema, id)
  }

  object (record) {
    return new Entity(this.#schema, record)
  }

  objects (recordset) {
    const set = recordset.map((record) => this.object(record))

    return new EntitySet(set)
  }

  changeset (query) {
    return new Changeset(this.#schema, query)
  }
}

exports.Factory = Factory
