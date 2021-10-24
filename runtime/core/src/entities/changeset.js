'use strict'

const { EntityContractException } = require('../exceptions')

class Changeset {
  query

  #schema
  #state

  constructor (schema, query) {
    this.query = query

    this.#schema = schema
    this.#state = schema.system()
  }

  get () {
    return this.#state
  }

  set (value) {
    const error = this.#schema.match(value)

    if (error) throw new EntityContractException(error)

    this.#state = value
  }

  export () {
    return {
      changeset: this.#state,
      defaults: this.#schema.defaults()
    }
  }
}

exports.Changeset = Changeset
