'use strict'

const { Entity } = require('./entity')

class Factory {
  #schema
  #id

  constructor (schema, id) {
    this.#schema = schema
    this.#id = id
  }

  create (value) {
    if (value) {
      const valid = this.#schema.fit(value)

      if (!valid) {
        throw new Error(`Storage object (#${value._id}) does not match entity schema. Probably data is corrupted.\n` +
          `Schema errors: ${JSON.stringify(this.#schema.errors, null, 2)}`)
      }
    } else {
      value = { _id: this.#id(), ...this.#schema.defaults() }
    }

    return new Entity(value, this.#schema)
  }
}

exports.Factory = Factory
