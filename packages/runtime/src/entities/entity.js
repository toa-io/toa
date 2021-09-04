'use strict'

const { id } = require('./id')

class Entity {
  #schema
  #state

  blank = false

  constructor (schema, argument) {
    this.#schema = schema

    if (argument) {
      this.#state = argument
    } else {
      this.blank = true
      this.#state = { id: id(), ...this.#schema.defaults() }
    }
  }

  get () {
    return this.#state
  }

  set (value) {
    const error = this.#schema.fit(value)

    if (error) return error

    this.#state = value
  }
}

exports.Entity = Entity
