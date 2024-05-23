'use strict'

const { EntityContractException } = require('../exceptions')

class Changeset {
  /** @type {toa.core.Query} */
  query

  #schema
  #state

  constructor (schema, query) {
    this.query = query

    this.#schema = schema
    this.#state = {}
  }

  get () {
    return this.#state
  }

  set (value) {
    const error = this.#schema.fitOptional(value)

    if (error !== null)
      throw new EntityContractException(error)

    delete value._version
    value._updated = Date.now()

    this.#state = value
  }

  export () {
    return this.#state
  }
}

exports.Changeset = Changeset
