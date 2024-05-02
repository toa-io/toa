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
    this.#state = schema.system()
  }

  get () {
    return this.#state
  }

  set (value) {
    const error = this.#schema.adapt(value)

    if (error !== null) throw new EntityContractException(error)

    value._updated = Date.now()

    this.#state = value
  }

  export () {
    return this.#state
  }
}

exports.Changeset = Changeset
