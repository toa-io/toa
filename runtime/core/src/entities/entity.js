'use strict'

const clone = require('clone-deep')
const { difference } = require('@kookaburra/gears')

const { id } = require('../id')
const { Exception } = require('../exception')

class Entity {
  #schema
  #origin = null
  #state

  initial = false

  constructor (schema, argument) {
    this.#schema = schema

    if (argument) {
      this.#state = clone(argument)
      this.#origin = argument
    } else {
      this.initial = true
      this.#state = this.#initial(id())
    }
  }

  get () {
    return this.#state
  }

  set (value) {
    const error = this.#schema.fit(value)

    if (error) throw new Exception(error)

    this.#state = { ...value }
  }

  event () {
    return {
      origin: this.#origin,
      state: this.#state,
      changeset: this.#origin === null ? this.#state : difference(this.#origin, this.#state)
    }
  }

  #initial = (id) => ({ id, ...this.#schema.defaults() })
}

exports.Entity = Entity
