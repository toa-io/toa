'use strict'

const clone = require('clone-deep')
const { difference, newid } = require('@toa.io/libraries/generic')

const { EntityContractException } = require('../exceptions')

class Entity {
  #schema
  #origin = null
  #state

  constructor (schema, argument) {
    this.#schema = schema

    if (typeof argument === 'object') {
      const object = clone(argument)
      this.set(object)
      this.#origin = argument
    } else {
      const id = typeof argument === 'string' ? argument : newid()
      this.#state = this.#initial(id)
    }
  }

  get () {
    return this.#state
  }

  set (value) {
    const error = this.#schema.fit(value)

    if (error !== null) throw new EntityContractException(error)

    this.#state = value
  }

  event () {
    return {
      origin: this.#origin,
      state: this.#state,
      changeset: this.#origin === null ? this.#state : difference(this.#origin, this.#state)
    }
  }

  #initial = (id) => ({ ...this.#schema.defaults({ id }), _version: 0 })
}

exports.Entity = Entity
