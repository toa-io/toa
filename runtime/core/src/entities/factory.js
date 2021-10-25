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

  entity (record) {
    return new Entity(this.#schema, record)
  }

  set (recordset) {
    const set = recordset.map((record) => this.entity(record))

    return new EntitySet(set)
  }

  changeset (query) {
    return new Changeset(this.#schema, query)
  }
}

exports.Factory = Factory
