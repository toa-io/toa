'use strict'

const { newid } = require('./newid')
const { Entity } = require('./entity')
const { EntitySet } = require('./set')
const { Changeset } = require('./changeset')

class Factory {
  #schema
  #guards

  constructor (schema, guards) {
    this.#schema = schema
    this.#guards = guards
  }

  fit (values) {
    this.#schema.validate({ id: newid(), ...values }, 'Entity')
  }

  init (id) {
    return new Entity(this.#schema, id, this.#guards)
  }

  object (record, mutable = true) {
    return new Entity(this.#schema, record, this.#guards, mutable)
  }

  objects (recordset, init, mutable = true) {
    const set = recordset.map((record) => this.object(record, mutable))

    if (init !== undefined) 
      for (const id of init)
        set.unshift(this.init(id))

    return new EntitySet(set)
  }

  changeset (query) {
    return new Changeset(this.#schema, query)
  }
}

exports.Factory = Factory
